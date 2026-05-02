"""
Regression tests for the unified 1v1 battle scoring equation (Feb 24, 2026).

Equation (mirrored on frontend, see Matchmaking1v1.js → SCORE / calcQuestionScore):
  • CORRECT  → 50 + round(50 × timeLeft / 30)   → 50..100 pts
  • WRONG    → -10 pts
  • SKIPPED  → 0 pts
  • Final score clamped to [0, totalQuestions × 100]
  • avg_score percentage = (score / (total × 100)) × 100, clamped 0..100
"""
import pytest


# ── Helpers (Python mirror of frontend calcQuestionScore) ────────────────
TIME_LIMIT = 30
CORRECT_BASE = 50
TIME_BONUS_MAX = 50
WRONG_PENALTY = 10
MAX_PER_QUESTION = 100


def calc_q_score(outcome: str, time_left: int) -> int:
    if outcome == "correct":
        bonus = round(TIME_BONUS_MAX * max(0, min(TIME_LIMIT, time_left)) / TIME_LIMIT)
        return CORRECT_BASE + bonus
    if outcome == "wrong":
        return -WRONG_PENALTY
    return 0


def clamp_battle_score(raw: int, total_questions: int) -> int:
    max_score = total_questions * MAX_PER_QUESTION
    return max(0, min(max_score, raw))


def percentage_for_avg(score: int, total: int) -> float:
    """Replica of dashboard_routes 1v1 normalization."""
    if not total or total <= 0:
        return 0.0
    max_possible = total * MAX_PER_QUESTION
    pct = (score / max_possible) * 100 if max_possible > 0 else 0
    return max(0.0, min(100.0, pct))


# ── Per-question scoring ─────────────────────────────────────────────────
class TestQuestionScoring:
    def test_correct_instant_max(self):
        assert calc_q_score("correct", 30) == 100

    def test_correct_half_time(self):
        # timeLeft=15 → bonus=25 → 75
        assert calc_q_score("correct", 15) == 75

    def test_correct_last_second(self):
        # timeLeft=1 → bonus=round(50/30) = 2 → 52
        assert calc_q_score("correct", 1) == 52

    def test_correct_zero_time(self):
        # Edge: correct answer registered exactly at timeout
        assert calc_q_score("correct", 0) == 50

    def test_correct_clamped_above_max(self):
        # Defensive: timeLeft cannot exceed TIME_LIMIT
        assert calc_q_score("correct", 99) == 100

    def test_wrong_penalty(self):
        assert calc_q_score("wrong", 25) == -10

    def test_skipped_zero(self):
        assert calc_q_score("skipped", 0) == 0


# ── Final score clamping ─────────────────────────────────────────────────
class TestFinalScoreClamp:
    def test_negative_clamped_to_zero(self):
        assert clamp_battle_score(-50, 10) == 0

    def test_above_max_clamped(self):
        # Tampered client tries to send 9999 for a 10-question battle (max=1000)
        assert clamp_battle_score(9999, 10) == 1000

    def test_within_range_unchanged(self):
        assert clamp_battle_score(750, 10) == 750

    def test_exact_max_preserved(self):
        assert clamp_battle_score(1000, 10) == 1000

    def test_different_question_count(self):
        assert clamp_battle_score(600, 5) == 500   # max for 5q is 500


# ── Dashboard percentage normalization ──────────────────────────────────
class TestAvgScorePercentage:
    def test_perfect_score_is_100_pct(self):
        assert percentage_for_avg(1000, 10) == 100.0

    def test_half_score(self):
        assert percentage_for_avg(500, 10) == 50.0

    def test_zero_score(self):
        assert percentage_for_avg(0, 10) == 0.0

    def test_legacy_overflow_clamped(self):
        # Old broken records may have score > total*100; clamp prevents
        # 9000% values polluting averages.
        assert percentage_for_avg(9000, 10) == 100.0

    def test_zero_total_safe(self):
        assert percentage_for_avg(50, 0) == 0.0

    def test_realistic_mixed_battle(self):
        # 10 questions: 6 correct (avg ~75 each) + 2 wrong + 2 skipped
        # = 6*75 - 2*10 - 2*0 = 450 - 20 = 430 → 43.0%
        assert percentage_for_avg(430, 10) == 43.0


# ── Integration: simulate a full battle ─────────────────────────────────
class TestBattleSimulation:
    def test_perfect_battle(self):
        score = sum(calc_q_score("correct", 30) for _ in range(10))
        assert score == 1000
        assert clamp_battle_score(score, 10) == 1000
        assert percentage_for_avg(score, 10) == 100.0

    def test_all_wrong_battle(self):
        score = sum(calc_q_score("wrong", 0) for _ in range(10))
        assert score == -100
        # Clamped to 0 in the displayed/stored final score
        assert clamp_battle_score(score, 10) == 0
        assert percentage_for_avg(0, 10) == 0.0

    def test_mixed_realistic_battle(self):
        # 5 correct at varying times + 3 wrong + 2 skipped
        outcomes = [
            ("correct", 30), ("correct", 25), ("correct", 20),
            ("correct", 10), ("correct", 5),
            ("wrong", 20), ("wrong", 15), ("wrong", 0),
            ("skipped", 0), ("skipped", 0),
        ]
        score = sum(calc_q_score(o, t) for o, t in outcomes)
        # 100 + 92 + 83 + 67 + 58 - 10 - 10 - 10 + 0 + 0 = 370
        assert score == 370
        assert clamp_battle_score(score, 10) == 370
        assert percentage_for_avg(score, 10) == 37.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
