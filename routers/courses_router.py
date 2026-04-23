from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, Body, HTTPException
from starlette import status
from starlette.responses import JSONResponse
from core.auth_tools import get_current_payload, require_doctor, require_doctor_or_patient
from services.courses_service import CoursesService
from shcemas.course_schemas import CoursesCreate, CoursesUpdate

router = APIRouter(prefix="/courses", tags=["course"], dependencies=[Depends(get_current_payload)])
Service = Annotated[CoursesService, Depends(CoursesService)]

@router.post("/create", dependencies= [Depends(require_doctor)])
async def create_course(course_service: Service, course: CoursesCreate = Body(), doctor_id: dict = Depends(get_current_payload)):
    await course_service.create_course(course, doctor_id.get("id"))
    return JSONResponse(
            status_code=200,
            content={"message": "Course created successfully", "status": "ok"}
        )

@router.get("/{course_id:uuid}", dependencies=[Depends(require_doctor_or_patient)])
async def get_course(course_service: Service, course_id: UUID):
    return await course_service.get_course(course_id)

@router.put("/{course_id:uuid}/update")
async def update_existing_course(course_id: UUID, course_update: CoursesUpdate, course_service: Service, doctor_id: dict = Depends(get_current_payload)):
    try:
        updated_course = await course_service.update_course(
            course_id=course_id,
            course_update_dto=course_update
        )
        return {"message": "Курс успішно оновлено", "course_id": updated_course.id}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Помилка оновлення курсу")

@router.get("/{course_id:uuid}/patients", dependencies=[Depends(require_doctor)])
async def get_patients_on_course(course_service: Service, course_id: UUID):
    return await course_service.get_patients_on_course(course_id)

@router.delete("/{course_id:uuid}", dependencies= [Depends(require_doctor)])
async def delete_course(course_service: Service, course_id: UUID, doctor_id: dict = Depends(get_current_payload)):
    return await course_service.delete_course(course_id, doctor_id.get("id"))

@router.get("/{course_id:uuid}/content", dependencies=[Depends(require_doctor_or_patient)])
async def get_course_content(course_service: Service, course_id: UUID):
    content = await course_service.get_course_content(course_id)
    if isinstance(content, dict) and "message" in content and len(content) == 1:
        return JSONResponse(status_code=404, content=content)
    return content

@router.get("/{course_id:uuid}/patient-content", dependencies=[Depends(require_doctor_or_patient)])
async def get_patient_content(
        course_id: UUID,
        course_service: Service,
        current_user: dict = Depends(get_current_payload)
):
    content = await course_service.get_patient_course_content(course_id, current_user.get("id"))
    if isinstance(content, dict) and "message" in content and len(content) == 1:
        return JSONResponse(status_code=403, content=content)
    return content

@router.post("/{course_id:uuid}/complete-day", dependencies=[Depends(require_doctor_or_patient)])
async def complete_course_day(course_id: UUID, course_service: Service, current_user: dict = Depends(get_current_payload)):
    result = await course_service.complete_course_day(course_id, current_user.get("id"))
    return JSONResponse(status_code=200, content=result)

@router.get("/{course_id:uuid}/number-of-difficulty", dependencies=[Depends(require_doctor_or_patient)])
async def get_number_of_difficulty(course_service: Service, course_id: UUID):
    result = await course_service.get_course_levels_of_difficulty(course_id)
    return JSONResponse(status_code=200, content=result)

@router.patch("/{course_id:uuid}/change-difficulty", dependencies=[Depends(require_doctor_or_patient)])
async def change_difficulty(course_service: Service, course_id: UUID, patient_id: UUID, new_difficulty: int):
    await course_service.change_difficulty(course_id, patient_id, new_difficulty)
    return JSONResponse(status_code=200, content={"message": "Difficulty changed successfully", "status": "ok"})

@router.get("/{course_id:uuid}/difficulty", dependencies=[Depends(require_doctor_or_patient)])
async def get_current_difficulty(course_service: Service, course_id: UUID, patient_id: UUID):
    return await course_service.get_current_difficulty(patient_id, course_id)