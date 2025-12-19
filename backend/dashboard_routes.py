"""
Dashboard Routes - AI-Powered Study Dashboard
Provides user stats, subject mastery, AI weekly schedule, and AI insights
Personalized based on user's study goal (Competitive Exams or CBSE Classes)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

# Study Goal Categories
STUDY_GOALS = {
    "competitive": {
        "name": "Competitive Exams",
        "categories": [
            {"id": "jee", "name": "JEE (Engineering)", "subjects": ["Physics", "Chemistry", "Mathematics"]},
            {"id": "neet", "name": "NEET (Medical)", "subjects": ["Physics", "Chemistry", "Biology"]},
            {"id": "upsc", "name": "UPSC (Civil Services)", "subjects": ["General Studies", "Current Affairs", "History", "Geography", "Polity", "Economy"]},
            {"id": "defence", "name": "Defence Exams", "subjects": ["Mathematics", "English", "General Knowledge", "Reasoning"]},
            {"id": "banking", "name": "Banking & SSC", "subjects": ["Quantitative Aptitude", "Reasoning", "English", "General Awareness"]},
            {"id": "gate", "name": "GATE", "subjects": ["Engineering Mathematics", "General Aptitude", "Core Subject"]},
            {"id": "cat", "name": "CAT (MBA)", "subjects": ["Quantitative Aptitude", "Verbal Ability", "Data Interpretation", "Logical Reasoning"]}
        ]
    },
    "cbse": {
        "name": "CBSE Classes",
        "categories": [
            {"id": "class_6", "name": "Class 6", "subjects": ["Mathematics", "Science", "Social Science", "English", "Hindi"]},
            {"id": "class_7", "name": "Class 7", "subjects": ["Mathematics", "Science", "Social Science", "English", "Hindi"]},
            {"id": "class_8", "name": "Class 8", "subjects": ["Mathematics", "Science", "Social Science", "English", "Hindi"]},
            {"id": "class_9", "name": "Class 9", "subjects": ["Mathematics", "Science", "Social Science", "English", "Hindi"]},
            {"id": "class_10", "name": "Class 10", "subjects": ["Mathematics", "Science", "Social Science", "English", "Hindi"]},
            {"id": "class_11_science", "name": "Class 11 (Science)", "subjects": ["Physics", "Chemistry", "Mathematics", "Biology", "English"]},
            {"id": "class_11_commerce", "name": "Class 11 (Commerce)", "subjects": ["Accountancy", "Business Studies", "Economics", "Mathematics", "English"]},
            {"id": "class_12_science", "name": "Class 12 (Science)", "subjects": ["Physics", "Chemistry", "Mathematics", "Biology", "English"]},
            {"id": "class_12_commerce", "name": "Class 12 (Commerce)", "subjects": ["Accountancy", "Business Studies", "Economics", "Mathematics", "English"]}
        ]
    }
}

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "test_database")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Pydantic models
class DashboardStatsResponse(BaseModel):
    success: bool
    stats: Dict[str, Any]
    subject_mastery: List[Dict[str, Any]]
    learner_level: str
    
class WeeklyScheduleResponse(BaseModel):
    success: bool
    schedule: List[Dict[str, Any]]
    week_start: str
    generated_at: str

class AIInsightsResponse(BaseModel):
    success: bool
    insights: Dict[str, Any]
    generated_at: str

class RecommendedTestsResponse(BaseModel):
    success: bool
    tests: List[Dict[str, Any]]


def calculate_learner_level(tests_completed: int, avg_score: float) -> str:
    """Calculate learner level based on tests and score"""
    if tests_completed < 5:
        return "Beginner"
    elif tests_completed < 15:
        if avg_score >= 70:
            return "Learner"
        return "Beginner"
    elif tests_completed < 30:
        if avg_score >= 75:
            return "Intermediate"
        return "Learner"
    elif tests_completed < 50:
        if avg_score >= 80:
            return "Advanced"
        return "Intermediate"
    elif tests_completed < 100:
        if avg_score >= 85:
            return "Expert"
        return "Advanced"
    else:
        if avg_score >= 90:
            return "Master"
        return "Expert"


@router.get("/stats/{user_id}")
async def get_dashboard_stats(user_id: str):
    """Get user dashboard statistics including tests completed, avg score, streak, and study hours"""
    try:
        # Get quiz history for the user
        quiz_history = await db.quiz_history.find(
            {"user_id": user_id},
            {"_id": 0}
        ).to_list(1000)
        
        # Calculate stats
        tests_completed = len(quiz_history)
        
        # Calculate average score
        if tests_completed > 0:
            total_score = sum(q.get("score", 0) for q in quiz_history)
            avg_score = round(total_score / tests_completed, 1)
        else:
            avg_score = 0
        
        # Calculate streak (consecutive days with at least one quiz)
        streak = 0
        if quiz_history:
            # Sort by date
            sorted_history = sorted(
                quiz_history, 
                key=lambda x: x.get("completed_at", x.get("created_at", "")),
                reverse=True
            )
            
            # Get unique dates
            quiz_dates = set()
            for q in sorted_history:
                date_str = q.get("completed_at", q.get("created_at", ""))
                if date_str:
                    try:
                        if isinstance(date_str, str):
                            date_obj = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                        else:
                            date_obj = date_str
                        quiz_dates.add(date_obj.date())
                    except:
                        pass
            
            # Calculate streak
            today = datetime.now(timezone.utc).date()
            current_date = today
            
            while current_date in quiz_dates:
                streak += 1
                current_date -= timedelta(days=1)
        
        # Calculate study hours (estimate: 3 minutes per question on average)
        total_questions = sum(q.get("total_questions", 10) for q in quiz_history)
        study_hours = round(total_questions * 3 / 60, 1)  # Convert to hours
        
        # Calculate subject mastery
        subject_stats = {}
        for q in quiz_history:
            subject = q.get("subject", q.get("exam", "General"))
            if subject not in subject_stats:
                subject_stats[subject] = {"total_score": 0, "count": 0, "total_questions": 0}
            subject_stats[subject]["total_score"] += q.get("score", 0)
            subject_stats[subject]["count"] += 1
            subject_stats[subject]["total_questions"] += q.get("total_questions", 10)
        
        # Format subject mastery with colors
        colors = [
            {"gradient": "from-emerald-500 to-emerald-600", "text": "text-emerald-600"},
            {"gradient": "from-blue-500 to-blue-600", "text": "text-blue-600"},
            {"gradient": "from-purple-500 to-purple-600", "text": "text-purple-600"},
            {"gradient": "from-amber-500 to-amber-600", "text": "text-amber-600"},
            {"gradient": "from-pink-500 to-pink-600", "text": "text-pink-600"},
            {"gradient": "from-cyan-500 to-cyan-600", "text": "text-cyan-600"},
        ]
        
        subject_mastery = []
        for i, (subject, stats) in enumerate(sorted(subject_stats.items(), key=lambda x: x[1]["count"], reverse=True)[:6]):
            mastery = round(stats["total_score"] / stats["count"], 1) if stats["count"] > 0 else 0
            color = colors[i % len(colors)]
            subject_mastery.append({
                "subject": subject,
                "mastery": mastery,
                "tests_taken": stats["count"],
                "questions_attempted": stats["total_questions"],
                "gradient": color["gradient"],
                "textColor": color["text"]
            })
        
        # Calculate learner level
        learner_level = calculate_learner_level(tests_completed, avg_score)
        
        return {
            "success": True,
            "stats": {
                "tests_completed": tests_completed,
                "avg_score": avg_score,
                "streak": streak,
                "study_hours": study_hours
            },
            "subject_mastery": subject_mastery,
            "learner_level": learner_level
        }
        
    except Exception as e:
        print(f"Error fetching dashboard stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/schedule/{user_id}")
async def get_weekly_schedule(user_id: str):
    """Get AI-generated weekly study schedule"""
    try:
        # Check if we have a valid schedule for this week
        today = datetime.now(timezone.utc)
        week_start = today - timedelta(days=today.weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        
        existing_schedule = await db.weekly_schedules.find_one(
            {
                "user_id": user_id,
                "week_start": {"$gte": week_start.isoformat()}
            },
            {"_id": 0}
        )
        
        if existing_schedule:
            return {
                "success": True,
                "schedule": existing_schedule.get("schedule", []),
                "week_start": existing_schedule.get("week_start", week_start.isoformat()),
                "generated_at": existing_schedule.get("generated_at", "")
            }
        
        # Generate new schedule using AI
        schedule = await generate_ai_schedule(user_id)
        
        # Store the schedule
        schedule_doc = {
            "user_id": user_id,
            "week_start": week_start.isoformat(),
            "schedule": schedule,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.weekly_schedules.insert_one(schedule_doc)
        
        return {
            "success": True,
            "schedule": schedule,
            "week_start": week_start.isoformat(),
            "generated_at": schedule_doc["generated_at"]
        }
        
    except Exception as e:
        print(f"Error fetching weekly schedule: {e}")
        # Return a default schedule if AI fails
        return {
            "success": True,
            "schedule": get_default_schedule(),
            "week_start": datetime.now(timezone.utc).isoformat(),
            "generated_at": datetime.now(timezone.utc).isoformat()
        }


@router.get("/insights/{user_id}")
async def get_ai_insights(user_id: str):
    """Get AI-powered study insights"""
    try:
        # Check for recent insights (within last 24 hours)
        yesterday = datetime.now(timezone.utc) - timedelta(hours=24)
        
        existing_insights = await db.ai_insights.find_one(
            {
                "user_id": user_id,
                "generated_at": {"$gte": yesterday.isoformat()}
            },
            {"_id": 0}
        )
        
        if existing_insights:
            return {
                "success": True,
                "insights": existing_insights.get("insights", {}),
                "generated_at": existing_insights.get("generated_at", "")
            }
        
        # Generate new insights
        insights = await generate_ai_insights(user_id)
        
        # Store the insights
        insights_doc = {
            "user_id": user_id,
            "insights": insights,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.ai_insights.insert_one(insights_doc)
        
        return {
            "success": True,
            "insights": insights,
            "generated_at": insights_doc["generated_at"]
        }
        
    except Exception as e:
        print(f"Error fetching AI insights: {e}")
        return {
            "success": True,
            "insights": get_default_insights(),
            "generated_at": datetime.now(timezone.utc).isoformat()
        }


@router.get("/recommended-tests/{user_id}")
async def get_recommended_tests(user_id: str):
    """Get AI-recommended tests based on performance"""
    try:
        # Get user's quiz history
        quiz_history = await db.quiz_history.find(
            {"user_id": user_id},
            {"_id": 0}
        ).to_list(100)
        
        # Analyze weak areas
        subject_scores = {}
        for q in quiz_history:
            subject = q.get("subject", q.get("exam", "General"))
            if subject not in subject_scores:
                subject_scores[subject] = []
            subject_scores[subject].append(q.get("score", 0))
        
        # Find subjects with lowest average scores
        weak_subjects = []
        for subject, scores in subject_scores.items():
            avg = sum(scores) / len(scores) if scores else 0
            weak_subjects.append({"subject": subject, "avg_score": avg})
        
        weak_subjects.sort(key=lambda x: x["avg_score"])
        
        # Generate recommendations
        recommendations = []
        
        # Get available chapters/tests from cbse_chapter_data
        from cbse_chapter_data import CBSE_CHAPTER_DATA
        
        # Add recommendations based on weak subjects
        for i, weak in enumerate(weak_subjects[:3]):
            subject = weak["subject"]
            match_percent = max(60, 95 - int(weak["avg_score"] * 0.3))
            
            # Find a relevant chapter
            chapter_name = "Practice Test"
            for class_num, subjects in CBSE_CHAPTER_DATA.items():
                for subj_name, chapters in subjects.items():
                    if subject.lower() in subj_name.lower() and chapters:
                        chapter_name = chapters[0].get("chapter_name", "Practice Test")
                        break
            
            recommendations.append({
                "id": f"rec_{i+1}",
                "title": f"{subject} - {chapter_name}",
                "description": f"Improve your {subject} skills with targeted practice",
                "match_percent": match_percent,
                "duration": "15 mins",
                "questions": 10,
                "difficulty": "Medium" if weak["avg_score"] >= 50 else "Easy",
                "subject": subject,
                "priority": "high" if i == 0 else "medium"
            })
        
        # Add some general recommendations if not enough weak subjects
        if len(recommendations) < 4:
            general_recs = [
                {
                    "id": "rec_general_1",
                    "title": "Daily Quick Quiz",
                    "description": "Keep your skills sharp with a quick mixed quiz",
                    "match_percent": 85,
                    "duration": "10 mins",
                    "questions": 10,
                    "difficulty": "Mixed",
                    "subject": "Mixed",
                    "priority": "medium"
                },
                {
                    "id": "rec_general_2",
                    "title": "Challenge Mode",
                    "description": "Test yourself with harder questions",
                    "match_percent": 75,
                    "duration": "20 mins",
                    "questions": 15,
                    "difficulty": "Hard",
                    "subject": "Mixed",
                    "priority": "low"
                }
            ]
            recommendations.extend(general_recs[:4 - len(recommendations)])
        
        return {
            "success": True,
            "tests": recommendations
        }
        
    except Exception as e:
        print(f"Error fetching recommended tests: {e}")
        return {
            "success": True,
            "tests": []
        }


@router.post("/regenerate-schedule/{user_id}")
async def regenerate_weekly_schedule(user_id: str):
    """Force regenerate the weekly schedule"""
    try:
        # Delete existing schedule for this week
        today = datetime.now(timezone.utc)
        week_start = today - timedelta(days=today.weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        
        await db.weekly_schedules.delete_many({
            "user_id": user_id,
            "week_start": {"$gte": week_start.isoformat()}
        })
        
        # Generate new schedule
        return await get_weekly_schedule(user_id)
        
    except Exception as e:
        print(f"Error regenerating schedule: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def generate_ai_schedule(user_id: str) -> List[Dict]:
    """Generate AI-powered weekly study schedule"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.getenv("EMERGENT_LLM_KEY")
        if not api_key:
            return get_default_schedule()
        
        # Get user's quiz history for context
        quiz_history = await db.quiz_history.find(
            {"user_id": user_id},
            {"_id": 0}
        ).to_list(50)
        
        subjects = list(set(q.get("subject", "General") for q in quiz_history))
        if not subjects:
            subjects = ["Mathematics", "Science", "English"]
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"schedule_{user_id}_{datetime.now().strftime('%Y%m%d')}",
            system_message="You are an AI study planner. Generate personalized weekly study schedules in JSON format."
        ).with_model("openai", "gpt-4o-mini")
        
        prompt = f"""Generate a weekly study schedule for a student studying these subjects: {', '.join(subjects[:5])}.

Return ONLY a valid JSON array with 7 objects (one for each day), each containing:
- "day": day name (Monday to Sunday)
- "date": relative date description
- "sessions": array of 2-3 study sessions, each with:
  - "time": time slot (e.g., "9:00 AM - 10:30 AM")
  - "subject": subject name
  - "topic": specific topic to study
  - "duration": duration in minutes
  - "type": one of "study", "practice", "review", "test"
  - "priority": one of "high", "medium", "low"

Make it realistic with breaks and varied activities. Return ONLY the JSON array, no other text."""

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        try:
            # Clean the response
            response_text = response.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            schedule = json.loads(response_text.strip())
            return schedule
        except json.JSONDecodeError:
            print(f"Failed to parse AI schedule response: {response[:200]}")
            return get_default_schedule()
            
    except Exception as e:
        print(f"Error generating AI schedule: {e}")
        return get_default_schedule()


async def generate_ai_insights(user_id: str) -> Dict:
    """Generate AI-powered study insights"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.getenv("EMERGENT_LLM_KEY")
        if not api_key:
            return get_default_insights()
        
        # Get user's quiz history
        quiz_history = await db.quiz_history.find(
            {"user_id": user_id},
            {"_id": 0}
        ).to_list(100)
        
        if not quiz_history:
            return get_default_insights()
        
        # Prepare stats for AI
        subject_scores = {}
        time_distribution = {"morning": 0, "afternoon": 0, "evening": 0, "night": 0}
        
        for q in quiz_history:
            subject = q.get("subject", "General")
            score = q.get("score", 0)
            
            if subject not in subject_scores:
                subject_scores[subject] = []
            subject_scores[subject].append(score)
            
            # Analyze time
            created_at = q.get("created_at", "")
            if created_at:
                try:
                    if isinstance(created_at, str):
                        dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                    else:
                        dt = created_at
                    hour = dt.hour
                    if 5 <= hour < 12:
                        time_distribution["morning"] += 1
                    elif 12 <= hour < 17:
                        time_distribution["afternoon"] += 1
                    elif 17 <= hour < 21:
                        time_distribution["evening"] += 1
                    else:
                        time_distribution["night"] += 1
                except:
                    pass
        
        # Calculate averages
        subject_avgs = {s: sum(scores)/len(scores) for s, scores in subject_scores.items()}
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"insights_{user_id}_{datetime.now().strftime('%Y%m%d')}",
            system_message="You are an AI study analyst. Provide personalized study insights in JSON format."
        ).with_model("openai", "gpt-4o-mini")
        
        prompt = f"""Analyze this student's performance and provide insights:

Subject Averages: {json.dumps(subject_avgs)}
Study Time Distribution: {json.dumps(time_distribution)}
Total Tests: {len(quiz_history)}

Return ONLY a valid JSON object with:
- "strengths": array of 2-3 strength areas with "area" and "description"
- "weaknesses": array of 2-3 areas to improve with "area" and "description"  
- "trends": object with "direction" (up/down/stable), "description"
- "best_study_time": object with "time" and "reason"
- "tip_of_the_day": a short motivational study tip

Return ONLY the JSON object, no other text."""

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        try:
            response_text = response.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            insights = json.loads(response_text.strip())
            return insights
        except json.JSONDecodeError:
            print(f"Failed to parse AI insights response: {response[:200]}")
            return get_default_insights()
            
    except Exception as e:
        print(f"Error generating AI insights: {e}")
        return get_default_insights()


def get_default_schedule() -> List[Dict]:
    """Return a default schedule if AI generation fails"""
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    schedule = []
    
    for i, day in enumerate(days):
        sessions = [
            {
                "time": "9:00 AM - 10:30 AM",
                "subject": ["Mathematics", "Science", "English", "Physics", "Chemistry"][i % 5],
                "topic": "Chapter Review",
                "duration": 90,
                "type": "study",
                "priority": "high"
            },
            {
                "time": "2:00 PM - 3:00 PM",
                "subject": ["Science", "English", "Mathematics", "Chemistry", "Physics"][i % 5],
                "topic": "Practice Problems",
                "duration": 60,
                "type": "practice",
                "priority": "medium"
            }
        ]
        
        if i < 5:  # Weekdays
            sessions.append({
                "time": "5:00 PM - 5:30 PM",
                "subject": "Mixed",
                "topic": "Quick Review",
                "duration": 30,
                "type": "review",
                "priority": "low"
            })
        
        schedule.append({
            "day": day,
            "date": f"Day {i + 1}",
            "sessions": sessions
        })
    
    return schedule


def get_default_insights() -> Dict:
    """Return default insights if AI generation fails"""
    return {
        "strengths": [
            {"area": "Consistency", "description": "You're making steady progress with regular practice"},
            {"area": "Problem Solving", "description": "Good analytical skills shown in quiz responses"}
        ],
        "weaknesses": [
            {"area": "Time Management", "description": "Consider spending more time on difficult topics"},
            {"area": "Review", "description": "Regular revision can help retain concepts better"}
        ],
        "trends": {
            "direction": "stable",
            "description": "Your performance has been consistent. Keep up the good work!"
        },
        "best_study_time": {
            "time": "Morning (9 AM - 12 PM)",
            "reason": "Most students perform better with fresh minds in the morning"
        },
        "tip_of_the_day": "Take short breaks every 45 minutes to maintain focus and retention!"
    }
