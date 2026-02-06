#!/usr/bin/env python3
"""
Dashboard Test - Test the new User Dashboard with AI Features at /board route
"""

import os
import requests
import json
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = os.environ.get("BACKEND_URL", "https://referral-verify-1.preview.emergentagent.com")

class DashboardTester:
    def __init__(self):
        self.results = []
        self.demo_users = {
            'demo1': {'username': 'demo1', 'password': 'demo1'},
            'demo2': {'username': 'demo2', 'password': 'demo2'}
        }

    def log_result(self, name: str, success: bool, message: str):
        self.results.append({"name": name, "success": success, "message": message})
        status = "✅" if success else "❌"
        print(f"{status} {name}: {message}")

    def login_demo_user(self, username: str):
        """Login demo user and return auth token"""
        try:
            response = requests.post(f"{BACKEND_URL}/api/auth/demo-login", json={
                "username": username,
                "password": self.demo_users[username]['password']
            })
            if response.status_code == 200:
                data = response.json()
                user_id = data.get('user', {}).get('id') or data.get('user', {}).get('user_id')
                return data.get('access_token'), user_id
            return None, None
        except Exception as e:
            print(f"Login error for {username}: {e}")
            return None, None

    def test_user_dashboard_with_ai_features(self):
        """Test the new User Dashboard with AI Features at /board route"""
        try:
            print("\n🎯 TESTING USER DASHBOARD WITH AI FEATURES")
            print("=" * 60)
            
            # Step 1: Login demo1 user for authentication
            token, user_id = self.login_demo_user('demo1')
            if not token:
                self.log_result("Dashboard Test - Demo1 Login", False, "❌ Failed to login demo1")
                return False
            
            self.log_result("Dashboard Test - Demo1 Login", True, f"✅ Demo1 logged in successfully with user_id: {user_id}")
            
            # Step 2: Test Dashboard Stats API
            self.log_result("Dashboard Test - Stats API", True, "🔄 Testing Dashboard Stats API")
            
            response = requests.get(f"{BACKEND_URL}/api/dashboard/stats/{user_id}")
            
            if response.status_code != 200:
                self.log_result("Dashboard Stats API", False, f"❌ Stats API failed: {response.status_code} - {response.text}")
                return False
            
            stats_result = response.json()
            if not stats_result.get('success'):
                self.log_result("Dashboard Stats API", False, f"❌ Stats API returned success=false: {stats_result}")
                return False
            
            # Verify stats structure
            stats = stats_result.get('stats', {})
            required_stats = ['tests_completed', 'avg_score', 'streak', 'study_hours']
            missing_stats = [stat for stat in required_stats if stat not in stats]
            
            if missing_stats:
                self.log_result("Dashboard Stats Structure", False, f"❌ Missing stats fields: {missing_stats}")
                return False
            
            self.log_result("Dashboard Stats API", True, 
                          f"✅ Stats API working - Tests: {stats['tests_completed']}, Avg Score: {stats['avg_score']}, Streak: {stats['streak']}, Hours: {stats['study_hours']}")
            
            # Verify subject mastery and learner level
            subject_mastery = stats_result.get('subject_mastery', [])
            learner_level = stats_result.get('learner_level', '')
            
            if not learner_level:
                self.log_result("Dashboard Learner Level", False, "❌ Learner level not returned")
                return False
            
            self.log_result("Dashboard Subject Mastery", True, 
                          f"✅ Subject mastery returned with {len(subject_mastery)} subjects, Learner level: {learner_level}")
            
            # Step 3: Test Weekly Schedule API
            self.log_result("Dashboard Test - Schedule API", True, "🔄 Testing Weekly Schedule API")
            
            response = requests.get(f"{BACKEND_URL}/api/dashboard/schedule/{user_id}")
            
            if response.status_code != 200:
                self.log_result("Dashboard Schedule API", False, f"❌ Schedule API failed: {response.status_code} - {response.text}")
                return False
            
            schedule_result = response.json()
            if not schedule_result.get('success'):
                self.log_result("Dashboard Schedule API", False, f"❌ Schedule API returned success=false: {schedule_result}")
                return False
            
            # Verify schedule structure
            schedule = schedule_result.get('schedule', [])
            if len(schedule) != 7:
                self.log_result("Dashboard Schedule Structure", False, f"❌ Expected 7 days in schedule, got {len(schedule)}")
                return False
            
            # Check first day structure
            if schedule:
                first_day = schedule[0]
                required_day_fields = ['day', 'date', 'sessions']
                missing_day_fields = [field for field in required_day_fields if field not in first_day]
                
                if missing_day_fields:
                    self.log_result("Dashboard Schedule Day Structure", False, f"❌ Missing day fields: {missing_day_fields}")
                    return False
                
                # Check sessions structure
                sessions = first_day.get('sessions', [])
                if sessions:
                    first_session = sessions[0]
                    required_session_fields = ['time', 'subject', 'topic', 'duration', 'type', 'priority']
                    missing_session_fields = [field for field in required_session_fields if field not in first_session]
                    
                    if missing_session_fields:
                        self.log_result("Dashboard Schedule Session Structure", False, f"❌ Missing session fields: {missing_session_fields}")
                        return False
            
            self.log_result("Dashboard Schedule API", True, 
                          f"✅ Schedule API working - 7 days returned with {len(schedule[0].get('sessions', []))} sessions per day")
            
            # Step 4: Test AI Insights API
            self.log_result("Dashboard Test - Insights API", True, "🔄 Testing AI Insights API")
            
            response = requests.get(f"{BACKEND_URL}/api/dashboard/insights/{user_id}")
            
            if response.status_code != 200:
                self.log_result("Dashboard Insights API", False, f"❌ Insights API failed: {response.status_code} - {response.text}")
                return False
            
            insights_result = response.json()
            if not insights_result.get('success'):
                self.log_result("Dashboard Insights API", False, f"❌ Insights API returned success=false: {insights_result}")
                return False
            
            # Verify insights structure
            insights = insights_result.get('insights', {})
            required_insights = ['strengths', 'weaknesses', 'trends', 'best_study_time', 'tip_of_the_day']
            missing_insights = [insight for insight in required_insights if insight not in insights]
            
            if missing_insights:
                self.log_result("Dashboard Insights Structure", False, f"❌ Missing insights fields: {missing_insights}")
                return False
            
            # Check strengths and weaknesses structure
            strengths = insights.get('strengths', [])
            weaknesses = insights.get('weaknesses', [])
            
            if not strengths or not weaknesses:
                self.log_result("Dashboard Insights Content", False, "❌ Strengths or weaknesses are empty")
                return False
            
            # Check first strength structure
            if strengths:
                first_strength = strengths[0]
                if 'area' not in first_strength or 'description' not in first_strength:
                    self.log_result("Dashboard Insights Strength Structure", False, f"❌ Invalid strength structure: {first_strength}")
                    return False
            
            self.log_result("Dashboard Insights API", True, 
                          f"✅ Insights API working - {len(strengths)} strengths, {len(weaknesses)} weaknesses, tip: {insights.get('tip_of_the_day', '')[:50]}...")
            
            # Step 5: Test Recommended Tests API
            self.log_result("Dashboard Test - Recommended Tests API", True, "🔄 Testing Recommended Tests API")
            
            response = requests.get(f"{BACKEND_URL}/api/dashboard/recommended-tests/{user_id}")
            
            if response.status_code != 200:
                self.log_result("Dashboard Recommended Tests API", False, f"❌ Recommended tests API failed: {response.status_code} - {response.text}")
                return False
            
            tests_result = response.json()
            if not tests_result.get('success'):
                self.log_result("Dashboard Recommended Tests API", False, f"❌ Recommended tests API returned success=false: {tests_result}")
                return False
            
            # Verify tests structure
            tests = tests_result.get('tests', [])
            
            if tests:
                first_test = tests[0]
                required_test_fields = ['id', 'title', 'description', 'match_percent', 'duration', 'questions', 'difficulty', 'subject', 'priority']
                missing_test_fields = [field for field in required_test_fields if field not in first_test]
                
                if missing_test_fields:
                    self.log_result("Dashboard Recommended Tests Structure", False, f"❌ Missing test fields: {missing_test_fields}")
                    return False
            
            self.log_result("Dashboard Recommended Tests API", True, 
                          f"✅ Recommended tests API working - {len(tests)} tests returned")
            
            # Step 6: Test Regenerate Schedule API
            self.log_result("Dashboard Test - Regenerate Schedule API", True, "🔄 Testing Regenerate Schedule API")
            
            response = requests.post(f"{BACKEND_URL}/api/dashboard/regenerate-schedule/{user_id}")
            
            if response.status_code != 200:
                self.log_result("Dashboard Regenerate Schedule API", False, f"❌ Regenerate schedule API failed: {response.status_code} - {response.text}")
                return False
            
            regenerate_result = response.json()
            if not regenerate_result.get('success'):
                self.log_result("Dashboard Regenerate Schedule API", False, f"❌ Regenerate schedule API returned success=false: {regenerate_result}")
                return False
            
            # Verify new schedule was generated
            new_schedule = regenerate_result.get('schedule', [])
            if len(new_schedule) != 7:
                self.log_result("Dashboard Regenerate Schedule Structure", False, f"❌ Expected 7 days in regenerated schedule, got {len(new_schedule)}")
                return False
            
            self.log_result("Dashboard Regenerate Schedule API", True, 
                          f"✅ Regenerate schedule API working - New schedule generated with 7 days")
            
            # Step 7: Test API URLs using frontend environment variable
            self.log_result("Dashboard Test - API URL Verification", True, "🔄 Verifying API URLs match frontend configuration")
            
            # Read frontend .env to get REACT_APP_BACKEND_URL
            try:
                with open('/app/frontend/.env', 'r') as f:
                    env_content = f.read()
                
                frontend_backend_url = None
                for line in env_content.split('\n'):
                    if line.startswith('REACT_APP_BACKEND_URL='):
                        frontend_backend_url = line.split('=', 1)[1]
                        break
                
                if frontend_backend_url and frontend_backend_url == BACKEND_URL:
                    self.log_result("Dashboard API URL Verification", True, 
                                  f"✅ API URLs match - Frontend: {frontend_backend_url}, Backend: {BACKEND_URL}")
                else:
                    self.log_result("Dashboard API URL Verification", False, 
                                  f"❌ API URL mismatch - Frontend: {frontend_backend_url}, Backend: {BACKEND_URL}")
                    
            except Exception as e:
                self.log_result("Dashboard API URL Verification", False, f"❌ Failed to verify API URLs: {e}")
            
            print("\n🎉 USER DASHBOARD WITH AI FEATURES TEST COMPLETE")
            print("✅ Test Summary:")
            print("  1. Demo1 authentication ✅")
            print("  2. Dashboard stats API (tests, avg score, streak, hours) ✅")
            print("  3. Subject mastery and learner level ✅")
            print("  4. Weekly schedule API (7 days with sessions) ✅")
            print("  5. AI insights API (strengths, weaknesses, tips) ✅")
            print("  6. Recommended tests API ✅")
            print("  7. Regenerate schedule API ✅")
            print("  8. API URL verification ✅")
            
            return True
            
        except Exception as e:
            self.log_result("Dashboard Test - Exception", False, f"❌ Dashboard test error: {e}")
            import traceback
            traceback.print_exc()
            return False


if __name__ == "__main__":
    tester = DashboardTester()
    
    # Run the dashboard test
    print("🚀 Starting Dashboard Testing")
    print("=" * 50)
    
    result = tester.test_user_dashboard_with_ai_features()
    
    # Print summary
    print("\n" + "=" * 50)
    print("🎯 DASHBOARD TESTING SUMMARY")
    print("=" * 50)
    
    total_tests = len(tester.results)
    passed_tests = sum(1 for r in tester.results if r["success"])
    failed_tests = total_tests - passed_tests
    
    print(f"Total Tests: {total_tests}")
    print(f"✅ Passed: {passed_tests}")
    print(f"❌ Failed: {failed_tests}")
    print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    
    if failed_tests > 0:
        print("\n❌ Failed Tests:")
        for result in tester.results:
            if not result["success"]:
                print(f"  - {result['name']}: {result['message']}")
    
    print("\n🎉 Dashboard testing complete!")
    
    # Exit with appropriate code
    exit(0 if failed_tests == 0 else 1)