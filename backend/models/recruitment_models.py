"""Shared Pydantic models for recruitment module"""
from typing import Optional, List
from pydantic import BaseModel


class RecruiterLogin(BaseModel):
    email: str
    password: str


class PostCreate(BaseModel):
    post_type: str
    title: str
    description: Optional[str] = ""
    role_type: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[str] = None
    air_filter: Optional[int] = None
    min_qualification: Optional[str] = None
    deadline: Optional[str] = None
    screening_questions: Optional[List[str]] = []
    num_questions: Optional[int] = None
    time_limit: Optional[int] = None
    reward: Optional[str] = None
    questions: Optional[list] = []
    top_n_shortlist: Optional[int] = None
    theme: Optional[str] = None
    prizes: Optional[dict] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    team_size: Optional[int] = 1
    submission_format: Optional[str] = None
    event_type: Optional[str] = None
    event_date: Optional[str] = None
    platform: Optional[str] = None
    registration_limit: Optional[int] = None


class QuizSubmission(BaseModel):
    answers: dict


class HackathonSubmission(BaseModel):
    project_link: str
    description: Optional[str] = ""


class CompanyUpdate(BaseModel):
    company_name: Optional[str] = None
    about: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    gst_number: Optional[str] = None
    employee_count: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    founding_year: Optional[str] = None


class CommentCreate(BaseModel):
    text: str
    parent_id: Optional[str] = None


class BulkStatusUpdate(BaseModel):
    app_ids: List[str]
    status: str


class BulkShortlistByAIR(BaseModel):
    max_air: int


class QuizAutoShortlistConfig(BaseModel):
    top_n: Optional[int] = None
    min_percentage: Optional[float] = None


class SendCredentialsEmail(BaseModel):
    email: str
    name: str
    password: str
    role: str = "recruiter"


class CompanyVerificationUpdate(BaseModel):
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    cin_number: Optional[str] = None
    verified_email: Optional[bool] = None
    verified_mobile: Optional[bool] = None
    verified_gst: Optional[bool] = None
    verified_pan: Optional[bool] = None
    verified_cin: Optional[bool] = None
    admin_notes: Optional[str] = None


class AdminLogin(BaseModel):
    email: str
    password: str
