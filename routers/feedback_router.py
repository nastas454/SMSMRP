from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from core.auth_tools import get_current_payload
from services.feedback_service import CourseFeedbackService
from shcemas.feedback_schemas import CourseFeedbackResponse, CourseFeedbackCreate

router = APIRouter(prefix="/feedbacks", tags=["Feedbacks"], dependencies = [Depends(get_current_payload)])
Service = Annotated[CourseFeedbackService, Depends(CourseFeedbackService)]

@router.post("/{course_id}/feedback", response_model=CourseFeedbackResponse)
async def create_course_feedback(course_feedback_service: Service, course_id: UUID, feedback: CourseFeedbackCreate, patient_id: dict = Depends(get_current_payload)):
    try:
        result = await course_feedback_service.add_feedback(patient_id.get("id"), course_id, feedback)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{course_id}/feedback")
async def get_course_feedback(course_feedback_service: Service, course_id: UUID, patient_id: UUID):
    result = await course_feedback_service.get_feedbacks_for_course(patient_id, course_id)
    return result
