from typing import Self
from uuid import UUID
from datetime import datetime, timedelta
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import SessionLocal, get_session_local
from models.courses import Courses
from repositories.courses_repository import CoursesRepository
from repositories.doctors_repository import DoctorsRepository
from repositories.patients_repository import PatientsRepository
from services.s3_service import S3Service
from shcemas.course_schemas import CoursesCreate, CoursesResponse
from shcemas.patient_schemas import PatientsResponse


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
        doctor = await self.doctor_repo.get_by_id(doctor_id)
        course_for_db.doctor_name = doctor.first_name
        course_for_db.doctor_lastname = doctor.last_name
        await self.course_repo.create_entity(course_for_db)

    async def get_course(self, course_id: UUID):
        course = await self.course_repo.get_by_id(course_id)
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
            return {"message": "Course not found"}
        patients = await self.patient_repo.get_patients_on_course(course)
        if not patients:
            return {"message": "Patients not found"}
        return patients

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
        content = self.s3.get_course_json(course.course_s3_key)
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

        current_day = enrollment.current_unlocked_day
        total_days = content.get("total_days", 1)
        days_data = content.get("days", [])

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