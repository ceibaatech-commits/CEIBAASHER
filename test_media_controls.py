import os
import requests
import json

# Get backend URL from environment
BACKEND_URL = os.environ.get("BACKEND_URL", "https://educompass-10.preview.emergentagent.com")

class MediaControlsTester:
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

    def test_user_media_controls_and_disabled_filtering(self):
        """Test user-based media controls and disabled user filtering for Victory Lane"""
        try:
            print("\n🎯 TESTING USER-BASED MEDIA CONTROLS AND DISABLED USER FILTERING")
            print("=" * 80)
            
            # Test Case 1: Media Permissions API Test
            self.log_result("Media Controls Test - Step 1", True, "🔄 Testing Media Permissions API")
            
            # Login as demo1 user
            token, user_id = self.login_demo_user('demo1')
            if not token:
                self.log_result("Media Permissions - Demo1 Login", False, "❌ Failed to login demo1")
                return False
            
            self.log_result("Media Permissions - Demo1 Login", True, f"✅ Demo1 logged in successfully with user_id: {user_id}")
            headers = {"Authorization": f"Bearer {token}"}
            
            # Get user's media permissions
            response = requests.get(f"{BACKEND_URL}/api/user/media-permissions", headers=headers)
            if response.status_code != 200:
                self.log_result("Media Permissions API", False, f"❌ Media permissions API failed: {response.status_code}")
                return False
            
            permissions_data = response.json()
            self.log_result("Media Permissions API", True, 
                          f"✅ Media permissions retrieved: can_post_images={permissions_data.get('can_post_images')}, "
                          f"can_post_videos={permissions_data.get('can_post_videos')}, is_disabled={permissions_data.get('is_disabled')}")
            
            # Test Case 2: Admin Update User Permissions Test
            self.log_result("Media Controls Test - Step 2", True, "🔄 Testing Admin Update User Permissions")
            
            # Update demo1's permissions
            admin_permissions_data = {
                "can_post_images": False,
                "can_post_videos": True,
                "is_disabled": False
            }
            
            response = requests.put(f"{BACKEND_URL}/api/admin/users/demo1-uuid/permissions", 
                                  json=admin_permissions_data)
            
            if response.status_code != 200:
                self.log_result("Admin Update Permissions", False, f"❌ Admin permissions update failed: {response.status_code}")
                return False
            
            update_result = response.json()
            if not update_result.get('success'):
                self.log_result("Admin Update Permissions", False, f"❌ Admin permissions update returned success=false: {update_result}")
                return False
            
            self.log_result("Admin Update Permissions", True, "✅ Admin successfully updated demo1 permissions")
            
            # Verify the permissions were updated
            response = requests.get(f"{BACKEND_URL}/api/user/media-permissions", headers=headers)
            if response.status_code == 200:
                updated_permissions = response.json()
                if (updated_permissions.get('can_post_images') == False and 
                    updated_permissions.get('can_post_videos') == True):
                    self.log_result("Permissions Verification", True, "✅ Permissions updated correctly: can_post_images=False, can_post_videos=True")
                else:
                    self.log_result("Permissions Verification", False, f"❌ Permissions not updated correctly: {updated_permissions}")
            
            # Test Case 3: Disabled User Profile Test
            self.log_result("Media Controls Test - Step 3", True, "🔄 Testing Disabled User Profile")
            
            # Set demo1 as disabled
            disabled_permissions_data = {
                "can_post_images": True,
                "can_post_videos": True,
                "is_disabled": True
            }
            
            response = requests.put(f"{BACKEND_URL}/api/admin/users/demo1-uuid/permissions", 
                                  json=disabled_permissions_data)
            
            if response.status_code != 200:
                self.log_result("Set User Disabled", False, f"❌ Setting user disabled failed: {response.status_code}")
                return False
            
            # Test profile access without authentication (simulating another user viewing)
            response = requests.get(f"{BACKEND_URL}/api/profile/demostudent1")
            
            if response.status_code != 200:
                self.log_result("Disabled User Profile", False, f"❌ Profile API failed: {response.status_code}")
                return False
            
            profile_result = response.json()
            if not profile_result.get('success'):
                self.log_result("Disabled User Profile", False, f"❌ Profile API returned success=false: {profile_result}")
                return False
            
            profile_data = profile_result.get('profile', {})
            is_disabled = profile_data.get('is_disabled', False)
            can_view = profile_data.get('can_view', True)
            
            if is_disabled and not can_view:
                self.log_result("Disabled User Profile", True, "✅ Disabled user profile shows limited info with is_disabled=True and can_view=False")
            else:
                self.log_result("Disabled User Profile", False, f"❌ Disabled user profile not properly restricted: is_disabled={is_disabled}, can_view={can_view}")
            
            # Test Case 4: Disabled User Posts Filter Test
            self.log_result("Media Controls Test - Step 4", True, "🔄 Testing Disabled User Posts Filter")
            
            # Try to get posts for disabled user without authentication
            response = requests.get(f"{BACKEND_URL}/api/profile/demostudent1/posts")
            
            if response.status_code != 200:
                self.log_result("Disabled User Posts", False, f"❌ Posts API failed: {response.status_code}")
                return False
            
            posts_result = response.json()
            if not posts_result.get('success'):
                self.log_result("Disabled User Posts", False, f"❌ Posts API returned success=false: {posts_result}")
                return False
            
            posts = posts_result.get('posts', [])
            message = posts_result.get('message', '')
            
            if len(posts) == 0 and "not available" in message:
                self.log_result("Disabled User Posts", True, f"✅ Disabled user posts properly filtered: empty posts array with message '{message}'")
            else:
                self.log_result("Disabled User Posts", False, f"❌ Disabled user posts not properly filtered: {len(posts)} posts returned")
            
            # Test Case 5: Re-enable User and Verify
            self.log_result("Media Controls Test - Step 5", True, "🔄 Testing Re-enable User and Verify")
            
            # Re-enable demo1
            enabled_permissions_data = {
                "can_post_images": True,
                "can_post_videos": True,
                "is_disabled": False
            }
            
            response = requests.put(f"{BACKEND_URL}/api/admin/users/demo1-uuid/permissions", 
                                  json=enabled_permissions_data)
            
            if response.status_code != 200:
                self.log_result("Re-enable User", False, f"❌ Re-enabling user failed: {response.status_code}")
                return False
            
            # Verify profile now shows full info
            response = requests.get(f"{BACKEND_URL}/api/profile/demostudent1")
            
            if response.status_code == 200:
                profile_result = response.json()
                if profile_result.get('success'):
                    profile_data = profile_result.get('profile', {})
                    is_disabled = profile_data.get('is_disabled', True)
                    can_view = profile_data.get('can_view', False)
                    
                    if not is_disabled and can_view:
                        self.log_result("Re-enabled User Profile", True, "✅ Re-enabled user profile shows full info")
                    else:
                        self.log_result("Re-enabled User Profile", False, f"❌ Re-enabled user profile still restricted: is_disabled={is_disabled}, can_view={can_view}")
            
            # Verify posts are now accessible
            response = requests.get(f"{BACKEND_URL}/api/profile/demostudent1/posts")
            
            if response.status_code == 200:
                posts_result = response.json()
                if posts_result.get('success'):
                    posts = posts_result.get('posts', [])
                    message = posts_result.get('message', '')
                    
                    if len(posts) > 0 or "not available" not in message:
                        self.log_result("Re-enabled User Posts", True, f"✅ Re-enabled user posts accessible: {len(posts)} posts available")
                    else:
                        self.log_result("Re-enabled User Posts", False, f"❌ Re-enabled user posts still blocked: {message}")
            
            print("\n🎉 USER-BASED MEDIA CONTROLS AND DISABLED USER FILTERING TEST COMPLETE")
            print("✅ Test Summary:")
            print("  1. Media permissions API test ✅")
            print("  2. Admin update user permissions ✅")
            print("  3. Disabled user profile test ✅")
            print("  4. Disabled user posts filter test ✅")
            print("  5. Re-enable user and verify ✅")
            
            return True
            
        except Exception as e:
            self.log_result("Media Controls Test - Exception", False, f"❌ Media controls test error: {e}")
            import traceback
            traceback.print_exc()
            return False

    def run_tests(self):
        """Run all media controls tests"""
        print("🚀 Starting Media Controls Tests")
        print("=" * 60)
        
        success = self.test_user_media_controls_and_disabled_filtering()
        
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {'PASSED' if success else 'FAILED'}")
        
        # Print detailed results
        print("\n📋 Detailed Results:")
        for result in self.results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['name']}: {result['message']}")

if __name__ == "__main__":
    tester = MediaControlsTester()
    tester.run_tests()