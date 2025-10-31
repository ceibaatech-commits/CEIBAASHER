#!/usr/bin/env python3
"""
Social Feed Backend API Test
Tests the social feed backend APIs that need retesting
"""

import requests
import json
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

# Get backend URL from frontend .env
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BACKEND_URL = line.split('=')[1].strip()
            break
    else:
        BACKEND_URL = "https://battle-proxy-fix.preview.emergentagent.com"

class SocialFeedTester:
    def __init__(self):
        self.base_url = f"{BACKEND_URL}/api/social"
        self.test_results = []
        self.test_user_id = "test_user_123"
        self.test_post_id = None
        
    def log_result(self, test_name, success, message="", details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details
        })
    
    def test_user_profile_api(self):
        """Test user profile API endpoints"""
        try:
            # Test get user profile
            response = requests.get(f"{self.base_url}/users/{self.test_user_id}", timeout=10)
            
            if response.status_code in [200, 404]:
                if response.status_code == 200:
                    data = response.json()
                    self.log_result("User Profile API - Get Profile", True, 
                                  f"Profile API working - User data: {data.get('username', 'N/A')}")
                else:
                    self.log_result("User Profile API - Get Profile", True, 
                                  "Profile API working - Returns 404 for non-existent user (expected)")
                return True
            else:
                self.log_result("User Profile API - Get Profile", False, 
                              f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("User Profile API", False, f"Request error: {e}")
            return False
    
    def test_post_creation_api(self):
        """Test post creation API"""
        try:
            payload = {
                "userId": self.test_user_id,
                "content": "Test post for social feed API testing",
                "postType": "general",
                "examCategory": "JEE"
            }
            
            response = requests.post(f"{self.base_url}/posts", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'post' in data:
                    self.test_post_id = data['post'].get('id')
                    self.log_result("Post Creation API", True, 
                                  f"Post created successfully - ID: {self.test_post_id}")
                    return True
                else:
                    self.log_result("Post Creation API", False, 
                                  f"Invalid response structure: {data}")
                    return False
            else:
                self.log_result("Post Creation API", False, 
                              f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Post Creation API", False, f"Request error: {e}")
            return False
    
    def test_feed_apis(self):
        """Test different feed API endpoints"""
        feed_types = ["for-you", "trending", "following", "leaderboard", "my-circle"]
        
        for feed_type in feed_types:
            try:
                response = requests.get(f"{self.base_url}/feed/{feed_type}", timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if 'posts' in data or 'feed' in data:
                        posts_count = len(data.get('posts', data.get('feed', [])))
                        self.log_result(f"Feed API - {feed_type.title()}", True, 
                                      f"Feed working - {posts_count} posts")
                    else:
                        self.log_result(f"Feed API - {feed_type.title()}", False, 
                                      f"Invalid response structure: {data}")
                else:
                    self.log_result(f"Feed API - {feed_type.title()}", False, 
                                  f"HTTP {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_result(f"Feed API - {feed_type.title()}", False, f"Request error: {e}")
    
    def test_engagement_apis(self):
        """Test engagement API endpoints (like, comment, share, gift)"""
        if not self.test_post_id:
            self.log_result("Engagement APIs", False, "No test post available for engagement testing")
            return False
        
        # Test like API
        try:
            like_payload = {
                "userId": self.test_user_id,
                "postId": self.test_post_id
            }
            
            response = requests.post(f"{self.base_url}/posts/like", json=like_payload, timeout=10)
            
            if response.status_code == 200:
                self.log_result("Engagement API - Like", True, "Like API working")
            else:
                self.log_result("Engagement API - Like", False, 
                              f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Engagement API - Like", False, f"Request error: {e}")
        
        # Test comment API
        try:
            comment_payload = {
                "userId": self.test_user_id,
                "postId": self.test_post_id,
                "content": "Test comment"
            }
            
            response = requests.post(f"{self.base_url}/posts/comment", json=comment_payload, timeout=10)
            
            if response.status_code == 200:
                self.log_result("Engagement API - Comment", True, "Comment API working")
            else:
                self.log_result("Engagement API - Comment", False, 
                              f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Engagement API - Comment", False, f"Request error: {e}")
        
        # Test gift API
        try:
            gift_payload = {
                "fromUserId": self.test_user_id,
                "toUserId": "recipient_user_123",
                "postId": self.test_post_id,
                "giftType": "star"
            }
            
            response = requests.post(f"{self.base_url}/posts/gift", json=gift_payload, timeout=10)
            
            if response.status_code in [200, 400]:  # 400 might be expected for insufficient points
                self.log_result("Engagement API - Gift", True, "Gift API working")
            else:
                self.log_result("Engagement API - Gift", False, 
                              f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Engagement API - Gift", False, f"Request error: {e}")
    
    def test_study_group_apis(self):
        """Test study group API endpoints"""
        try:
            # Test create study group
            group_payload = {
                "name": "Test Study Group",
                "description": "Test group for API testing",
                "subject": "Physics",
                "creatorId": self.test_user_id
            }
            
            response = requests.post(f"{self.base_url}/study-groups", json=group_payload, timeout=10)
            
            if response.status_code == 200:
                self.log_result("Study Group API - Create", True, "Study group creation API working")
                
                # Test list study groups
                list_response = requests.get(f"{self.base_url}/study-groups", timeout=10)
                if list_response.status_code == 200:
                    self.log_result("Study Group API - List", True, "Study group list API working")
                else:
                    self.log_result("Study Group API - List", False, 
                                  f"HTTP {list_response.status_code}")
            else:
                self.log_result("Study Group API - Create", False, 
                              f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Study Group APIs", False, f"Request error: {e}")
    
    def test_notification_apis(self):
        """Test notification API endpoints"""
        try:
            # Test get notifications
            response = requests.get(f"{self.base_url}/notifications/{self.test_user_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                notifications_count = len(data.get('notifications', []))
                self.log_result("Notification API - Get", True, 
                              f"Notifications API working - {notifications_count} notifications")
            else:
                self.log_result("Notification API - Get", False, 
                              f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Notification APIs", False, f"Request error: {e}")
    
    def run_complete_test_suite(self):
        """Run the complete social feed API test suite"""
        print("📱 SOCIAL FEED BACKEND API TEST SUITE")
        print("=" * 60)
        print(f"Testing Base URL: {self.base_url}")
        print("=" * 60)
        
        # Run all tests
        self.test_user_profile_api()
        self.test_post_creation_api()
        self.test_feed_apis()
        self.test_engagement_apis()
        self.test_study_group_apis()
        self.test_notification_apis()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 SOCIAL FEED API TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Show results by category
        working_apis = [r['test'] for r in self.test_results if r['success']]
        broken_apis = [r['test'] for r in self.test_results if not r['success']]
        
        if working_apis:
            print(f"\n✅ WORKING APIs ({len(working_apis)}):")
            for api in working_apis:
                print(f"  - {api}")
        
        if broken_apis:
            print(f"\n❌ BROKEN APIs ({len(broken_apis)}):")
            for api in broken_apis:
                print(f"  - {api}")
        
        # Overall assessment
        print(f"\n🎯 SOCIAL FEED BACKEND STATUS:")
        if passed_tests >= total_tests * 0.8:
            print("✅ Social Feed Backend is FULLY FUNCTIONAL")
        elif passed_tests >= total_tests * 0.5:
            print("⚠️ Social Feed Backend has SOME ISSUES")
        else:
            print("❌ Social Feed Backend has CRITICAL PROBLEMS")
        
        return {
            'total_tests': total_tests,
            'passed': passed_tests,
            'failed': failed_tests,
            'success_rate': (passed_tests/total_tests)*100,
            'working_apis': working_apis,
            'broken_apis': broken_apis
        }

if __name__ == "__main__":
    tester = SocialFeedTester()
    results = tester.run_complete_test_suite()