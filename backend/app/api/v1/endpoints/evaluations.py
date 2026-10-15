from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import Evaluation, EvaluationCriterion, Submission, User, Notification
from app.schemas.schemas import EvaluationCreate, EvaluationOut
from app.api.deps import get_current_user, require_coordinator_or_above

router = APIRouter()

@router.post("/", response_model=EvaluationOut)
def create_or_update_evaluation(
    eval_in: EvaluationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_above)
):
    submission = db.query(Submission).filter(Submission.id == eval_in.submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Validate criteria scores
    total = 0.0
    max_total = 0.0
    for crit in eval_in.criteria:
        if crit.score < 0 or crit.score > crit.max_score:
            raise HTTPException(
                status_code=400,
                detail=f"Score for '{crit.name}' must be between 0 and {crit.max_score}"
            )
        total += crit.score
        max_total += crit.max_score

    # Check for existing evaluation
    evaluation = db.query(Evaluation).filter(Evaluation.submission_id == eval_in.submission_id).first()
    if evaluation:
        # If already evaluated by someone else, check permissions
        evaluation.evaluator_id = current_user.id
        evaluation.total_score = total
        evaluation.max_score = max_total
        evaluation.feedback = eval_in.feedback
        evaluation.is_published = eval_in.is_published
        evaluation.evaluated_at = datetime.utcnow()
        
        # Clear existing criteria and recreate
        db.query(EvaluationCriterion).filter(EvaluationCriterion.evaluation_id == evaluation.id).delete()
    else:
        evaluation = Evaluation(
            submission_id=eval_in.submission_id,
            evaluator_id=current_user.id,
            total_score=total,
            max_score=max_total,
            feedback=eval_in.feedback,
            is_published=eval_in.is_published,
            evaluated_at=datetime.utcnow()
        )
        db.add(evaluation)
        db.flush()

    for crit in eval_in.criteria:
        c_record = EvaluationCriterion(
            evaluation_id=evaluation.id,
            name=crit.name,
            score=crit.score,
            max_score=crit.max_score,
            comments=crit.comments
        )
        db.add(c_record)

    submission.status = "EVALUATED"
    db.commit()
    db.refresh(evaluation)

    # Notify student if published
    if eval_in.is_published:
        notif = Notification(
            user_id=submission.user_id,
            title="Submission Evaluated",
            message=f"Your submission for '{submission.activity.topic}' has been scored: {total}/{max_total}. Feedback: {eval_in.feedback or 'Good job!'}",
            notification_type="INFO"
        )
        db.add(notif)
        db.commit()

    return get_evaluation_for_submission(submission.id, db, current_user)

@router.get("/submission/{submission_id}", response_model=EvaluationOut)
def get_evaluation_for_submission(
    submission_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # If student, ensure it is their own submission and it is published
    if current_user.role == "STUDENT":
        if submission.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only view evaluations for your own submissions")

    evaluation = db.query(Evaluation).filter(Evaluation.submission_id == submission_id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="No evaluation found for this submission")

    if current_user.role == "STUDENT" and not evaluation.is_published:
        raise HTTPException(status_code=400, detail="Evaluation results have not yet been published")

    criteria_list = [
        {"name": c.name, "score": c.score, "max_score": c.max_score, "comments": c.comments}
        for c in evaluation.criteria
    ]

    return EvaluationOut(
        id=evaluation.id,
        submission_id=evaluation.submission_id,
        evaluator_id=evaluation.evaluator_id,
        total_score=evaluation.total_score,
        max_score=evaluation.max_score,
        feedback=evaluation.feedback,
        is_published=evaluation.is_published,
        evaluated_at=evaluation.evaluated_at,
        evaluator_name=evaluation.evaluator.full_name if evaluation.evaluator else None,
        criteria=criteria_list
    )
