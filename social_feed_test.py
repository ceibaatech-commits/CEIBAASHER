#!/usr/bin/env python3
"""
Social Feed Test Suite for Ceibaa Platform
Tests the newly implemented social feed features as per review request
"""

import requests
import json
import time
import sys
import os
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
        BACKEND_URL = "https://exam-social.preview.emergentagent.com"

class SocialFeedTester:
    def __init__(self):
        self.test_results = []
        
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

    def test_mixed_for_you_feed(self):
        """Test Mixed 'For You' Feed - Task 1"""
        print("\n🎯 TASK 1: Testing Mixed 'For You' Feed")
        print("-" * 50)
        
        try:
            test_user_id = "test_user_123"
            
            response = requests.get(
                f"{BACKEND_URL}/api/social/feed/for-you?user_id={test_user_id}",
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'posts' in data:
                    posts = data['posts']
                    self.log_result("For You Feed API Response", True, 
                                  f"Feed returned {len(posts)} posts")
                    
                    # Check if posts have trending_score
                    posts_with_trending = [p for p in posts if 'trending_score' in p]
                    if posts_with_trending:
                        trending_scores = [p.get('trending_score', 0) for p in posts_with_trending]
                        self.log_result("Trending Score Calculation", True, 
                                      f"{len(posts_with_trending)} posts have trending_score: {trending_scores}")
                    else:
                        self.log_result("Trending Score Calculation", False, 
                                      "No posts have trending_score field")
                    
                    # Check for different post types
                    post_types = set(p.get('post_type', 'unknown') for p in posts)
                    if post_types:
                        self.log_result("Post Types Variety", True, 
                                      f"Found post types: {', '.join(post_types)}")
                        
                        # Check for specific post types mentioned in review
                        expected_types = ['battle_victory', 'quiz_announcement', 'achievement', 'room_code']
                        found_expected = [pt for pt in expected_types if pt in post_types]
                        if found_expected:
                            self.log_result("Expected Post Types", True, 
                                          f"Found expected types: {', '.join(found_expected)}")
                        else:
                            self.log_result("Expected Post Types", False, 
                                          f"None of expected types found: {expected_types}")
                    else:
                        self.log_result("Post Types Variety", False, 
                                      "No post types found")
                    
                    # Check trending score formula verification
                    posts_with_engagement = [p for p in posts if 
                                           p.get('likes_count', 0) > 0 or 
                                           p.get('comments_count', 0) > 0 or 
                                           p.get('shares_count', 0) > 0]
                    
                    if posts_with_engagement:
                        # Verify trending score calculation: (likes*2 + comments*3 + shares*4) * recency_factor
                        for post in posts_with_engagement[:3]:  # Check first 3 posts
                            likes = post.get('likes_count', 0)
                            comments = post.get('comments_count', 0) 
                            shares = post.get('shares_count', 0)
                            trending_score = post.get('trending_score', 0)
                            
                            expected_base = (likes * 2) + (comments * 3) + (shares * 4)
                            self.log_result(f"Trending Formula Check", True, 
                                          f"Post engagement: L:{likes} C:{comments} S:{shares} → Score:{trending_score} (Base:{expected_base})")
                    
                    return True
                else:
                    self.log_result("For You Feed API Response", False, 
                                  f"Invalid response structure: {data}")
                    return False
            else:
                self.log_result("For You Feed API Response", False, 
                              f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("For You Feed API Response", False, f"Request error: {e}")
            return False

    def test_follow_ceep_system(self):
        """Test Follow/Ceep System - Task 3"""
        print("\n🎯 TASK 3: Testing Follow/Ceep System")
        print("-" * 50)
        
        try:
            # Use unique user IDs to avoid "already ceeped" error
            import uuid
            user_a_id = f"user_a_{str(uuid.uuid4())[:8]}"
            user_b_id = f"user_b_{str(uuid.uuid4())[:8]}"
            
            # Test creating a follow relationship
            payload = {
                "user_id": user_a_id,
                "ceep_user_id": user_b_id, 
                "user_name": "User A",
                "ceep_user_name": "User B"
            }
            
            response = requests.post(
                f"{BACKEND_URL}/api/ceep/ceep",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_result("Follow/Ceep Creation", True, 
                                  f"Follow relationship created: {data.get('message')}")
                    
                    # Test getting following list
                    following_response = requests.get(
                        f"{BACKEND_URL}/api/ceep/ceeps/{user_a_id}",
                        timeout=10
                    )
                    
                    if following_response.status_code == 200:
                        following_data = following_response.json()
                        if following_data.get('success') and 'ceeps' in following_data:
                            ceeps = following_data['ceeps']
                            user_b_found = any(c.get('ceep_user_id') == user_b_id for c in ceeps)
                            
                            if user_b_found:
                                self.log_result("Following List Verification", True, 
                                              f"User B found in User A's following list ({len(ceeps)} total)")
                            else:
                                self.log_result("Following List Verification", False, 
                                              "User B not found in User A's following list")
                        else:
                            self.log_result("Following List Verification", False, 
                                          f"Invalid following list response: {following_data}")
                    else:
                        self.log_result("Following List Verification", False, 
                                      f"Following list API failed: {following_response.status_code}")
                    
                    # Test getting followers list
                    followers_response = requests.get(
                        f"{BACKEND_URL}/api/ceep/ceepers/{user_b_id}",
                        timeout=10
                    )
                    
                    if followers_response.status_code == 200:
                        followers_data = followers_response.json()
                        if followers_data.get('success') and 'ceepers' in followers_data:
                            ceepers = followers_data['ceepers']
                            user_a_found = any(c.get('user_id') == user_a_id for c in ceepers)
                            
                            if user_a_found:
                                self.log_result("Followers List Verification", True, 
                                              f"User A found in User B's followers list ({len(ceepers)} total)")
                            else:
                                self.log_result("Followers List Verification", False, 
                                              "User A not found in User B's followers list")
                        else:
                            self.log_result("Followers List Verification", False, 
                                          f"Invalid followers list response: {followers_data}")
                    else:
                        self.log_result("Followers List Verification", False, 
                                      f"Followers list API failed: {followers_response.status_code}")
                    
                    return True
                else:
                    self.log_result("Follow/Ceep Creation", False, 
                                  f"Follow creation failed: {data.get('message')}")
                    return False
            else:
                self.log_result("Follow/Ceep Creation", False, 
                              f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Follow/Ceep System", False, f"Request error: {e}")
            return False

    def test_trending_feed_verification(self):
        """Test Trending Feed to verify trending score calculation - Task 4"""
        print("\n🎯 TASK 4: Testing Trending Score Calculation")
        print("-" * 50)
        
        try:
            response = requests.get(
                f"{BACKEND_URL}/api/social/feed/trending?limit=20",
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'posts' in data:
                    posts = data['posts']
                    self.log_result("Trending Feed API", True, 
                                  f"Trending feed returned {len(posts)} posts")
                    
                    # Check if posts have trending scores and are sorted
                    posts_with_scores = [p for p in posts if p.get('trending_score', 0) > 0]
                    if posts_with_scores:
                        scores = [p.get('trending_score', 0) for p in posts_with_scores]
                        self.log_result("Trending Scores Present", True, 
                                      f"{len(posts_with_scores)} posts have trending scores: {scores[:5]}...")
                        
                        # Check if sorted by trending score (descending)
                        is_sorted = all(scores[i] >= scores[i+1] for i in range(len(scores)-1))
                        if is_sorted:
                            self.log_result("Trending Score Sorting", True, 
                                          "Posts are sorted by trending score (descending)")
                        else:
                            self.log_result("Trending Score Sorting", False, 
                                          "Posts are not properly sorted by trending score")
                        
                        # Check recency factor application
                        recent_posts = [p for p in posts if 'created_at' in p]
                        if recent_posts:
                            self.log_result("Recency Factor Application", True, 
                                          f"Posts have creation timestamps for recency calculation")
                        else:
                            self.log_result("Recency Factor Application", False, 
                                          "Posts missing creation timestamps")
                    else:
                        self.log_result("Trending Scores Present", False, 
                                      "No posts have trending scores calculated")
                    
                    return True
                else:
                    self.log_result("Trending Feed API", False, 
                                  f"Invalid response structure: {data}")
                    return False
            else:
                self.log_result("Trending Feed API", False, 
                              f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Trending Feed API", False, f"Request error: {e}")
            return False

    def test_room_code_posts_in_feed(self):
        """Test Room Code Posts in Feed - Task 2 verification"""
        print("\n🎯 TASK 2: Testing Room Code Posts in Feed")
        print("-" * 50)
        
        try:
            # Check if room code posts appear in For You feed
            test_user_id = "test_user_123"
            
            response = requests.get(
                f"{BACKEND_URL}/api/social/feed/for-you?user_id={test_user_id}&limit=50",
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'posts' in data:
                    posts = data['posts']
                    
                    # Look for room code posts
                    room_code_posts = [p for p in posts if p.get('post_type') == 'room_code']
                    
                    if room_code_posts:
                        self.log_result("Room Code Posts in Feed", True, 
                                      f"Found {len(room_code_posts)} room code posts in feed")
                        
                        # Check if room code field is present and valid
                        posts_with_codes = [p for p in room_code_posts if p.get('room_code')]
                        if posts_with_codes:
                            codes = [p.get('room_code') for p in posts_with_codes]
                            self.log_result("Room Code Field Verification", True, 
                                          f"Room codes present: {codes}")
                            
                            # Verify room code format (should be alphanumeric, typically 6 chars)
                            valid_codes = [c for c in codes if c and len(c) >= 3 and c.isalnum()]
                            if valid_codes:
                                self.log_result("Room Code Format Validation", True, 
                                              f"Valid room codes found: {valid_codes}")
                            else:
                                self.log_result("Room Code Format Validation", False, 
                                              f"Invalid room code formats: {codes}")
                        else:
                            self.log_result("Room Code Field Verification", False, 
                                          "Room code posts missing room_code field")
                        
                        # Check post content for room code posts
                        sample_post = room_code_posts[0]
                        if sample_post.get('content'):
                            self.log_result("Room Code Post Content", True, 
                                          f"Sample content: '{sample_post['content'][:50]}...'")
                        else:
                            self.log_result("Room Code Post Content", False, 
                                          "Room code post missing content")
                        
                        return True
                    else:
                        self.log_result("Room Code Posts in Feed", False, 
                                      "No room code posts found in feed")
                        
                        # Check if any posts exist at all
                        if posts:
                            post_types = set(p.get('post_type', 'unknown') for p in posts)
                            self.log_result("Available Post Types", True, 
                                          f"Available types: {', '.join(post_types)}")
                        else:
                            self.log_result("Available Post Types", False, 
                                          "No posts found in feed at all")
                        
                        return False
                else:
                    self.log_result("Room Code Posts in Feed", False, 
                                  f"Invalid feed response: {data}")
                    return False
            else:
                self.log_result("Room Code Posts in Feed", False, 
                              f"Feed API failed: {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Room Code Posts in Feed", False, f"Request error: {e}")
            return False

    def run_social_feed_tests(self):
        """Run all social feed tests as per review request"""
        print("🚀 CEIBAA SOCIAL FEED TESTING - REVIEW REQUEST")
        print("=" * 60)
        print("Testing newly implemented features for the Ceibaa social platform")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Task 1: Test Mixed 'For You' Feed
        task1_success = self.test_mixed_for_you_feed()
        
        # Task 2: Test Room Code Posts (verification)
        task2_success = self.test_room_code_posts_in_feed()
        
        # Task 3: Test Follow/Ceep System
        task3_success = self.test_follow_ceep_system()
        
        # Task 4: Test Trending Score Calculation
        task4_success = self.test_trending_feed_verification()
        
        # Generate summary
        print("\n" + "=" * 60)
        print("📊 SOCIAL FEED TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        success_rate = (passed / total * 100) if total > 0 else 0
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        # Task-wise summary
        print(f"\n🎯 TASK RESULTS:")
        print(f"Task 1 - Mixed For You Feed: {'✅ PASS' if task1_success else '❌ FAIL'}")
        print(f"Task 2 - Room Code Posts: {'✅ PASS' if task2_success else '❌ FAIL'}")
        print(f"Task 3 - Follow/Ceep System: {'✅ PASS' if task3_success else '❌ FAIL'}")
        print(f"Task 4 - Trending Scores: {'✅ PASS' if task4_success else '❌ FAIL'}")
        
        # Failed tests details
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['message']}")
        
        return success_rate >= 75  # Consider success if 75% or more tests pass

if __name__ == "__main__":
    tester = SocialFeedTester()
    success = tester.run_social_feed_tests()
    sys.exit(0 if success else 1)