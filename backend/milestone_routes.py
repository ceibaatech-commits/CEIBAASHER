"""
Milestone & Monetization System Routes
Handles creator milestones, badge unlocks, and ad revenue system

MILESTONES:
- 500 Posts → Unlock Badge (Teacher/Professor/Institute)
- 1,000 Followers → Unlock video and image posting
- 2,500 Followers → Full monetization enabled

MONETIZATION:
- 90% revenue to creator, 10% to platform
- Local vendor ads targeted by city/district
- Impressions-based revenue
"""
import re
from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime, timezone
import uuid
import os
from jose import jwt, JWTError

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

router = APIRouter()
db = None

def init_db(database):
    global db
    db = database

# ==================== MODELS ====================

class BadgeSelectionRequest(BaseModel):
    badge_type: Literal["Teacher", "Professor", "Institute"]

class AdCampaignCreate(BaseModel):
    vendor_name: str
    vendor_business: str
    city: str
    district: str
    ad_content: str
    ad_image_url: Optional[str] = None
    ad_video_url: Optional[str] = None
    budget: float  # Total budget in INR
    cpm_rate: float  # Cost per 1000 impressions
    start_date: str
    end_date: str

class ImpressionRecord(BaseModel):
    ad_id: str
    viewer_city: Optional[str] = None

# ==================== HELPER FUNCTIONS ====================

async def get_user_from_session(session_token: str) -> Optional[str]:
    """Get user_id from session token"""
    try:
        session_doc = await db.user_sessions.find_one(
            {"session_token": session_token},
            {"_id": 0}
        )
        if not session_doc:
            return None
        expires_at = session_doc["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            return None
        return session_doc["user_id"]
    except Exception:
        return None

async def get_user_id_from_request(authorization: Optional[str], request: Request = None) -> str:
    """Get user_id from session or JWT token"""
    if request and hasattr(request, 'cookies'):
        session_token = request.cookies.get("session_token")
        if session_token:
            user_id = await get_user_from_session(session_token)
            if user_id:
                return user_id
    
    if authorization:
        if authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
            user_id = await get_user_from_session(token)
            if user_id:
                return user_id
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                user_id = payload.get("sub")
                if user_id:
                    return user_id
            except JWTError:
                pass
    
    raise HTTPException(status_code=401, detail="Not authenticated")

# ==================== MILESTONE ENDPOINTS ====================

@router.get("/milestones/progress")
async def get_milestone_progress(
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """
    Get user's milestone progress with real data
    Returns posts count, followers count, and unlocked features
    """
    try:
        user_id = await get_user_id_from_request(authorization, request)
        
        # Get user data
        user = await db.users.find_one(
            {"$or": [{"id": user_id}, {"user_id": user_id}]},
            {"_id": 0}
        )
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get real posts count
        posts_count = await db.social_posts.count_documents({
            "user_id": user_id,
            "is_retweet": {"$ne": True}
        })
        
        # Get real followers count from follows collection
        followers_count = await db.follows.count_documents({
            "following_id": user_id,
            "status": "approved"
        })
        
        # Also check ceeps for backward compatibility
        ceeps_followers = await db.ceeps.count_documents({"ceep_user_id": user_id})
        followers_count = max(followers_count, ceeps_followers)
        
        # Calculate milestone progress
        badge_milestone = {
            "name": "Creator Badge",
            "description": "Unlock Teacher, Professor, or Institute badge",
            "requirement": 500,
            "current": posts_count,
            "type": "posts",
            "unlocked": posts_count >= 500,
            "reward": "Badge Selection"
        }
        
        media_milestone = {
            "name": "Media Creator",
            "description": "Unlock video and image posting abilities",
            "requirement": 1000,
            "current": followers_count,
            "type": "followers",
            "unlocked": followers_count >= 1000,
            "reward": "Media Posting"
        }
        
        monetization_milestone = {
            "name": "Monetization Partner",
            "description": "Enable full monetization and ad revenue",
            "requirement": 2500,
            "current": followers_count,
            "type": "followers",
            "unlocked": followers_count >= 2500,
            "reward": "90% Ad Revenue"
        }
        
        # Get user's selected badge if any
        selected_badge = user.get("creator_badge")
        badge_type = user.get("badge_type")  # Teacher, Professor, Institute
        
        # Get monetization stats if enabled
        monetization_stats = None
        if followers_count >= 2500:
            # Get user's earnings data
            earnings_data = await db.creator_earnings.find_one(
                {"user_id": user_id},
                {"_id": 0}
            )
            
            if earnings_data:
                monetization_stats = {
                    "total_earnings": earnings_data.get("total_earnings", 0),
                    "pending_payout": earnings_data.get("pending_payout", 0),
                    "total_impressions": earnings_data.get("total_impressions", 0),
                    "this_month_earnings": earnings_data.get("this_month_earnings", 0),
                    "this_month_impressions": earnings_data.get("this_month_impressions", 0)
                }
            else:
                monetization_stats = {
                    "total_earnings": 0,
                    "pending_payout": 0,
                    "total_impressions": 0,
                    "this_month_earnings": 0,
                    "this_month_impressions": 0
                }
        
        return {
            "success": True,
            "user": {
                "id": user_id,
                "name": user.get("name"),
                "username": user.get("username"),
                "profile_picture": user.get("profile_picture"),
                "selected_badge": selected_badge,
                "badge_type": badge_type,
                "city": user.get("location", "Delhi")
            },
            "stats": {
                "posts_count": posts_count,
                "followers_count": followers_count
            },
            "milestones": [
                badge_milestone,
                media_milestone,
                monetization_milestone
            ],
            "features": {
                "badge_unlocked": posts_count >= 500,
                "badge_selected": badge_type is not None,
                "media_posting_unlocked": followers_count >= 1000,
                "monetization_unlocked": followers_count >= 2500
            },
            "monetization": monetization_stats
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching milestones: {str(e)}")

@router.post("/milestones/select-badge")
async def select_creator_badge(
    badge_data: BadgeSelectionRequest,
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """
    Select a badge type after reaching 500 posts milestone
    Options: Teacher, Professor, Institute
    """
    try:
        user_id = await get_user_id_from_request(authorization, request)
        
        # Verify user has reached 500 posts
        posts_count = await db.social_posts.count_documents({
            "user_id": user_id,
            "is_retweet": {"$ne": True}
        })
        
        if posts_count < 500:
            raise HTTPException(
                status_code=400,
                detail=f"You need 500 posts to unlock badges. Current: {posts_count}"
            )
        
        # Map badge type to field
        badge_field_map = {
            "Teacher": "isTeacher",
            "Professor": "isProfessor",
            "Institute": "isInstitute"
        }
        
        # Reset all badge fields and set the selected one
        update_data = {
            "isTeacher": False,
            "isProfessor": False,
            "isInstitute": False,
            "creator_badge": True,
            "badge_type": badge_data.badge_type,
            "badge_unlocked_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Set the selected badge
        badge_field = badge_field_map.get(badge_data.badge_type)
        if badge_field:
            update_data[badge_field] = True
        
        await db.users.update_one(
            {"$or": [{"id": user_id}, {"user_id": user_id}]},
            {"$set": update_data}
        )
        
        return {
            "success": True,
            "message": f"Congratulations! You are now a {badge_data.badge_type}!",
            "badge_type": badge_data.badge_type
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error selecting badge: {str(e)}")

@router.post("/milestones/simulate")
async def simulate_milestone_progress(
    request: Request,
    authorization: Optional[str] = Header(None),
    action: str = "add_post"  # add_post, add_followers, reset
):
    """
    Simulation mode for testing milestone progress
    Actions: add_post (adds 100), add_followers (adds 250), reset
    """
    try:
        user_id = await get_user_id_from_request(authorization, request)
        
        # Get or create simulation data
        sim_data = await db.milestone_simulations.find_one(
            {"user_id": user_id},
            {"_id": 0}
        )
        
        if not sim_data:
            sim_data = {
                "user_id": user_id,
                "simulated_posts": 0,
                "simulated_followers": 0,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        
        if action == "add_post":
            sim_data["simulated_posts"] = sim_data.get("simulated_posts", 0) + 100
        elif action == "add_followers":
            sim_data["simulated_followers"] = sim_data.get("simulated_followers", 0) + 250
        elif action == "reset":
            sim_data["simulated_posts"] = 0
            sim_data["simulated_followers"] = 0
        
        sim_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.milestone_simulations.update_one(
            {"user_id": user_id},
            {"$set": sim_data},
            upsert=True
        )
        
        return {
            "success": True,
            "simulation": {
                "posts": sim_data["simulated_posts"],
                "followers": sim_data["simulated_followers"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error simulating: {str(e)}")

@router.get("/milestones/simulation")
async def get_simulation_data(
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """
    Get current simulation data for testing
    """
    try:
        user_id = await get_user_id_from_request(authorization, request)
        
        sim_data = await db.milestone_simulations.find_one(
            {"user_id": user_id},
            {"_id": 0}
        )
        
        if not sim_data:
            sim_data = {
                "simulated_posts": 0,
                "simulated_followers": 0
            }
        
        return {
            "success": True,
            "simulation": sim_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching simulation: {str(e)}")

# ==================== MONETIZATION ENDPOINTS ====================

@router.get("/monetization/dashboard")
async def get_monetization_dashboard(
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """
    Get creator's monetization dashboard with earnings and available ads
    """
    try:
        user_id = await get_user_id_from_request(authorization, request)
        
        # Check if user has monetization unlocked
        followers_count = await db.follows.count_documents({
            "following_id": user_id,
            "status": "approved"
        })
        
        if followers_count < 2500:
            return {
                "success": True,
                "monetization_enabled": False,
                "message": f"Reach 2,500 followers to unlock monetization. Current: {followers_count}",
                "progress": (followers_count / 2500) * 100
            }
        
        # Get user's city for targeted ads
        user = await db.users.find_one(
            {"$or": [{"id": user_id}, {"user_id": user_id}]},
            {"_id": 0, "location": 1}
        )
        user_city = user.get("location", "Delhi") if user else "Delhi"
        
        # Get earnings data
        earnings = await db.creator_earnings.find_one(
            {"user_id": user_id},
            {"_id": 0}
        )
        
        if not earnings:
            earnings = {
                "total_earnings": 0,
                "pending_payout": 0,
                "total_impressions": 0,
                "this_month_earnings": 0,
                "this_month_impressions": 0,
                "lifetime_payouts": 0
            }
        
        # Get available ads for user's city
        available_ads = await db.ad_campaigns.find(
            {
                "city": {"$regex": re.escape(user_city), "$options": "i"},
                "status": "active",
                "end_date": {"$gte": datetime.now(timezone.utc).isoformat()}
            },
            {"_id": 0}
        ).to_list(20)
        
        # Get recent impressions history
        recent_impressions = await db.ad_impressions.find(
            {"creator_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(50).to_list(50)
        
        return {
            "success": True,
            "monetization_enabled": True,
            "user_city": user_city,
            "earnings": {
                "total_earnings": earnings.get("total_earnings", 0),
                "pending_payout": earnings.get("pending_payout", 0),
                "lifetime_payouts": earnings.get("lifetime_payouts", 0),
                "this_month": {
                    "earnings": earnings.get("this_month_earnings", 0),
                    "impressions": earnings.get("this_month_impressions", 0)
                },
                "total_impressions": earnings.get("total_impressions", 0)
            },
            "revenue_split": {
                "creator_share": 90,
                "platform_share": 10
            },
            "available_ads": len(available_ads),
            "recent_activity": recent_impressions[:10]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard: {str(e)}")

@router.post("/monetization/record-impression")
async def record_ad_impression(
    impression_data: ImpressionRecord,
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """
    Record an ad impression and calculate creator earnings
    Called when a user views an ad through a creator's content
    """
    try:
        user_id = await get_user_id_from_request(authorization, request)
        
        # Get the ad campaign
        ad = await db.ad_campaigns.find_one(
            {"id": impression_data.ad_id},
            {"_id": 0}
        )
        
        if not ad:
            raise HTTPException(status_code=404, detail="Ad campaign not found")
        
        # Calculate earnings (CPM = cost per 1000 impressions)
        cpm_rate = ad.get("cpm_rate", 50)  # Default ₹50 per 1000 impressions
        impression_value = cpm_rate / 1000
        creator_earning = impression_value * 0.90  # 90% to creator
        platform_earning = impression_value * 0.10  # 10% to platform
        
        # Record the impression
        impression_doc = {
            "id": str(uuid.uuid4()),
            "ad_id": impression_data.ad_id,
            "creator_id": user_id,
            "viewer_city": impression_data.viewer_city,
            "impression_value": impression_value,
            "creator_earning": creator_earning,
            "platform_earning": platform_earning,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.ad_impressions.insert_one(impression_doc)
        
        # Update creator's earnings
        await db.creator_earnings.update_one(
            {"user_id": user_id},
            {
                "$inc": {
                    "total_earnings": creator_earning,
                    "pending_payout": creator_earning,
                    "total_impressions": 1,
                    "this_month_earnings": creator_earning,
                    "this_month_impressions": 1
                },
                "$set": {
                    "last_impression_at": datetime.now(timezone.utc).isoformat()
                }
            },
            upsert=True
        )
        
        return {
            "success": True,
            "impression_id": impression_doc["id"],
            "creator_earning": creator_earning
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error recording impression: {str(e)}")

@router.post("/monetization/simulate-earnings")
async def simulate_earnings(
    request: Request,
    authorization: Optional[str] = Header(None),
    impressions: int = 1000,
    cpm_rate: float = 50
):
    """
    Simulate earnings for demo purposes
    """
    try:
        user_id = await get_user_id_from_request(authorization, request)
        
        total_value = (impressions / 1000) * cpm_rate
        creator_earning = total_value * 0.90
        platform_earning = total_value * 0.10
        
        # Update simulation earnings (separate from real earnings)
        await db.creator_earnings_simulation.update_one(
            {"user_id": user_id},
            {
                "$inc": {
                    "simulated_earnings": creator_earning,
                    "simulated_impressions": impressions
                },
                "$set": {
                    "last_simulation_at": datetime.now(timezone.utc).isoformat()
                }
            },
            upsert=True
        )
        
        # Get updated simulation data
        sim_data = await db.creator_earnings_simulation.find_one(
            {"user_id": user_id},
            {"_id": 0}
        )
        
        return {
            "success": True,
            "simulation": {
                "impressions_added": impressions,
                "cpm_rate": cpm_rate,
                "total_value": total_value,
                "creator_earning": creator_earning,
                "platform_earning": platform_earning,
                "revenue_split": "90/10"
            },
            "totals": {
                "total_simulated_earnings": sim_data.get("simulated_earnings", 0),
                "total_simulated_impressions": sim_data.get("simulated_impressions", 0)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error simulating earnings: {str(e)}")

@router.get("/monetization/simulation")
async def get_earnings_simulation(
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """
    Get simulated earnings data
    """
    try:
        user_id = await get_user_id_from_request(authorization, request)
        
        sim_data = await db.creator_earnings_simulation.find_one(
            {"user_id": user_id},
            {"_id": 0}
        )
        
        if not sim_data:
            sim_data = {
                "simulated_earnings": 0,
                "simulated_impressions": 0
            }
        
        return {
            "success": True,
            "simulation": sim_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching simulation: {str(e)}")

@router.post("/monetization/reset-simulation")
async def reset_earnings_simulation(
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """
    Reset simulated earnings data
    """
    try:
        user_id = await get_user_id_from_request(authorization, request)
        
        await db.creator_earnings_simulation.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "simulated_earnings": 0,
                    "simulated_impressions": 0,
                    "reset_at": datetime.now(timezone.utc).isoformat()
                }
            },
            upsert=True
        )
        
        return {
            "success": True,
            "message": "Simulation data reset successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resetting simulation: {str(e)}")

# ==================== ADMIN AD MANAGEMENT ====================

@router.post("/admin/ads/create")
async def create_ad_campaign(ad_data: AdCampaignCreate):
    """
    Admin endpoint to create a new ad campaign from local vendor
    """
    try:
        ad_doc = {
            "id": str(uuid.uuid4()),
            "vendor_name": ad_data.vendor_name,
            "vendor_business": ad_data.vendor_business,
            "city": ad_data.city,
            "district": ad_data.district,
            "ad_content": ad_data.ad_content,
            "ad_image_url": ad_data.ad_image_url,
            "ad_video_url": ad_data.ad_video_url,
            "budget": ad_data.budget,
            "spent": 0,
            "cpm_rate": ad_data.cpm_rate,
            "impressions": 0,
            "start_date": ad_data.start_date,
            "end_date": ad_data.end_date,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.ad_campaigns.insert_one(ad_doc)
        
        return {
            "success": True,
            "message": "Ad campaign created successfully",
            "ad_id": ad_doc["id"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating ad: {str(e)}")

@router.get("/admin/ads")
async def get_all_ad_campaigns():
    """
    Get all ad campaigns for admin
    """
    try:
        ads = await db.ad_campaigns.find({}, {"_id": 0}).to_list(100)
        
        return {
            "success": True,
            "ads": ads,
            "count": len(ads)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching ads: {str(e)}")

@router.get("/ads/available")
async def get_available_ads(
    city: str = "Delhi",
    limit: int = 5
):
    """
    Get available ads for a specific city (public endpoint)
    """
    try:
        ads = await db.ad_campaigns.find(
            {
                "city": {"$regex": re.escape(city), "$options": "i"},
                "status": "active"
            },
            {"_id": 0, "budget": 0, "spent": 0}  # Hide sensitive data
        ).limit(limit).to_list(limit)
        
        return {
            "success": True,
            "ads": ads,
            "city": city
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching ads: {str(e)}")
