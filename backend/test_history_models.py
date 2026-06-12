"""
Test History — Pydantic models (Pydantic v1 syntax).

NOTE: written in Pydantic v1 style per spec (`@root_validator`, `class Config`).
The installed Pydantic 2.x runs this unchanged via its v1 deprecation shims,
and the file is copy-paste compatible with a real Pydantic v1 install.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, root_validator


class TopicBreakdown(BaseModel):
    """Per-topic performance embedded inside a test attempt."""
    topic: str
    chapter: str
    questions_total: int = 0
    questions_attempted: int = 0
    questions_correct: int = 0
    score: float = 0.0


class TestHistoryCreate(BaseModel):
    """Client payload for saving a completed test attempt."""
    test_id: str
    test_name: str
    subject: str
    exam_category: str

    started_at: datetime
    completed_at: datetime
    time_spent_seconds: int = Field(..., ge=0)

    total_marks: float = Field(..., ge=0)
    marks_obtained: float = Field(..., ge=0)

    questions_total: int = Field(..., ge=0)
    questions_attempted: int = Field(0, ge=0)
    questions_correct: int = Field(0, ge=0)
    questions_wrong: int = Field(0, ge=0)
    questions_skipped: int = Field(0, ge=0)

    topic_breakdown: List[TopicBreakdown] = []

    is_battle: bool = False
    opponent_user_id: Optional[str] = None


class TestHistoryEntry(TestHistoryCreate):
    """Stored document — one per completed attempt, in `test_history`."""
    id: str
    user_id: str
    percentage: float = 0.0  # auto-calculated, never trusted from the client
    s3_key: Optional[str] = None
    created_at: Optional[datetime] = None

    @root_validator(pre=True)
    def _auto_calculate_percentage(cls, values):
        total = float(values.get("total_marks") or 0)
        obtained = float(values.get("marks_obtained") or 0)
        values["percentage"] = round((obtained / total) * 100, 2) if total > 0 else 0.0
        return values

    def to_doc(self) -> dict:
        """Mongo document — datetimes stored as ISO strings (codebase convention)."""
        doc = self.dict()
        for key in ("started_at", "completed_at", "created_at"):
            if isinstance(doc.get(key), datetime):
                doc[key] = doc[key].isoformat()
        return doc
