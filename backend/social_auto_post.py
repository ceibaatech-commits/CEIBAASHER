"""
Social Feed Auto-Post Utilities
Automatically create social feed posts for quiz completions and achievements
"""
from datetime import datetime, timezone
import uuid
from typing import Optional, Dict, Any

db = None

def init_db(database):
    global db
    db = database


async def auto_post_quiz_result(
    user_id: str,
    quiz_data: Dict[str, Any]
) -> Optional[str]:
    """
    Automatically create a social post when a user completes a quiz
    
    Args:
        user_id: User's ID
        quiz_data: Dictionary containing:
            - quiz_name: Name of the quiz/exam
            - score: Score achieved (percentage or points)
            - total_questions: Total number of questions
            - correct_answers: Number of correct answers
            - time_taken: Time taken in seconds (optional)
            - rank: User's rank/percentile (optional)
            - subject: Subject/topic (optional)
            - exam_category: Exam category (optional)
            - quiz_id: Quiz session ID for challenge link (optional)
    
    Returns:
        post_id if successful, None otherwise
    """
    if db is None:
        print("[AUTO_POST] Database not initialized")
        return None
    
    try:
        # Get user details
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        
        if not user:
            print(f"[AUTO_POST] User {user_id} not found")
            return None
        
        # Extract quiz data
        quiz_name = quiz_data.get("quiz_name", "Quiz")
        score = quiz_data.get("score", 0)
        total_questions = quiz_data.get("total_questions", 0)
        correct_answers = quiz_data.get("correct_answers", 0)
        time_taken = quiz_data.get("time_taken")
        rank = quiz_data.get("rank")
        subject = quiz_data.get("subject", "")
        exam_category = quiz_data.get("exam_category", "")
        quiz_id = quiz_data.get("quiz_id")
        
        # Generate content based on score
        if score >= 90:
            emoji = "🏆"
            achievement = "Outstanding performance"
        elif score >= 75:
            emoji = "⭐"
            achievement = "Great job"
        elif score >= 60:
            emoji = "👍"
            achievement = "Good effort"
        else:
            emoji = "💪"
            achievement = "Keep practicing"
        
        # Build content message
        content = f"{emoji} {achievement}!\n\n"
        content += f"📚 Quiz: {quiz_name}\n"
        content += f"✅ Score: {correct_answers}/{total_questions} ({score}%)\n"
        
        if time_taken:
            minutes = time_taken // 60
            seconds = time_taken % 60
            content += f"⏱️ Time: {minutes}m {seconds}s\n"
        
        if rank:
            content += f"🎯 Rank: #{rank}\n"
        
        if subject:
            content += f"📖 Subject: {subject}\n"
        
        # Build battle stats for display card
        battle_stats = {
            "accuracy": score,
            "subject": subject or exam_category,
            "total_questions": total_questions,
            "correct_answers": correct_answers
        }
        
        if rank:
            battle_stats["rank"] = rank
        
        if time_taken:
            battle_stats["time_taken"] = f"{time_taken // 60}m {time_taken % 60}s"
        
        # Create post document
        post_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "user_name": user.get("name", "User"),
            "username": user.get("username"),
            "user_avatar": user.get("avatar", "👤"),
            "user_verified": user.get("verified", False),
            "user_location": user.get("location"),
            "post_type": "quiz_result",  # New post type for quiz results
            "content": content,
            "battle_stats": battle_stats,
            "quiz_details": {
                "quiz_name": quiz_name,
                "quiz_id": quiz_id,
                "score": score,
                "total_questions": total_questions,
                "correct_answers": correct_answers
            },
            "room_code": None,
            "media_urls": [],
            "tags": [subject, exam_category] if subject or exam_category else [],
            "exam_category": exam_category,
            "subject": subject,
            "likes_count": 0,
            "comments_count": 0,
            "shares_count": 0,
            "trending_score": score,  # Initial trending score based on performance
            "created_at": datetime.now(timezone.utc).isoformat(),
            "auto_posted": True  # Flag to identify auto-generated posts
        }
        
        # Insert post
        await db.social_posts.insert_one(post_doc.copy())
        
        # Increment user's posts count
        await db.users.update_one(
            {"id": user_id},
            {"$inc": {"posts_count": 1}}
        )
        
        print(f"[AUTO_POST] Created quiz result post {post_doc['id']} for user {user_id}")
        return post_doc["id"]
        
    except Exception as e:
        print(f"[AUTO_POST] Error creating quiz result post: {str(e)}")
        return None


async def auto_post_battle_result(
    user_id: str,
    battle_data: Dict[str, Any]
) -> Optional[str]:
    """
    Automatically create a social post when a user completes a battle
    
    Args:
        user_id: User's ID
        battle_data: Dictionary containing:
            - room_code: Battle room code
            - score: Final score
            - rank: User's rank in battle
            - total_participants: Number of participants
            - subject: Battle subject
            - exam_category: Exam category
            - questions_answered: Questions answered correctly
            - total_questions: Total questions in battle
    
    Returns:
        post_id if successful, None otherwise
    """
    if db is None:
        print("[AUTO_POST] Database not initialized")
        return None
    
    try:
        # Get user details
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        
        if not user:
            print(f"[AUTO_POST] User {user_id} not found")
            return None
        
        # Extract battle data
        room_code = battle_data.get("room_code", "")
        score = battle_data.get("score", 0)
        rank = battle_data.get("rank", 0)
        total_participants = battle_data.get("total_participants", 0)
        subject = battle_data.get("subject", "")
        exam_category = battle_data.get("exam_category", "")
        questions_correct = battle_data.get("questions_answered", 0)
        total_questions = battle_data.get("total_questions", 0)
        
        # Generate content based on rank
        if rank == 1:
            emoji = "👑"
            achievement = "Victory!"
        elif rank <= 3:
            emoji = "🥈"
            achievement = "Podium finish!"
        else:
            emoji = "⚔️"
            achievement = "Battle completed!"
        
        # Build content message
        content = f"{emoji} {achievement}\n\n"
        content += f"🎮 Room: {room_code}\n"
        content += f"🏆 Rank: #{rank}/{total_participants}\n"
        content += f"📊 Score: {score}\n"
        content += f"✅ Correct: {questions_correct}/{total_questions}\n"
        
        if subject:
            content += f"📖 Subject: {subject}\n"
        
        # Build battle stats
        battle_stats = {
            "rank": rank,
            "score": score,
            "accuracy": round((questions_correct / total_questions * 100) if total_questions > 0 else 0),
            "subject": subject or exam_category,
            "total_participants": total_participants,
            "questions_correct": questions_correct,
            "total_questions": total_questions
        }
        
        # Create post document
        post_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "user_name": user.get("name", "User"),
            "username": user.get("username"),
            "user_avatar": user.get("avatar", "👤"),
            "user_verified": user.get("verified", False),
            "user_location": user.get("location"),
            "post_type": "battle_victory",
            "content": content,
            "battle_stats": battle_stats,
            "quiz_details": None,
            "room_code": room_code,
            "media_urls": [],
            "tags": [subject, exam_category, "battle"] if subject or exam_category else ["battle"],
            "exam_category": exam_category,
            "subject": subject,
            "likes_count": 0,
            "comments_count": 0,
            "shares_count": 0,
            "trending_score": score + (100 if rank == 1 else 50 if rank <= 3 else 0),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "auto_posted": True
        }
        
        # Insert post
        await db.social_posts.insert_one(post_doc.copy())
        
        # Increment user's posts count
        await db.users.update_one(
            {"id": user_id},
            {"$inc": {"posts_count": 1}}
        )
        
        print(f"[AUTO_POST] Created battle result post {post_doc['id']} for user {user_id}")
        return post_doc["id"]
        
    except Exception as e:
        print(f"[AUTO_POST] Error creating battle result post: {str(e)}")
        return None
