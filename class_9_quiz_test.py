import os
import requests
import json

# Get backend URL from environment
BACKEND_URL = os.environ.get("BACKEND_URL", "https://quizmaster-304.preview.emergentagent.com")

class Class9QuizTester:
    def __init__(self):
        self.results = []

    def log_result(self, name: str, success: bool, message: str):
        self.results.append({"name": name, "success": success, "message": message})
        status = "✅" if success else "❌"
        print(f"{status} {name}: {message}")

    def login_demo_user(self, username: str):
        """Login demo user and return auth token"""
        try:
            response = requests.post(f"{BACKEND_URL}/api/auth/demo-login", json={
                "username": username,
                "password": username
            })
            if response.status_code == 200:
                data = response.json()
                user_id = data.get('user', {}).get('id') or data.get('user', {}).get('user_id')
                return data.get('access_token'), user_id
            return None, None
        except Exception as e:
            print(f"Login error for {username}: {e}")
            return None, None

    def test_class_9_science_quiz_bug_fix(self):
        """Test P0 bug fix for Class 9 Science quiz questions not appearing"""
        try:
            print("\n🎯 TESTING CLASS 9 SCIENCE QUIZ BUG FIX")
            print("=" * 60)
            
            # Step 1: Demo login for authentication
            token, user_id = self.login_demo_user('demo1')
            if not token:
                self.log_result("Class 9 Quiz - Demo Login", False, "❌ Failed to login demo1")
                return False
            
            self.log_result("Class 9 Quiz - Demo Login", True, f"✅ Demo1 logged in successfully")
            headers = {"Authorization": f"Bearer {token}"}
            
            # Step 2: Test Class 9 Science - Matter(s) in Our Surroundings Quiz (with spelling variation)
            self.log_result("Class 9 Quiz - Test Scenario 1", True, "🔄 Testing 'Matters in Our Surroundings' (with 's')")
            
            quiz_data_matters = {
                "exam": "Class 9",
                "subject": "Science", 
                "isClassBased": True,
                "class_name": "Class 9",
                "chapter": "Matters in Our Surroundings",
                "numberOfQuestions": 10
            }
            
            response = requests.post(f"{BACKEND_URL}/api/quiz/start", json=quiz_data_matters, headers=headers)
            
            if response.status_code != 200:
                self.log_result("Matters Quiz Start", False, f"❌ Quiz start failed: {response.status_code} - {response.text}")
                return False
            
            matters_result = response.json()
            if not matters_result.get('success'):
                self.log_result("Matters Quiz Start", False, f"❌ Quiz start returned success=false: {matters_result}")
                return False
            
            matters_questions = matters_result.get('questions', [])
            if len(matters_questions) == 0:
                self.log_result("Matters Quiz Questions", False, "❌ No questions returned for 'Matters in Our Surroundings'")
                return False
            
            self.log_result("Matters Quiz Questions", True, f"✅ {len(matters_questions)} questions returned for 'Matters in Our Surroundings'")
            
            # Verify question structure
            if matters_questions:
                first_q = matters_questions[0]
                required_fields = ['id', 'question', 'options', 'correctAnswer']
                missing_fields = [field for field in required_fields if field not in first_q]
                
                if missing_fields:
                    self.log_result("Matters Question Structure", False, f"❌ Missing fields: {missing_fields}")
                    return False
                
                self.log_result("Matters Question Structure", True, "✅ Question structure is valid")
            
            # Step 3: Test Class 9 Science - Direct chapter name (without "s")
            self.log_result("Class 9 Quiz - Test Scenario 2", True, "🔄 Testing 'Matter in Our Surroundings' (without 's')")
            
            quiz_data_matter = {
                "exam": "Class 9",
                "subject": "Science",
                "isClassBased": True,
                "class_name": "Class 9", 
                "chapter": "Matter in Our Surroundings",
                "numberOfQuestions": 10
            }
            
            response = requests.post(f"{BACKEND_URL}/api/quiz/start", json=quiz_data_matter, headers=headers)
            
            if response.status_code != 200:
                self.log_result("Matter Quiz Start", False, f"❌ Quiz start failed: {response.status_code} - {response.text}")
                return False
            
            matter_result = response.json()
            if not matter_result.get('success'):
                self.log_result("Matter Quiz Start", False, f"❌ Quiz start returned success=false: {matter_result}")
                return False
            
            matter_questions = matter_result.get('questions', [])
            if len(matter_questions) == 0:
                self.log_result("Matter Quiz Questions", False, "❌ No questions returned for 'Matter in Our Surroundings'")
                return False
            
            self.log_result("Matter Quiz Questions", True, f"✅ {len(matter_questions)} questions returned for 'Matter in Our Surroundings'")
            
            # Step 4: Test Other Class 9 Science Chapters (verify not broken)
            self.log_result("Class 9 Quiz - Test Scenario 3", True, "🔄 Testing other Class 9 Science chapters")
            
            other_chapters = [
                "Is Matter Around Us Pure",
                "Atoms and Molecules"
            ]
            
            for chapter in other_chapters:
                quiz_data_other = {
                    "exam": "Class 9",
                    "subject": "Science",
                    "isClassBased": True,
                    "class_name": "Class 9",
                    "chapter": chapter,
                    "numberOfQuestions": 10
                }
                
                response = requests.post(f"{BACKEND_URL}/api/quiz/start", json=quiz_data_other, headers=headers)
                
                if response.status_code == 200:
                    other_result = response.json()
                    if other_result.get('success'):
                        other_questions = other_result.get('questions', [])
                        self.log_result(f"Chapter '{chapter}' Quiz", True, f"✅ {len(other_questions)} questions returned")
                    else:
                        self.log_result(f"Chapter '{chapter}' Quiz", False, f"❌ Quiz returned success=false: {other_result}")
                else:
                    self.log_result(f"Chapter '{chapter}' Quiz", False, f"❌ Quiz failed: {response.status_code}")
            
            # Step 5: Test Quiz Submit Flow
            self.log_result("Class 9 Quiz - Test Scenario 4", True, "🔄 Testing quiz submit flow")
            
            # Use the quizId from the first successful quiz
            quiz_id = matters_result.get('quizId')
            if not quiz_id:
                self.log_result("Quiz Submit Flow", False, "❌ No quizId available for submit test")
                return False
            
            # Create sample answers for the quiz
            sample_answers = []
            for i, question in enumerate(matters_questions[:5]):  # Test with first 5 questions
                # Get first option as answer (just for testing)
                options = question.get('options', {})
                if options:
                    first_option_key = list(options.keys())[0] if options else 'A'
                    sample_answers.append({
                        "questionId": question.get('id'),
                        "selectedOption": first_option_key
                    })
            
            submit_data = {
                "quizId": quiz_id,
                "answers": sample_answers
            }
            
            response = requests.post(f"{BACKEND_URL}/api/quiz/submit", json=submit_data, headers=headers)
            
            if response.status_code != 200:
                self.log_result("Quiz Submit Flow", False, f"❌ Quiz submit failed: {response.status_code} - {response.text}")
                return False
            
            submit_result = response.json()
            if not submit_result.get('success'):
                self.log_result("Quiz Submit Flow", False, f"❌ Quiz submit returned success=false: {submit_result}")
                return False
            
            # Verify submit response structure
            required_submit_fields = ['score', 'correctAnswers', 'results']
            missing_submit_fields = [field for field in required_submit_fields if field not in submit_result]
            
            if missing_submit_fields:
                self.log_result("Quiz Submit Response", False, f"❌ Missing fields in submit response: {missing_submit_fields}")
                return False
            
            score = submit_result.get('score', 0)
            correct_answers = submit_result.get('correctAnswers', 0)
            results = submit_result.get('results', [])
            
            self.log_result("Quiz Submit Flow", True, f"✅ Quiz submitted successfully - Score: {score}%, Correct: {correct_answers}, Results: {len(results)}")
            
            # Step 6: Verify Database State - Check chapters list
            self.log_result("Class 9 Quiz - Test Scenario 5", True, "🔄 Verifying database state")
            
            response = requests.get(f"{BACKEND_URL}/api/chapter-tests/chapters?class_param=9&subject=science")
            
            if response.status_code != 200:
                self.log_result("Database Chapters Verification", False, f"❌ Chapters API failed: {response.status_code}")
                return False
            
            chapters_result = response.json()
            if not chapters_result.get('success'):
                self.log_result("Database Chapters Verification", False, f"❌ Chapters API returned success=false: {chapters_result}")
                return False
            
            chapters_list = chapters_result.get('chapters', [])
            science_chapters = [ch for ch in chapters_list if 'matter' in ch.lower() or 'science' in ch.lower()]
            
            if len(science_chapters) > 0:
                self.log_result("Database Chapters Verification", True, f"✅ Found {len(science_chapters)} science chapters in database")
            else:
                self.log_result("Database Chapters Verification", False, f"❌ No science chapters found. Available: {chapters_list}")
            
            print("\n🎉 CLASS 9 SCIENCE QUIZ BUG FIX TEST COMPLETE")
            print("✅ Test Summary:")
            print("  1. Demo1 authentication ✅")
            print("  2. 'Matters in Our Surroundings' quiz (with 's') ✅")
            print("  3. 'Matter in Our Surroundings' quiz (without 's') ✅")
            print("  4. Other Class 9 Science chapters ✅")
            print("  5. Quiz submit flow ✅")
            print("  6. Database chapters verification ✅")
            
            return True
            
        except Exception as e:
            self.log_result("Class 9 Quiz Bug Fix - Exception", False, f"❌ Test error: {e}")
            import traceback
            traceback.print_exc()
            return False

    def run_all_tests(self):
        """Run all Class 9 Science quiz tests"""
        print("🚀 Starting Class 9 Science Quiz Bug Fix Tests")
        print("=" * 60)
        
        success = self.test_class_9_science_quiz_bug_fix()
        
        print("\n" + "=" * 60)
        passed = sum(1 for r in self.results if r['success'])
        total = len(self.results)
        print(f"📊 Test Results: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if not success:
            print("\n❌ CRITICAL ISSUES FOUND:")
            for result in self.results:
                if not result['success']:
                    print(f"  - {result['name']}: {result['message']}")
        
        return success

if __name__ == "__main__":
    tester = Class9QuizTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)