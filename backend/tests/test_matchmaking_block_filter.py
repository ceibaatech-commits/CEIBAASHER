"""
Regression tests for matchmaking block-filter behaviour (Feb 13, 2026).

Verifies:
1. Two unblocked players match instantly.
2. A blocked candidate is SKIPPED and remains queued for someone else.
3. The skipped candidate retains queue priority — the next un-related player still matches them.
4. user_id / username are persisted on the WaitingPlayer for emit by the handler.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from matchmaking import MatchmakingManager


def test_basic_match_no_blocks():
    m = MatchmakingManager()
    assert m.add_to_queue('s1', 'Alice', 'NDA', 'Math', user_id='u1', username='alice') is None
    opp = m.add_to_queue('s2', 'Bob', 'NDA', 'Math', user_id='u2', username='bob')
    assert opp is not None
    assert opp.user_id == 'u1'
    assert opp.username == 'alice'


def test_blocked_player_is_skipped_and_remains_in_queue():
    m = MatchmakingManager()
    # u1 (Alice) queues first
    m.add_to_queue('s1', 'Alice', 'NDA', 'Math', user_id='u1', username='alice')
    # u2 (Bob) queues — but u2 has blocked u1, so cannot match with Alice → enqueues alongside
    opp = m.add_to_queue('s2', 'Bob', 'NDA', 'Math',
                         user_id='u2', username='bob',
                         blocked_user_ids={'u1'})
    assert opp is None, "Bob should not match with blocked Alice"
    # Both players should now be in the queue
    assert m.get_queue_size('NDA', 'Math') == 2


def test_next_unrelated_player_still_matches_with_first():
    m = MatchmakingManager()
    m.add_to_queue('s1', 'Alice', 'NDA', 'Math', user_id='u1', username='alice')
    m.add_to_queue('s2', 'Bob', 'NDA', 'Math', user_id='u2', username='bob',
                   blocked_user_ids={'u1'})
    # u3 has no blocks — should match Alice (queue front) leaving Bob waiting
    opp = m.add_to_queue('s3', 'Carol', 'NDA', 'Math', user_id='u3', username='carol')
    assert opp is not None
    assert opp.user_id == 'u1'  # matched Alice, not Bob
    # Bob should still be in queue
    assert m.get_queue_size('NDA', 'Math') == 1


def test_anonymous_player_still_matches():
    m = MatchmakingManager()
    # Anonymous player (no user_id) queues
    m.add_to_queue('anon1', 'Guest', 'NDA', 'Math')
    # Authenticated player joins
    opp = m.add_to_queue('s1', 'Alice', 'NDA', 'Math', user_id='u1', username='alice')
    assert opp is not None
    assert opp.user_id is None  # Guest had no user_id
    assert opp.player_name == 'Guest'


def test_same_user_id_cannot_match_self():
    m = MatchmakingManager()
    m.add_to_queue('s1', 'Demo One', 'NDA', 'Math', user_id='demo1', username='demo1')
    opp = m.add_to_queue('s2', 'Demo One Again', 'NDA', 'Math', user_id='demo1', username='demo1')
    assert opp is None, 'Same account must never match against itself'
    assert m.get_queue_size('NDA', 'Math') == 2


def test_same_username_cannot_match_self_without_user_id():
    m = MatchmakingManager()
    m.add_to_queue('s1', 'Player A', 'NDA', 'Math', username='demo1')
    opp = m.add_to_queue('s2', 'Player B', 'NDA', 'Math', username='demo1')
    assert opp is None, 'Same username fallback should prevent self-match'
    assert m.get_queue_size('NDA', 'Math') == 2


if __name__ == '__main__':
    test_basic_match_no_blocks()
    test_blocked_player_is_skipped_and_remains_in_queue()
    test_next_unrelated_player_still_matches_with_first()
    test_anonymous_player_still_matches()
    test_same_user_id_cannot_match_self()
    test_same_username_cannot_match_self_without_user_id()
    print("All matchmaking block-filter tests passed.")
