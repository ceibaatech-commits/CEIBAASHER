"""
Admin Real-Time Analytics Routes
Provides live data on battles, quiz attempts, user activity, and performance metrics
"""

from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta
import os
from database import db

router = APIRouter(prefix="/api/admin/analytics", tags=["admin-analytics"])

# ============== LIVE BATTLES ==============

@router.get("/live-battles")
async def get_live_battles(limit: int = 50):
    """Get currently active battles with real-time data"""
    try:
        # Fetch active battle sessions
        battle_sessions = await db.battle_sessions.find(
            {"status": {"$in": ["active", "in_progress"]}},
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)

        formatted_battles = []
        for battle in battle_sessions:
            formatted_battles.append({
                "id": battle.get("room_id", ""),
                "player1": battle.get("player1", {}).get("username", "Unknown"),
                "player1_score": battle.get("player1_score", 0),
                "player2": battle.get("player2", {}).get("username", "Unknown"),
                "player2_score": battle.get("player2_score", 0),
                "subject": battle.get("exam_id", "Unknown"),
                "status": battle.get("status", "active"),
                "started_at": battle.get("created_at", ""),
                "progress": f"{battle.get('current_question', 0)}/{battle.get('total_questions', 0)}",
                "exam_type": battle.get("exam_type", "competitive")
            })

        return {
            "success": True,
            "live_battles": formatted_battles,
            "total": len(formatted_battles)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== QUIZ ATTEMPTS ==============

@router.get("/quiz-attempts-today")
async def get_quiz_attempts_today(limit: int = 100):
    """Get users attempting quizzes today with details"""
    try:
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Fetch quiz attempts from today
        attempts = await db.quiz_attempts.find(
            {"created_at": {"$gte": today_start}},
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)

        formatted_attempts = []
        for attempt in attempts:
            formatted_attempts.append({
                "id": attempt.get("id", ""),
                "user": attempt.get("username", "Unknown"),
                "user_id": attempt.get("user_id", ""),
                "subject": attempt.get("exam_id", "Unknown"),
                "class": attempt.get("class_name", ""),
                "chapter": attempt.get("chapter_name", ""),
                "score": attempt.get("score", 0),
                "total_marks": attempt.get("total_marks", 100),
                "percentage": round((attempt.get("score", 0) / attempt.get("total_marks", 100)) * 100, 2) if attempt.get("total_marks") else 0,
                "time_taken": attempt.get("time_taken", 0),
                "status": attempt.get("status", "completed"),
                "attempted_at": attempt.get("created_at", "")
            })

        return {
            "success": True,
            "quiz_attempts": formatted_attempts,
            "total": len(formatted_attempts)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== ACTIVE USERS ==============

@router.get("/active-users")
async def get_active_users(minutes: int = 30, limit: int = 50):
    """Get users active in the last N minutes"""
    try:
        cutoff_time = datetime.utcnow() - timedelta(minutes=minutes)
        
        # Users with recent activity
        active_users = await db.users.find(
            {"last_activity": {"$gte": cutoff_time}},
            {"_id": 0, "username": 1, "email": 1, "profile_picture": 1, "last_activity": 1, "class": 1}
        ).sort("last_activity", -1).limit(limit).to_list(limit)

        return {
            "success": True,
            "active_users": active_users,
            "total": len(active_users),
            "time_window_minutes": minutes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== SUBJECT-WISE PERFORMANCE ==============

@router.get("/subject-performance")
async def get_subject_performance(days: int = 7):
    """Get performance metrics by subject for last N days"""
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Aggregate quiz attempts by subject
        pipeline = [
            {
                "$match": {
                    "created_at": {"$gte": cutoff_date}
                }
            },
            {
                "$group": {
                    "_id": "$exam_id",
                    "total_attempts": {"$sum": 1},
                    "avg_score": {"$avg": "$score"},
                    "max_score": {"$max": "$score"},
                    "min_score": {"$min": "$score"},
                    "users_attempted": {"$addToSet": "$user_id"}
                }
            },
            {
                "$project": {
                    "subject": "$_id",
                    "total_attempts": 1,
                    "avg_score": {"$round": ["$avg_score", 2]},
                    "max_score": 1,
                    "min_score": 1,
                    "unique_users": {"$size": "$users_attempted"},
                    "_id": 0
                }
            },
            {
                "$sort": {"total_attempts": -1}
            }
        ]

        results = await db.quiz_attempts.aggregate(pipeline).to_list(None)

        return {
            "success": True,
            "subject_performance": results,
            "days": days
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== DAILY ACTIVITY CHART ==============

@router.get("/daily-activity")
async def get_daily_activity(days: int = 7):
    """Get quiz attempts and battles for each day"""
    try:
        activity_data = []
        
        for i in range(days, 0, -1):
            date = (datetime.utcnow() - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
            next_date = date + timedelta(days=1)
            
            # Count quiz attempts for this day
            quiz_count = await db.quiz_attempts.count_documents({
                "created_at": {"$gte": date, "$lt": next_date}
            })
            
            # Count battles for this day
            battle_count = await db.battle_sessions.count_documents({
                "created_at": {"$gte": date, "$lt": next_date}
            })
            
            activity_data.append({
                "date": date.strftime("%Y-%m-%d"),
                "day": date.strftime("%a"),
                "quizzes": quiz_count,
                "battles": battle_count,
                "total": quiz_count + battle_count
            })

        return {
            "success": True,
            "daily_activity": activity_data,
            "days": days
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== TOP PERFORMERS ==============

@router.get("/top-performers")
async def get_top_performers(days: int = 7, limit: int = 20):
    """Get top scoring users in last N days"""
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        pipeline = [
            {
                "$match": {
                    "created_at": {"$gte": cutoff_date}
                }
            },
            {
                "$group": {
                    "_id": "$user_id",
                    "username": {"$first": "$username"},
                    "avg_score": {"$avg": "$score"},
                    "total_attempts": {"$sum": 1},
                    "max_score": {"$max": "$score"},
                    "subjects": {"$addToSet": "$exam_id"}
                }
            },
            {
                "$project": {
                    "username": 1,
                    "avg_score": {"$round": ["$avg_score", 2]},
                    "total_attempts": 1,
                    "max_score": 1,
                    "subjects_count": {"$size": "$subjects"},
                    "_id": 0
                }
            },
            {
                "$sort": {"avg_score": -1}
            },
            {
                "$limit": limit
            }
        ]

        top_users = await db.quiz_attempts.aggregate(pipeline).to_list(None)

        return {
            "success": True,
            "top_performers": top_users,
            "days": days
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== CLASS-WISE ACTIVITY ==============

@router.get("/class-activity")
async def get_class_activity(days: int = 7):
    """Get quiz attempts and performance by class"""
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        pipeline = [
            {
                "$match": {
                    "created_at": {"$gte": cutoff_date}
                }
            },
            {
                "$group": {
                    "_id": "$class_name",
                    "total_attempts": {"$sum": 1},
                    "avg_score": {"$avg": "$score"},
                    "unique_students": {"$addToSet": "$user_id"}
                }
            },
            {
                "$project": {
                    "class": "$_id",
                    "total_attempts": 1,
                    "avg_score": {"$round": ["$avg_score", 2]},
                    "unique_students": {"$size": "$unique_students"},
                    "_id": 0
                }
            },
            {
                "$sort": {"total_attempts": -1}
            }
        ]

        class_activity = await db.quiz_attempts.aggregate(pipeline).to_list(None)

        return {
            "success": True,
            "class_activity": class_activity,
            "days": days
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== REAL-TIME SUMMARY ==============

@router.get("/realtime-summary")
async def get_realtime_summary():
    """Get a summary of all real-time metrics"""
    try:
        # Today's date
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Get various counts
        today_quizzes = await db.quiz_attempts.count_documents({"created_at": {"$gte": today_start}})
        today_battles = await db.battle_sessions.count_documents({"created_at": {"$gte": today_start}})
        active_battles = await db.battle_sessions.count_documents({"status": {"$in": ["active", "in_progress"]}})
        
        # Last hour activity
        last_hour = datetime.utcnow() - timedelta(hours=1)
        last_hour_activity = await db.quiz_attempts.count_documents({"created_at": {"$gte": last_hour}})
        
        return {
            "success": True,
            "summary": {
                "today_quizzes": today_quizzes,
                "today_battles": today_battles,
                "active_battles_now": active_battles,
                "last_hour_activity": last_hour_activity,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
