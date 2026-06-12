"""
Test History service — auto-record completed attempts from quiz/battle flows.

`record_test_attempt` is deliberately best-effort: gameplay and submit
responses must never fail because archival failed. Mongo insert + S3 upload
errors are logged and swallowed.

Scoring conventions per flow:
- Solo/chapter quizzes & quiz rooms: 1 mark per question (marks = correct count).
- Battles (1v1 + live rooms): points-based, max 100 points/question
  (SCORE.MAX_PER_QUESTION on the client), so total_marks = questions x 100.
"""
import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi.concurrency import run_in_threadpool

from test_history_models import TestHistoryEntry
from test_history_s3 import build_s3_key, upload_test_attempt

logger = logging.getLogger(__name__)


async def record_test_attempt(
    db, *,
    user_id: str,
    test_id: str,
    test_name: str,
    subject: str,
    exam_category: str,
    total_marks: float,
    marks_obtained: float,
    questions_total: int,
    questions_attempted: int = 0,
    questions_correct: int = 0,
    questions_wrong: int = 0,
    questions_skipped: int = 0,
    time_spent_seconds: int = 0,
    topic_breakdown: Optional[List[dict]] = None,
    is_battle: bool = False,
    opponent_user_id: Optional[str] = None,
    completed_at: Optional[datetime] = None,
) -> None:
    """Persist one attempt to `test_history` + archive JSON to S3. Never raises."""
    if not user_id:
        return
    try:
        completed = completed_at or datetime.now(timezone.utc)
        time_spent = max(0, int(time_spent_seconds or 0))
        entry = TestHistoryEntry(
            id=str(uuid.uuid4()),
            user_id=user_id,
            test_id=str(test_id),
            test_name=test_name,
            subject=subject or "General",
            exam_category=exam_category or "General",
            started_at=completed - timedelta(seconds=time_spent),
            completed_at=completed,
            time_spent_seconds=time_spent,
            total_marks=max(0.0, float(total_marks or 0)),
            marks_obtained=max(0.0, float(marks_obtained or 0)),
            questions_total=max(0, int(questions_total or 0)),
            questions_attempted=max(0, int(questions_attempted or 0)),
            questions_correct=max(0, int(questions_correct or 0)),
            questions_wrong=max(0, int(questions_wrong or 0)),
            questions_skipped=max(0, int(questions_skipped or 0)),
            topic_breakdown=topic_breakdown or [],
            is_battle=is_battle,
            opponent_user_id=opponent_user_id,
            s3_key=build_s3_key(user_id, str(test_id), completed),
            created_at=datetime.now(timezone.utc),
        )
        doc = entry.to_doc()
        await db.test_history.insert_one(dict(doc))
        uploaded = await run_in_threadpool(upload_test_attempt, doc, entry.s3_key)
        if not uploaded:
            await db.test_history.update_one({"id": entry.id}, {"$set": {"s3_key": None}})
    except Exception as exc:
        logger.warning("[test-history] auto-record failed for user %s test %s: %s",
                       user_id, test_id, exc)
