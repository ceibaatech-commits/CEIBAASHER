"""
CRITICAL FIX for dashboard_routes.py — the 160% / 1120% avg_score bug
====================================================================
This patch fixes the score calculation so it can NEVER exceed 100%.

Locate the function `get_dashboard_stats` in backend/dashboard_routes.py
(around line 200-320). Find the block that builds `all_scores` and
computes `avg_score` (usually around line 270-300).

REPLACE the ENTIRE score-calculation block with the code below.

────────────────────────────────────────────────────────────────────
BEFORE (buggy — no clamping, mixes raw counts with %):
────────────────────────────────────────────────────────────────────

    all_scores = []
    for q in quiz_history:
        score = q.get("score", 0)
        if isinstance(score, (int, float)) and score >= 0:
            all_scores.append(score)          # ← bug: raw values

    for b in battle_submissions:
        score = b.get("score", 0)
        total = b.get("total_questions", 10)
        if total > 0:
            percentage = (score / total) * 100
            all_scores.append(percentage)     # ← bug: can exceed 100

    avg_score = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0

────────────────────────────────────────────────────────────────────
AFTER (fixed — every value clamped to 0-100):
────────────────────────────────────────────────────────────────────
"""

def _to_pct(score, total_questions, max_per_question=1):
    """Convert any score → clean 0-100 percentage. Never returns >100."""
    try:
        score = float(score)
    except (TypeError, ValueError):
        return None
    if score < 0:
        return None
    if total_questions and total_questions > 0:
        max_possible = total_questions * max_per_question
        if max_possible <= 0:
            return None
        pct = (score / max_possible) * 100
    else:
        # Score assumed to be an already-computed percentage
        pct = score
    return max(0.0, min(100.0, pct))   # HARD CLAMP — the fix


# Then inside get_dashboard_stats():

    all_pcts = []

    # Quiz history — may store raw counts (score, total_questions) OR
    # a pre-computed percentage. _to_pct handles both & clamps.
    for q in quiz_history:
        pct = _to_pct(
            q.get("score", 0),
            q.get("total_questions") or q.get("total"),
        )
        if pct is not None:
            all_pcts.append(pct)

    # Battle submissions — correct-count / total_questions
    for b in battle_submissions:
        pct = _to_pct(b.get("score", 0), b.get("total_questions", 10))
        if pct is not None:
            all_pcts.append(pct)

    # 1v1 battle results — raw points, MAX_POINTS_PER_QUESTION=100
    for br in battle_results:
        pct = _to_pct(
            br.get("score", 0),
            br.get("total_questions", 10),
            max_per_question=100,
        )
        if pct is not None:
            all_pcts.append(pct)

    avg_score = round(sum(all_pcts) / len(all_pcts), 1) if all_pcts else 0.0

"""
────────────────────────────────────────────────────────────────────
Same fix for subject_mastery (accuracy > 100 bug)
────────────────────────────────────────────────────────────────────
Wherever you compute per-subject accuracy, wrap the final value with:

    subject_data["accuracy"] = round(max(0.0, min(100.0, accuracy)), 1)
    subject_data["mastery"]  = round(max(0.0, min(100.0, mastery)), 1)

────────────────────────────────────────────────────────────────────
After editing, restart backend:

    sudo supervisorctl restart backend

Then reload /board — avg score & subject accuracy will NEVER exceed 100%.
────────────────────────────────────────────────────────────────────
"""
