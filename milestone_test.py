#!/usr/bin/env python3
"""
Milestone & Monetization System Test
Tests the Earn page functionality as specified in the review request
"""
import os
import requests
import json

# Get backend URL from environment
BACKEND_URL = os.environ.get("BACKEND_URL", "https://quizmaster-299.preview.emergentagent.com")

class MilestoneSystemTester:
    def __init__(self):
        self.results = []
        self.token = None
        self.user_id = None

    def log_result(self, name: str, success: bool, message: str):
        self.results.append({"name": name, "success": success, "message": message})
        status = "✅" if success else "❌"
        print(f"{status} {name}: {message}")

    def login_demo1(self):
        """Login as demo1 via POST /api/auth/demo-login"""
        try:
            response = requests.post(f"{BACKEND_URL}/api/auth/demo-login", json={
                "username": "demo1",
                "password": "demo1"
            })
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('access_token')
                self.user_id = data.get('user', {}).get('id') or data.get('user', {}).get('user_id')
                
                if self.token and self.user_id:
                    self.log_result("Demo1 Login", True, f"Successfully logged in with user_id: {self.user_id}")
                    return True
                else:
                    self.log_result("Demo1 Login", False, f"Missing token or user_id in response: {data}")
                    return False
            else:
                self.log_result("Demo1 Login", False, f"Login failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Demo1 Login", False, f"Login error: {e}")
            return False

    def test_milestone_progress_api(self):
        """Test GET /api/milestones/progress with Authorization: Bearer {token}"""
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(f"{BACKEND_URL}/api/milestones/progress", headers=headers)
            
            if response.status_code != 200:
                self.log_result("Milestone Progress API", False, f"API failed: {response.status_code} - {response.text}")
                return False
            
            result = response.json()
            
            if not result.get('success'):
                self.log_result("Milestone Progress API", False, f"API returned success=false: {result}")
                return False
            
            # Verify response structure
            required_fields = ['user', 'stats', 'milestones', 'features']
            missing_fields = [field for field in required_fields if field not in result]
            
            if missing_fields:
                self.log_result("Milestone Progress Structure", False, f"Missing fields: {missing_fields}")
                return False
            
            # Verify user info contains id, name, username
            user_info = result.get('user', {})
            user_required = ['id', 'name', 'username']
            user_missing = [field for field in user_required if field not in user_info]
            
            if user_missing:
                self.log_result("Milestone User Info", False, f"Missing user fields: {user_missing}")
                return False
            
            # Verify stats contains posts_count, followers_count
            stats = result.get('stats', {})
            stats_required = ['posts_count', 'followers_count']
            stats_missing = [field for field in stats_required if field not in stats]
            
            if stats_missing:
                self.log_result("Milestone Stats", False, f"Missing stats fields: {stats_missing}")
                return False
            
            # Verify milestones array has 3 items
            milestones = result.get('milestones', [])
            if len(milestones) != 3:
                self.log_result("Milestone Array", False, f"Expected 3 milestones, got {len(milestones)}")
                return False
            
            # Verify milestone names
            milestone_names = [m.get('name') for m in milestones]
            expected_names = ['Creator Badge', 'Media Creator', 'Monetization Partner']
            
            for expected in expected_names:
                if expected not in milestone_names:
                    self.log_result("Milestone Names", False, f"Missing milestone: {expected}. Got: {milestone_names}")
                    return False
            
            # Verify features object has unlock statuses
            features = result.get('features', {})
            feature_required = ['badge_unlocked', 'media_posting_unlocked', 'monetization_unlocked']
            feature_missing = [field for field in feature_required if field not in features]
            
            if feature_missing:
                self.log_result("Milestone Features", False, f"Missing feature fields: {feature_missing}")
                return False
            
            self.log_result("Milestone Progress API", True, 
                          f"API working correctly - User: {user_info['name']}, Posts: {stats['posts_count']}, Followers: {stats['followers_count']}")
            return True
            
        except Exception as e:
            self.log_result("Milestone Progress API", False, f"Test error: {e}")
            return False

    def test_simulation_add_posts(self):
        """Test POST /api/milestones/simulate?action=add_post multiple times"""
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            
            # Call multiple times to simulate reaching 500 posts
            for i in range(5):  # 5 calls = 500 posts (100 each)
                response = requests.post(f"{BACKEND_URL}/api/milestones/simulate?action=add_post", headers=headers)
                
                if response.status_code != 200:
                    self.log_result("Simulation Add Posts", False, f"API failed on call {i+1}: {response.status_code} - {response.text}")
                    return False
                
                result = response.json()
                
                if not result.get('success'):
                    self.log_result("Simulation Add Posts", False, f"API returned success=false on call {i+1}: {result}")
                    return False
                
                simulation = result.get('simulation', {})
                expected_posts = (i + 1) * 100
                
                if simulation.get('posts') != expected_posts:
                    self.log_result("Simulation Add Posts", False, 
                                  f"Call {i+1}: Expected {expected_posts} posts, got {simulation.get('posts')}")
                    return False
            
            self.log_result("Simulation Add Posts", True, "Successfully simulated 500 posts (5 calls × 100 posts)")
            return True
            
        except Exception as e:
            self.log_result("Simulation Add Posts", False, f"Test error: {e}")
            return False

    def test_simulation_add_followers(self):
        """Test POST /api/milestones/simulate?action=add_followers multiple times"""
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            
            # Call multiple times to simulate reaching 2500 followers
            for i in range(10):  # 10 calls = 2500 followers (250 each)
                response = requests.post(f"{BACKEND_URL}/api/milestones/simulate?action=add_followers", headers=headers)
                
                if response.status_code != 200:
                    self.log_result("Simulation Add Followers", False, f"API failed on call {i+1}: {response.status_code} - {response.text}")
                    return False
                
                result = response.json()
                
                if not result.get('success'):
                    self.log_result("Simulation Add Followers", False, f"API returned success=false on call {i+1}: {result}")
                    return False
                
                simulation = result.get('simulation', {})
                expected_followers = (i + 1) * 250
                
                if simulation.get('followers') != expected_followers:
                    self.log_result("Simulation Add Followers", False, 
                                  f"Call {i+1}: Expected {expected_followers} followers, got {simulation.get('followers')}")
                    return False
            
            self.log_result("Simulation Add Followers", True, "Successfully simulated 2500 followers (10 calls × 250 followers)")
            return True
            
        except Exception as e:
            self.log_result("Simulation Add Followers", False, f"Test error: {e}")
            return False

    def test_badge_selection_api(self):
        """Test POST /api/milestones/select-badge with {"badge_type": "Teacher"}"""
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            
            # Test with insufficient posts (should fail)
            badge_data = {"badge_type": "Teacher"}
            response = requests.post(f"{BACKEND_URL}/api/milestones/select-badge", json=badge_data, headers=headers)
            
            if response.status_code == 400:
                result = response.json()
                if "500 posts" in result.get('detail', ''):
                    self.log_result("Badge Selection - Insufficient Posts", True, "Correctly rejected badge selection with insufficient posts")
                    
                    # Extract current posts count from error message
                    detail = result.get('detail', '')
                    import re
                    match = re.search(r'Current: (\d+)', detail)
                    if match:
                        current_posts = int(match.group(1))
                        self.log_result("Badge Selection - Current Posts", True, f"User currently has {current_posts} posts (needs 500)")
                    
                    return True
                else:
                    self.log_result("Badge Selection - Insufficient Posts", False, f"Wrong error message: {result}")
                    return False
            else:
                # If user already has 500+ posts, test should pass
                if response.status_code == 200:
                    result = response.json()
                    if result.get('success') and result.get('badge_type') == 'Teacher':
                        self.log_result("Badge Selection API", True, "Badge selection working - Teacher badge selected (user already had 500+ posts)")
                        return True
                    else:
                        self.log_result("Badge Selection API", False, f"Unexpected success response: {result}")
                        return False
                else:
                    self.log_result("Badge Selection - Unexpected Status", False, f"Expected 400 or 200, got {response.status_code}")
                    return False
            
        except Exception as e:
            self.log_result("Badge Selection API", False, f"Test error: {e}")
            return False

    def test_simulation_data_verification(self):
        """Test that simulation data is properly stored and retrieved"""
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            
            # Get simulation data
            response = requests.get(f"{BACKEND_URL}/api/milestones/simulation", headers=headers)
            
            if response.status_code != 200:
                self.log_result("Simulation Data Verification", False, f"API failed: {response.status_code} - {response.text}")
                return False
            
            result = response.json()
            
            if not result.get('success'):
                self.log_result("Simulation Data Verification", False, f"API returned success=false: {result}")
                return False
            
            simulation = result.get('simulation', {})
            
            # Should have 500 posts and 2500 followers from previous tests
            expected_posts = 500
            expected_followers = 2500
            
            if simulation.get('simulated_posts') != expected_posts:
                self.log_result("Simulation Posts Verification", False, 
                              f"Expected {expected_posts} simulated posts, got {simulation.get('simulated_posts')}")
                return False
            
            if simulation.get('simulated_followers') != expected_followers:
                self.log_result("Simulation Followers Verification", False, 
                              f"Expected {expected_followers} simulated followers, got {simulation.get('simulated_followers')}")
                return False
            
            self.log_result("Simulation Data Verification", True, 
                          f"Simulation data correctly stored - Posts: {simulation.get('simulated_posts')}, Followers: {simulation.get('simulated_followers')}")
            return True
            
        except Exception as e:
            self.log_result("Simulation Data Verification", False, f"Test error: {e}")
            return False

    def test_earnings_simulation_api(self):
        """Test POST /api/monetization/simulate-earnings?impressions=1000&cpm_rate=50"""
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            
            # Test with specific parameters
            response = requests.post(f"{BACKEND_URL}/api/monetization/simulate-earnings?impressions=1000&cpm_rate=50", headers=headers)
            
            if response.status_code != 200:
                self.log_result("Earnings Simulation API", False, f"API failed: {response.status_code} - {response.text}")
                return False
            
            result = response.json()
            
            if not result.get('success'):
                self.log_result("Earnings Simulation API", False, f"API returned success=false: {result}")
                return False
            
            # Verify response structure
            simulation = result.get('simulation', {})
            totals = result.get('totals', {})
            
            required_sim_fields = ['creator_earning', 'platform_earning', 'total_value']
            missing_sim = [field for field in required_sim_fields if field not in simulation]
            
            if missing_sim:
                self.log_result("Earnings Simulation Structure", False, f"Missing simulation fields: {missing_sim}")
                return False
            
            required_total_fields = ['total_simulated_earnings', 'total_simulated_impressions']
            missing_total = [field for field in required_total_fields if field not in totals]
            
            if missing_total:
                self.log_result("Earnings Totals Structure", False, f"Missing totals fields: {missing_total}")
                return False
            
            # Check calculations (90% creator, 10% platform)
            expected_total_value = (1000 / 1000) * 50  # 50 INR
            expected_creator_earning = expected_total_value * 0.90  # 45 INR
            expected_platform_earning = expected_total_value * 0.10  # 5 INR
            
            if abs(simulation.get('creator_earning') - expected_creator_earning) > 0.01:
                self.log_result("Earnings Calculation", False, 
                              f"Expected creator earning {expected_creator_earning}, got {simulation.get('creator_earning')}")
                return False
            
            if abs(simulation.get('platform_earning') - expected_platform_earning) > 0.01:
                self.log_result("Earnings Calculation", False, 
                              f"Expected platform earning {expected_platform_earning}, got {simulation.get('platform_earning')}")
                return False
            
            self.log_result("Earnings Simulation API", True, 
                          f"Earnings simulation working - Creator: ₹{expected_creator_earning}, Platform: ₹{expected_platform_earning}, Total accumulated: ₹{totals['total_simulated_earnings']}")
            return True
            
        except Exception as e:
            self.log_result("Earnings Simulation API", False, f"Test error: {e}")
            return False

    def test_reset_simulation(self):
        """Test POST /api/milestones/simulate?action=reset and POST /api/monetization/reset-simulation"""
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            
            # Reset milestone simulation
            response = requests.post(f"{BACKEND_URL}/api/milestones/simulate?action=reset", headers=headers)
            
            if response.status_code != 200:
                self.log_result("Reset Milestone Simulation", False, f"API failed: {response.status_code} - {response.text}")
                return False
            
            result = response.json()
            
            if not result.get('success'):
                self.log_result("Reset Milestone Simulation", False, f"API returned success=false: {result}")
                return False
            
            simulation = result.get('simulation', {})
            if simulation.get('posts') != 0 or simulation.get('followers') != 0:
                self.log_result("Reset Milestone Simulation", False, f"Data not reset properly: {simulation}")
                return False
            
            self.log_result("Reset Milestone Simulation", True, "Milestone simulation reset successfully")
            
            # Reset monetization simulation
            response = requests.post(f"{BACKEND_URL}/api/monetization/reset-simulation", headers=headers)
            
            if response.status_code != 200:
                self.log_result("Reset Monetization Simulation", False, f"API failed: {response.status_code} - {response.text}")
                return False
            
            result = response.json()
            
            if not result.get('success'):
                self.log_result("Reset Monetization Simulation", False, f"API returned success=false: {result}")
                return False
            
            self.log_result("Reset Monetization Simulation", True, "Monetization simulation reset successfully")
            return True
            
        except Exception as e:
            self.log_result("Reset Simulation", False, f"Test error: {e}")
            return False

    def run_all_tests(self):
        """Run all milestone and monetization tests"""
        print("🎯 TESTING MILESTONE & MONETIZATION SYSTEM FOR EARN PAGE")
        print("=" * 80)
        
        # Step 1: Login as demo1
        if not self.login_demo1():
            return False
        
        # Step 1.5: Reset simulation data first
        print("\n🔄 SETUP: Reset Simulation Data")
        print("-" * 40)
        headers = {"Authorization": f"Bearer {self.token}"}
        requests.post(f"{BACKEND_URL}/api/milestones/simulate?action=reset", headers=headers)
        requests.post(f"{BACKEND_URL}/api/monetization/reset-simulation", headers=headers)
        self.log_result("Reset Simulation Setup", True, "Simulation data reset for clean test environment")
        
        # Step 2: Test Milestone Progress API
        print("\n📊 TEST CASE 1: Milestone Progress API")
        print("-" * 40)
        if not self.test_milestone_progress_api():
            return False
        
        # Step 3: Test Simulation API - Add Posts
        print("\n📝 TEST CASE 2: Simulation API - Add Posts")
        print("-" * 40)
        if not self.test_simulation_add_posts():
            return False
        
        # Step 4: Test Simulation API - Add Followers
        print("\n👥 TEST CASE 3: Simulation API - Add Followers")
        print("-" * 40)
        if not self.test_simulation_add_followers():
            return False
        
        # Step 5: Test Badge Selection API
        print("\n🏆 TEST CASE 4: Badge Selection API")
        print("-" * 40)
        if not self.test_badge_selection_api():
            return False
        
        # Step 5.5: Test Simulation Data Verification
        print("\n📊 TEST CASE 4.5: Simulation Data Verification")
        print("-" * 40)
        if not self.test_simulation_data_verification():
            return False
        
        # Step 6: Test Earnings Simulation API
        print("\n💰 TEST CASE 5: Earnings Simulation API")
        print("-" * 40)
        if not self.test_earnings_simulation_api():
            return False
        
        # Step 7: Test Reset Simulation
        print("\n🔄 TEST CASE 6: Reset Simulation")
        print("-" * 40)
        if not self.test_reset_simulation():
            return False
        
        print("\n🎉 MILESTONE & MONETIZATION SYSTEM TEST COMPLETE")
        print("✅ All test scenarios completed successfully")
        
        # Print summary
        passed = sum(1 for r in self.results if r['success'])
        total = len(self.results)
        print(f"\n📊 Test Results: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
        
        return True

if __name__ == "__main__":
    tester = MilestoneSystemTester()
    success = tester.run_all_tests()
    
    if not success:
        print("\n❌ Some tests failed. Check the output above for details.")
        exit(1)
    else:
        print("\n✅ All tests passed successfully!")
        exit(0)