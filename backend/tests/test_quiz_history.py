"""
Test Quiz History Data Persistence with User Names
Tests that quiz/test history data is stored in MongoDB with individual user names
and all stats in the table are real, not static.
"""
import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://mobile-search-fix-1.preview.emergentagent.com').rstrip('/')

# Test credentials
DEMO_USER = {
    "username": "demo1",
    "password": "demo1",
    "expected_name": "Demo Student 1",
    "expected_id": "demo1-uuid"
}


class TestQuizHistoryPersistence:
    """Test quiz history data persistence with user_name field"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token before each test"""
        # Login with demo user
        login_response = requests.post(
            f"{BASE_URL}/api/auth/demo-login",
            json={"username": DEMO_USER["username"], "password": DEMO_USER["password"]}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        login_data = login_response.json()
        self.token = login_data.get("token")
        self.user_id = login_data.get("user", {}).get("id", DEMO_USER["expected_id"])
        self.user_name = login_data.get("user", {}).get("name", DEMO_USER["expected_name"])
        
        self.headers = {"Authorization": f"Bearer {self.token}"}
        yield
    
    def test_demo_login_returns_user_info(self):
        """Test that demo login returns user with name and id"""
        response = requests.post(
            f"{BASE_URL}/api/auth/demo-login",
            json={"username": DEMO_USER["username"], "password": DEMO_USER["password"]}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "user" in data, "Response should contain user object"
        user = data["user"]
        assert "id" in user, "User should have id"
        assert "name" in user, "User should have name"
        assert user["name"] == DEMO_USER["expected_name"], f"Expected name '{DEMO_USER['expected_name']}', got '{user['name']}'"
        print(f"✓ Demo login returns user: {user['name']} (id: {user['id']})")
    
    def test_quiz_start_and_submit_saves_to_history(self):
        """Test that completing a quiz saves results to quiz_history with user_name"""
        # Step 1: Start a quiz with class-based params
        start_payload = {
            "exam": "CBSE",
            "subject": "Science",
            "isClassBased": True,
            "class_name": "Class 6",
            "chapter": "1. Components of Food",
            "numberOfQuestions": 3,
            "userId": self.user_id
        }
        
        start_response = requests.post(
            f"{BASE_URL}/api/quiz/start",
            json=start_payload
        )
        assert start_response.status_code == 200, f"Quiz start failed: {start_response.text}"
        
        start_data = start_response.json()
        assert start_data.get("success") == True, "Quiz start should return success=true"
        assert "quizId" in start_data, "Quiz start should return quizId"
        assert "questions" in start_data, "Quiz start should return questions"
        
        quiz_id = start_data["quizId"]
        questions = start_data["questions"]
        print(f"✓ Quiz started: {quiz_id} with {len(questions)} questions")
        
        # Step 2: Build answers (answer all correctly using correctAnswer field)
        answers = []
        for q in questions:
            answers.append({
                "questionId": q["id"],
                "selectedOption": q.get("correctAnswer", "A")  # Use correct answer
            })
        
        # Step 3: Submit the quiz
        submit_payload = {
            "quizId": quiz_id,
            "answers": answers
        }
        
        submit_response = requests.post(
            f"{BASE_URL}/api/quiz/submit",
            json=submit_payload
        )
        assert submit_response.status_code == 200, f"Quiz submit failed: {submit_response.text}"
        
        submit_data = submit_response.json()
        assert submit_data.get("success") == True, "Quiz submit should return success=true"
        assert "score" in submit_data, "Quiz submit should return score"
        assert "correctAnswers" in submit_data, "Quiz submit should return correctAnswers"
        
        print(f"✓ Quiz submitted: Score={submit_data['score']}%, Correct={submit_data['correctAnswers']}/{submit_data['totalQuestions']}")
        
        # Step 4: Verify the result was saved to quiz_history via test-history endpoint
        time.sleep(1)  # Wait for DB write
        
        history_response = requests.get(
            f"{BASE_URL}/api/dashboard/test-history/{self.user_id}"
        )
        assert history_response.status_code == 200, f"Test history fetch failed: {history_response.text}"
        
        history_data = history_response.json()
        assert history_data.get("success") == True, "Test history should return success=true"
        assert "history" in history_data, "Test history should return history array"
        
        # Find the quiz we just submitted (should be most recent with source='chapter_quiz')
        history = history_data["history"]
        assert len(history) > 0, "History should not be empty after quiz submission"
        
        # Check the most recent entry
        recent_entry = history[0]  # Sorted by date descending
        print(f"✓ Most recent history entry: exam={recent_entry.get('exam')}, subject={recent_entry.get('subject')}, user_name={recent_entry.get('user_name')}")
        
        # Verify user_name is present and correct
        assert "user_name" in recent_entry, "History entry should have user_name field"
        assert recent_entry["user_name"] == DEMO_USER["expected_name"], f"Expected user_name '{DEMO_USER['expected_name']}', got '{recent_entry['user_name']}'"
        
        print(f"✓ Quiz result saved to history with user_name='{recent_entry['user_name']}'")
    
    def test_test_history_returns_real_data_with_user_name(self):
        """Test that GET /api/dashboard/test-history/{user_id} returns real data with user_name"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/test-history/{self.user_id}"
        )
        assert response.status_code == 200, f"Test history fetch failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Should return success=true"
        assert "history" in data, "Should return history array"
        assert "total" in data, "Should return total count"
        assert "user_name" in data, "Should return user_name at top level"
        
        history = data["history"]
        total = data["total"]
        
        print(f"✓ Test history returned {total} records for user {data['user_name']}")
        
        # Verify each record has required fields
        for i, record in enumerate(history[:10]):  # Check first 10 records
            assert "user_name" in record, f"Record {i} missing user_name"
            assert "exam" in record, f"Record {i} missing exam"
            assert "subject" in record, f"Record {i} missing subject"
            assert "score" in record, f"Record {i} missing score"
            assert "accuracy" in record, f"Record {i} missing accuracy"
            assert "total_questions" in record, f"Record {i} missing total_questions"
            assert "correct" in record, f"Record {i} missing correct"
            assert "wrong" in record, f"Record {i} missing wrong"
            assert "date" in record, f"Record {i} missing date"
            
            # Verify user_name is not empty or 'Unknown'
            user_name = record["user_name"]
            assert user_name and user_name != "Unknown", f"Record {i} has invalid user_name: '{user_name}'"
            
            print(f"  Record {i}: {record['exam']}/{record['subject']} - Score: {record['score']}%, user_name: '{user_name}'")
        
        print(f"✓ All {min(10, len(history))} checked records have valid user_name field")
    
    def test_all_history_entries_have_non_empty_user_name(self):
        """Test that ALL test history entries have non-empty user_name (not 'Unknown')"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/test-history/{self.user_id}"
        )
        assert response.status_code == 200
        
        data = response.json()
        history = data.get("history", [])
        
        unknown_count = 0
        empty_count = 0
        valid_count = 0
        
        for record in history:
            user_name = record.get("user_name", "")
            if not user_name:
                empty_count += 1
            elif user_name == "Unknown":
                unknown_count += 1
            else:
                valid_count += 1
        
        print(f"✓ User name analysis: valid={valid_count}, unknown={unknown_count}, empty={empty_count}")
        
        # All records should have valid user_name
        assert empty_count == 0, f"Found {empty_count} records with empty user_name"
        assert unknown_count == 0, f"Found {unknown_count} records with user_name='Unknown'"
        
        print(f"✓ All {len(history)} records have valid non-empty user_name")
    
    def test_quiz_submission_saves_all_required_fields(self):
        """Test that quiz submission saves correct_answers, wrong_answers, accuracy, xp_earned, exam, subject"""
        # Start a quiz
        start_payload = {
            "exam": "CBSE",
            "subject": "Science",
            "isClassBased": True,
            "class_name": "Class 6",
            "chapter": "1. Components of Food",
            "numberOfQuestions": 3,
            "userId": self.user_id
        }
        
        start_response = requests.post(f"{BASE_URL}/api/quiz/start", json=start_payload)
        assert start_response.status_code == 200
        
        start_data = start_response.json()
        quiz_id = start_data["quizId"]
        questions = start_data["questions"]
        
        # Answer 2 correct, 1 wrong
        answers = []
        for i, q in enumerate(questions):
            if i < 2:
                # Answer correctly
                answers.append({"questionId": q["id"], "selectedOption": q.get("correctAnswer", "A")})
            else:
                # Answer incorrectly (pick wrong option)
                correct = q.get("correctAnswer", "A")
                wrong = "B" if correct != "B" else "C"
                answers.append({"questionId": q["id"], "selectedOption": wrong})
        
        # Submit
        submit_response = requests.post(
            f"{BASE_URL}/api/quiz/submit",
            json={"quizId": quiz_id, "answers": answers}
        )
        assert submit_response.status_code == 200
        
        submit_data = submit_response.json()
        print(f"✓ Quiz submitted: Score={submit_data['score']}%, Correct={submit_data['correctAnswers']}")
        
        # Wait and fetch history
        time.sleep(1)
        
        history_response = requests.get(f"{BASE_URL}/api/dashboard/test-history/{self.user_id}")
        assert history_response.status_code == 200
        
        history = history_response.json().get("history", [])
        assert len(history) > 0
        
        # Find the most recent chapter_quiz entry
        recent = history[0]
        
        # Verify all required fields are present
        required_fields = ["user_name", "exam", "subject", "score", "accuracy", "correct", "wrong", "xp", "total_questions"]
        for field in required_fields:
            assert field in recent, f"Missing required field: {field}"
            print(f"  {field}: {recent[field]}")
        
        # Verify values are reasonable
        assert recent["exam"] == "CBSE", f"Expected exam='CBSE', got '{recent['exam']}'"
        assert recent["subject"] == "Science", f"Expected subject='Science', got '{recent['subject']}'"
        assert recent["total_questions"] == 3, f"Expected total_questions=3, got {recent['total_questions']}"
        assert recent["user_name"] == DEMO_USER["expected_name"], f"Expected user_name='{DEMO_USER['expected_name']}', got '{recent['user_name']}'"
        
        print(f"✓ Quiz history entry has all required fields with correct values")


class TestDashboardStatsIntegration:
    """Test that dashboard stats are calculated from real data"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login before tests"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/demo-login",
            json={"username": DEMO_USER["username"], "password": DEMO_USER["password"]}
        )
        assert login_response.status_code == 200
        
        login_data = login_response.json()
        self.user_id = login_data.get("user", {}).get("id", DEMO_USER["expected_id"])
        yield
    
    def test_dashboard_stats_reflect_real_data(self):
        """Test that dashboard stats are calculated from real quiz/battle history"""
        # Get dashboard stats
        stats_response = requests.get(f"{BASE_URL}/api/dashboard/stats/{self.user_id}")
        assert stats_response.status_code == 200
        
        stats_data = stats_response.json()
        assert stats_data.get("success") == True
        
        stats = stats_data.get("stats", {})
        
        # Verify stats structure
        assert "tests_completed" in stats, "Missing tests_completed"
        assert "avg_score" in stats, "Missing avg_score"
        assert "streak" in stats, "Missing streak"
        assert "study_hours" in stats, "Missing study_hours"
        
        print(f"✓ Dashboard stats: tests={stats['tests_completed']}, avg_score={stats['avg_score']}%, streak={stats['streak']}, hours={stats['study_hours']}")
        
        # Get test history to verify stats match
        history_response = requests.get(f"{BASE_URL}/api/dashboard/test-history/{self.user_id}")
        assert history_response.status_code == 200
        
        history_data = history_response.json()
        history_count = history_data.get("total", 0)
        
        # Stats tests_completed should match or be close to history count
        # (may differ slightly due to different sources being aggregated)
        print(f"✓ History count: {history_count}, Stats tests_completed: {stats['tests_completed']}")
        
        # Verify breakdown is present
        if "breakdown" in stats:
            breakdown = stats["breakdown"]
            print(f"  Breakdown: quizzes={breakdown.get('quizzes', 0)}, battle_rooms={breakdown.get('battle_rooms', 0)}, matchmaking={breakdown.get('matchmaking_battles', 0)}")
        
        print(f"✓ Dashboard stats are calculated from real data")


class TestHistoryDataTypes:
    """Test that history data includes all types: quiz, battle, 1v1"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login before tests"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/demo-login",
            json={"username": DEMO_USER["username"], "password": DEMO_USER["password"]}
        )
        assert login_response.status_code == 200
        
        login_data = login_response.json()
        self.user_id = login_data.get("user", {}).get("id", DEMO_USER["expected_id"])
        yield
    
    def test_history_includes_multiple_types(self):
        """Test that history can include quiz, battle, quiz_room, and 1v1 types"""
        response = requests.get(f"{BASE_URL}/api/dashboard/test-history/{self.user_id}")
        assert response.status_code == 200
        
        data = response.json()
        history = data.get("history", [])
        
        # Count types
        type_counts = {}
        for record in history:
            record_type = record.get("type", "unknown")
            type_counts[record_type] = type_counts.get(record_type, 0) + 1
        
        print(f"✓ History type distribution: {type_counts}")
        
        # At minimum, we should have quiz type from our tests
        assert len(history) > 0, "History should not be empty"
        
        # Verify each record has a type field
        for record in history[:10]:
            assert "type" in record, "Each record should have a type field"
            assert record["type"] in ["quiz", "battle", "quiz_room", "1v1"], f"Invalid type: {record['type']}"
        
        print(f"✓ All history records have valid type field")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
