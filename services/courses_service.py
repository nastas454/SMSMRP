from uuid import UUID
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from core.database import get_session_local
from models.courses import Courses
from repositories.courses_repository import CoursesRepository
from repositories.doctors_repository import DoctorsRepository
from repositories.patients_repository import PatientsRepository
from services.s3_service import S3Service
from shcemas.course_schemas import CoursesCreate, CoursesResponse, CoursesUpdate, PatientsOnCourseResponse

class CoursesService:
    def __init__(self, db: AsyncSession = Depends(get_session_local), s3_service: S3Service = Depends(S3Service)):
        self.db = db
        self.course_repo = CoursesRepository(db=self.db)
        self.patient_repo = PatientsRepository(db=self.db)
        self.doctor_repo = DoctorsRepository(db=self.db)
        self.s3 = s3_service

    async def create_course(self, course_create_dto: CoursesCreate, doctor_id: UUID):
        s3_key = self.s3.upload_course_json(course_create_dto.course_content)
        course_for_db = Courses(**course_create_dto.model_dump(exclude={"course_content"}))
        course_for_db.doctor_id = doctor_id
        course_for_db.course_s3_key = s3_key
        await self.course_repo.create_entity(course_for_db)

    async def update_course(self, course_id: UUID, course_update_dto: CoursesUpdate):
        existing_course = await self.course_repo.get_by_id(course_id)
        if not existing_course:
            raise ValueError("Курс не знайдено або доступ заборонено")
        if course_update_dto.course_content is not None:
            self.s3.upload_course_json(course_update_dto.course_content, key=existing_course.course_s3_key)
        update_data = course_update_dto.model_dump(exclude={"course_content"}, exclude_unset=True)
        for key, value in update_data.items():
            setattr(existing_course, key, value)
        await self.course_repo.change_entity(existing_course)
        return existing_course

    async def get_course(self, course_id: UUID):
        course = await self.course_repo.get_course(course_id)
        if course is None:
            return {"message": "Course not found"}
        return CoursesResponse.model_validate(course)

    async def delete_course(self, course_id: UUID, doctor_id: UUID):
        course = await self.course_repo.get_doctor_one_course(course_id, doctor_id)
        if course is None:
            return {"message": "Course not found"}
        await self.course_repo.delete_entity(course)
        return {
            "massage": "successfully deleted course"
        }

    async def get_patients_on_course(self, course_id: UUID):
        course = await self.course_repo.get_by_id(course_id)
        if course is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Курс не знайдений"
            )
        patients = await self.patient_repo.get_patients_on_course(course)
        if not patients:
            return []
        return [PatientsOnCourseResponse.model_validate(patient)for patient in patients]

    async def get_course_content(self, course_id: UUID):
        course = await self.course_repo.get_by_id(course_id)
        if course is None:
            return {"message": "Course not found"}
        s3_key = course.course_s3_key
        if not s3_key:
            return {"message": "Course content key is missing"}
        try:
            content = self.s3.get_course_json(s3_key)
            return content
        except Exception as e:
            return {"message": f"Failed to fetch content from storage: {str(e)}"}

    async def complete_course_day(self, course_id: UUID, patient_id: UUID):
        enrollment = await self.patient_repo.get_enrollment(patient_id, course_id)
        if not enrollment:
            return {"message": "Ви не записані на цей курс"}
        if not enrollment.is_active:
            return {"message": "Цей курс вже повністю завершено"}
        if enrollment.last_completed_at is not None:
            return {"message": "Ви вже завершили цей день, очікуйте відкриття наступного"}
        course = await self.course_repo.get_by_id(course_id)
        content = self.extract_level_data(self.s3.get_course_json(course.course_s3_key), enrollment.difficulty)
        if "error" in content:
            return content
        total_days = content.get("total_days", 1)
        current_day = enrollment.current_unlocked_day
        calculated_progress = int((current_day / total_days) * 100)
        enrollment.progress = min(calculated_progress, 100)
        if current_day >= total_days:
            enrollment.is_active = False
            enrollment.progress = 100
            enrollment.last_completed_at = datetime.utcnow()
            message = "Вітаємо! Курс повністю завершено."
        else:
            enrollment.last_completed_at = datetime.utcnow()
            message = "День успішно завершено"
        await self.db.commit()
        return {"message": message}

    async def get_patient_course_content(self, course_id: UUID, patient_id: UUID):
        course = await self.course_repo.get_by_id(course_id)
        if not course:
            return {"message": "Курс не знайдено"}
        enrollment = await self.patient_repo.get_enrollment(patient_id, course_id)
        if not enrollment:
            return {"message": "Ви не записані на цей курс"}
        content = self.s3.get_course_json(course.course_s3_key)
        if "error" in content:
            return content
        patient_difficulty = getattr(enrollment, 'difficulty', 2)
        levels = content.get("levels", [])
        total_days = 0
        days_data = []
        if levels:
            target_level = next((lvl for lvl in levels if lvl.get("difficulty") == patient_difficulty), None)
            if target_level:
                total_days = target_level.get("total_days", 0)
                days_data = target_level.get("days", [])
            else:
                return {"message": f"Рівень складності {patient_difficulty} не знайдено у цьому курсі"}
        else:
            total_days = content.get("total_days", 1)
            days_data = content.get("days", [])
        current_day = enrollment.current_unlocked_day
        if enrollment.last_completed_at and current_day < total_days:
            next_day_data = next((d for d in days_data if d["day_number"] == current_day + 1), None)
            if next_day_data:
                delay_hours = next_day_data.get("delay_hours_after_previous", 24)
                unlock_time = enrollment.last_completed_at + timedelta(hours=delay_hours)
                if datetime.utcnow() >= unlock_time:
                    enrollment.current_unlocked_day += 1
                    enrollment.last_completed_at = None
                    await self.db.commit()
                    current_day = enrollment.current_unlocked_day
        response = {
            "current_day": current_day,
            "total_days": total_days,
            "difficulty": patient_difficulty,
            "status": "in_progress",
            "day_content": None,
            "time_left": None
        }
        if enrollment.last_completed_at:
            if current_day >= total_days:
                response["status"] = "completed"
                response["message"] = "Курс повністю пройдено!"
            else:
                next_day_data = next((d for d in days_data if d["day_number"] == current_day + 1), None)
                delay_hours = next_day_data.get("delay_hours_after_previous", 24) if next_day_data else 24
                unlock_time = enrollment.last_completed_at + timedelta(hours=delay_hours)
                time_left = unlock_time - datetime.utcnow()
                response["status"] = "waiting"
                response["time_left"] = {
                    "hours": int(time_left.total_seconds() // 3600),
                    "minutes": int((time_left.total_seconds() % 3600) // 60)
                }
        else:
            current_day_data = next((d for d in days_data if d["day_number"] == current_day), None)
            response["day_content"] = current_day_data
        return response

    def extract_level_data(self, course_data: dict, target_difficulty: int) -> dict:
        levels = course_data.get("levels", [])
        found_level = next((lvl for lvl in levels if lvl.get("difficulty") == target_difficulty), None)
        if not found_level:
            return {"error": f"Рівень складності {target_difficulty} не знайдено"}
        return found_level

    async def get_course_levels_of_difficulty(self, course_id: UUID):
        course = await self.course_repo.get_by_id(course_id)
        if not course:
            raise Exception ("Course not found")
        content = self.s3.get_course_json(course.course_s3_key)
        levels_data = content.get("levels", [])
        difficulties = [
            item["difficulty"]
            for item in levels_data
            if isinstance(item, dict) and "difficulty" in item
        ]
        return difficulties

    async def change_difficulty(self, course_id: UUID, patient_id: UUID, new_difficulty: int):
        course_patient = await self.patient_repo.get_enrollment(patient_id, course_id)
        if not course_patient:
            raise Exception ("Course not found")
        course_patient.difficulty = new_difficulty
        self.db.add(course_patient)
        await self.db.commit()
        await self.db.refresh(course_patient)
        return True

    async def get_current_difficulty(self, patient_id: UUID, course_id: UUID):
        course_patient = await self.patient_repo.get_enrollment(patient_id, course_id)
        if not course_patient:
            raise Exception ("Course not found")
        return course_patient.difficulty
