from typing import Annotated
from fastapi import APIRouter, Depends, Form
from core.auth_tools import get_current_doctor
from services.courses_servises.courses_doctor_service import CoursesDoctorService
from shcemas.course_schemas import CoursesResponse, CoursesCreate

router = APIRouter(prefix="/doctor/courses", tags=["course(doctor)"], dependencies=[Depends(get_current_doctor)])
Service = Annotated[CoursesDoctorService, Depends(CoursesDoctorService)]

@router.post("/create", response_model=CoursesResponse)
async def create_course(course_service: Service, course: CoursesCreate = Form(), doctor_id: int = Depends(get_current_doctor)):
    return await course_service.create_course(course, doctor_id)

@router.get("/{course_id:int}")
async def get_course(course_service: Service, course_id: int, doctor_id: int = Depends(get_current_doctor)):
    return await course_service.get_course(course_id, doctor_id)

@router.get("")
async def get_all_courses(course_service: Service, doctor_id: int = Depends(get_current_doctor)):
    return await course_service.get_all_courses(doctor_id)

@router.delete("/{course_id:int}")
async def delete_course(course_service: Service, course_id: int, doctor_id: int = Depends(get_current_doctor)):
    return await course_service.delete_course(course_id, doctor_id)

