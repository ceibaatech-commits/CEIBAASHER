"""
SEO Routes - Sitemap and SEO utilities
Generates dynamic sitemaps for search engine optimization
"""
from fastapi import APIRouter, Response
from fastapi.responses import PlainTextResponse
from datetime import datetime, timezone
import os

router = APIRouter()

# Database connection will be injected
db = None

def init_db(database):
    """Initialize database connection"""
    global db
    db = database

# Base URL for the site
SITE_URL = os.getenv("SITE_URL", "https://ceibaa.com")

@router.get("/sitemap.xml", response_class=PlainTextResponse)
async def get_dynamic_sitemap():
    """
    Generate dynamic sitemap including user profiles and posts
    """
    try:
        # Static pages
        static_pages = [
            {"loc": "/", "changefreq": "daily", "priority": "1.0"},
            {"loc": "/victory-lane", "changefreq": "hourly", "priority": "0.9"},
            {"loc": "/earn", "changefreq": "weekly", "priority": "0.9"},
            {"loc": "/chapter-tests", "changefreq": "weekly", "priority": "0.8"},
            {"loc": "/courses", "changefreq": "weekly", "priority": "0.8"},
            {"loc": "/join-room", "changefreq": "daily", "priority": "0.8"},
            {"loc": "/board", "changefreq": "daily", "priority": "0.7"},
            {"loc": "/leaderboard", "changefreq": "hourly", "priority": "0.7"},
            {"loc": "/login", "changefreq": "monthly", "priority": "0.6"},
            {"loc": "/signup", "changefreq": "monthly", "priority": "0.6"},
            {"loc": "/about", "changefreq": "monthly", "priority": "0.5"},
            {"loc": "/contact", "changefreq": "monthly", "priority": "0.5"},
            {"loc": "/faq", "changefreq": "monthly", "priority": "0.5"},
            {"loc": "/terms", "changefreq": "yearly", "priority": "0.3"},
            {"loc": "/privacy", "changefreq": "yearly", "priority": "0.3"},
        ]
        
        # Exam pages
        exam_pages = [
            "jee-main", "jee-advanced", "cuet", "gate", "cat",
            "neet-ug", "neet-pg", "aiims",
            "nda", "cds", "afcat",
            "ibps-po", "ibps-clerk", "sbi-po", "sbi-clerk", "rrb-ntpc",
            "ssc-cgl", "ssc-chsl", "ssc-mts", "ssc-gd",
            "upsc-cse", "upsc-capf",
            "ctet", "reet", "uptet",
            "rsmssb-patwari", "rajasthan-police", "up-police", "bihar-police"
        ]
        
        # Chapter test pages
        chapter_pages = [
            "class-6", "class-7", "class-8", "class-9", "class-10",
            "class-11/select-stream", "class-12/select-stream"
        ]
        
        # Build XML
        xml_parts = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ]
        
        # Add static pages
        for page in static_pages:
            xml_parts.append(f'''  <url>
    <loc>{SITE_URL}{page["loc"]}</loc>
    <changefreq>{page["changefreq"]}</changefreq>
    <priority>{page["priority"]}</priority>
  </url>''')
        
        # Add exam pages
        for exam in exam_pages:
            xml_parts.append(f'''  <url>
    <loc>{SITE_URL}/exam/{exam}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>''')
        
        # Add chapter test pages
        for chapter in chapter_pages:
            xml_parts.append(f'''  <url>
    <loc>{SITE_URL}/chapter-tests/{chapter}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>''')
        
        # Add dynamic user profiles (public, non-disabled users)
        if db:
            try:
                users = await db.users.find(
                    {"is_disabled": {"$ne": True}, "is_private": {"$ne": True}},
                    {"_id": 0, "username": 1}
                ).limit(1000).to_list(1000)
                
                for user in users:
                    if user.get("username"):
                        xml_parts.append(f'''  <url>
    <loc>{SITE_URL}/profile/{user["username"]}</loc>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>''')
            except Exception as e:
                print(f"Error fetching users for sitemap: {e}")
        
        # Add recent posts (last 100)
        if db:
            try:
                posts = await db.social_posts.find(
                    {},
                    {"_id": 0, "id": 1}
                ).sort("created_at", -1).limit(100).to_list(100)
                
                for post in posts:
                    if post.get("id"):
                        xml_parts.append(f'''  <url>
    <loc>{SITE_URL}/post/{post["id"]}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>''')
            except Exception as e:
                print(f"Error fetching posts for sitemap: {e}")
        
        xml_parts.append('</urlset>')
        
        xml_content = '\n'.join(xml_parts)
        
        return Response(
            content=xml_content,
            media_type="application/xml",
            headers={"Content-Type": "application/xml; charset=utf-8"}
        )
        
    except Exception as e:
        print(f"Error generating sitemap: {e}")
        # Return basic sitemap on error
        return Response(
            content=f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>{SITE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>''',
            media_type="application/xml"
        )

@router.get("/robots.txt", response_class=PlainTextResponse)
async def get_robots_txt():
    """
    Serve robots.txt for search engines
    """
    robots_content = f"""# Robots.txt for Ceibaa
# {SITE_URL}

User-agent: *
Allow: /

# Allow search engines to crawl main pages
Allow: /victory-lane
Allow: /earn
Allow: /chapter-tests
Allow: /courses
Allow: /exam/
Allow: /about
Allow: /contact
Allow: /faq
Allow: /leaderboard
Allow: /board
Allow: /profile/

# Disallow admin and private pages
Disallow: /admin
Disallow: /admin/
Disallow: /dashboard
Disallow: /settings/
Disallow: /notifications

# Disallow authentication pages from indexing
Disallow: /auth-callback
Disallow: /auth/callback

# Crawl delay to be respectful
Crawl-delay: 1

# Sitemap location
Sitemap: {SITE_URL}/api/sitemap.xml
Sitemap: {SITE_URL}/sitemap.xml
"""
    return PlainTextResponse(content=robots_content)

@router.get("/seo/stats")
async def get_seo_stats():
    """
    Get SEO-relevant statistics for the site
    """
    try:
        stats = {
            "total_exams": 38,
            "total_posts": 0,
            "total_users": 0,
            "total_quiz_rooms": 0
        }
        
        if db:
            stats["total_posts"] = await db.social_posts.count_documents({})
            stats["total_users"] = await db.users.count_documents({"is_disabled": {"$ne": True}})
            stats["total_quiz_rooms"] = await db.quiz_rooms.count_documents({})
        
        return {
            "success": True,
            "stats": stats,
            "sitemap_url": f"{SITE_URL}/api/sitemap.xml",
            "robots_url": f"{SITE_URL}/api/robots.txt"
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}
