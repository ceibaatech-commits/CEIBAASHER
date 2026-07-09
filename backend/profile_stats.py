import datetime
from datetime import timezone, timedelta

async def _compute_stats_live(db, user_id: str) -> dict:
    quiz_history = await db.quiz_history.find(
        {"user_id": user_id},
        {"_id": 0, "score": 1, "total_questions": 1, "completed_at": 1, "created_at": 1}
    ).to_list(1000)

    battle_submissions = await db.battle_submissions.find(
        {"user_id": user_id},
        {"_id": 0, "score": 1, "total_questions": 1, "submitted_at": 1}
    ).to_list(1000)

    battle_results = await db.user_battle_history.find(
        {"user_id": user_id},
        {"_id": 0, "score": 1, "total_questions": 1, "completed_at": 1, "created_at": 1}
    ).to_list(1000)

    quiz_count = len(quiz_history)
    battle_room_count = len(battle_submissions)
    matchmaking_count = len(battle_results)
    total_tests = quiz_count + battle_room_count + matchmaking_count

    all_scores = []
    best_score = 0.0

    for q in quiz_history:
        # Prefer 'accuracy' (stored as %) over raw 'score' (stored as correct-answer count)
        total = q.get("total_questions", 0)
        raw   = q.get("score", 0)
        if q.get("accuracy") is not None:
            pct = float(q["accuracy"])
        elif total > 0:
            pct = (float(raw) / total) * 100
        elif isinstance(raw, (int, float)) and 0 <= raw <= 100:
            pct = float(raw)
        else:
            continue
        pct = max(0.0, min(100.0, pct))
        all_scores.append(pct)
        if pct > best_score:
            best_score = pct

    for b in battle_submissions:
        score = b.get("score", 0)
        total = b.get("total_questions", 10)
        if total > 0:
            pct = (score / total) * 100
            pct = max(0.0, min(100.0, float(pct)))
            all_scores.append(pct)
            if pct > best_score:
                best_score = pct

    MAX_PER_QUESTION = 100
    for b in battle_results:
        score = b.get("score", 0)
        total = b.get("total_questions", 10)
        if total and total > 0:
            max_possible = total * MAX_PER_QUESTION
            pct = (score / max_possible) * 100 if max_possible > 0 else 0
            pct = max(0.0, min(100.0, float(pct)))
            all_scores.append(pct)
            if pct > best_score:
                best_score = pct

    average_score = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0.0

    activity_dates = set()
    for q in quiz_history:
        date_str = q.get("completed_at") or q.get("created_at", "")
        if date_str:
            try:
                if isinstance(date_str, str):
                    date_obj = datetime.datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                else:
                    date_obj = date_str
                activity_dates.add(date_obj.date())
            except Exception:
                pass

    for b in battle_submissions:
        date_str = b.get("submitted_at", "")
        if date_str:
            try:
                if isinstance(date_str, str):
                    date_obj = datetime.datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                else:
                    date_obj = date_str
                activity_dates.add(date_obj.date())
            except Exception:
                pass

    for b in battle_results:
        date_str = b.get("completed_at") or b.get("created_at", "")
        if date_str:
            try:
                if isinstance(date_str, str):
                    date_obj = datetime.datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                else:
                    date_obj = date_str
                activity_dates.add(date_obj.date())
            except Exception:
                pass

    streak_days = 0
    today = datetime.datetime.now(timezone.utc).date()
    current_date = today
    if today not in activity_dates and (today - timedelta(days=1)) in activity_dates:
        current_date = today - timedelta(days=1)
    
    while current_date in activity_dates:
        streak_days += 1
        current_date -= timedelta(days=1)

    return {
        "user_id": user_id,
        "streak_days": streak_days,
        "average_score": average_score,
        "best_score": round(best_score, 1),
        "total_tests": total_tests
    }

async def compute_user_stats(db, user_id: str) -> dict:
    cached = await db.user_stats.find_one({"user_id": user_id}, {"_id": 0})
    if cached:
        return cached
    return await _compute_stats_live(db, user_id)

async def get_user_rank(db, user_id: str, average_score: float) -> int:
    stats = await compute_user_stats(db, user_id)
    if stats.get("total_tests", 0) == 0:
        return 0
    
    better_users = await db.user_stats.count_documents({
        "total_tests": {"$gt": 0},
        "average_score": {"$gt": average_score}
    })
    return better_users + 1
