"""
CEIBAA Recruitment Portal - Seed Data
Creates sample companies, students with AIR ranks, job posts, quizzes, etc.
"""
import uuid
import bcrypt
from datetime import datetime, timezone, timedelta

def hash_pw(pw):
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

async def seed_recruitment_data(db):
    """Seed the recruitment portal with sample data"""

    # Check if already seeded
    existing = await db.recruiters.count_documents({})
    if existing > 0:
        print("[SEED] Recruitment data already exists, skipping")
        return

    print("[SEED] Seeding recruitment portal data...")

    # --- CEIBAA Admin ---
    admin = {
        "id": "admin-recruitment-001",
        "name": "CEIBAA Recruitment Cell",
        "email": "admin@ceibaa.in",
        "password_hash": hash_pw("admin123"),
        "role": "ceibaa_admin",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.ceibaa_admins.delete_many({})
    await db.ceibaa_admins.insert_one(admin.copy())

    # --- Sample Companies/Recruiters ---
    companies = [
        {
            "id": "rec-tcs-001",
            "company_name": "Tata Consultancy Services",
            "slug": "tcs",
            "email": "hr@tcs.com",
            "mobile": "+91-9876543210",
            "password_hash": hash_pw("tcs123"),
            "industry": "IT Services",
            "gst_number": "27AABCT1234F1Z5",
            "logo_url": "https://ui-avatars.com/api/?name=TCS&background=1a73e8&color=fff&size=200&bold=true",
            "banner_url": "",
            "website": "https://www.tcs.com",
            "about": "Tata Consultancy Services is an Indian multinational IT services and consulting company with operations in 150 locations across 46 countries. TCS is the second-largest Indian company by market capitalization.",
            "employee_count": "600,000+",
            "founding_year": "1968",
            "status": "active",
            "verified_email": True, "verified_mobile": True, "verified_gst": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "rec-infosys-001",
            "company_name": "Infosys",
            "slug": "infosys",
            "email": "hr@infosys.com",
            "mobile": "+91-9876543211",
            "password_hash": hash_pw("infosys123"),
            "industry": "IT Services",
            "gst_number": "29AABCI1234F1Z5",
            "logo_url": "https://ui-avatars.com/api/?name=Infosys&background=007cc3&color=fff&size=200&bold=true",
            "banner_url": "",
            "website": "https://www.infosys.com",
            "about": "Infosys Limited is an Indian multinational IT services and consulting company. It provides business consulting, information technology and outsourcing services.",
            "employee_count": "340,000+",
            "founding_year": "1981",
            "status": "active",
            "verified_email": True, "verified_mobile": True, "verified_gst": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "rec-google-001",
            "company_name": "Google India",
            "slug": "google-india",
            "email": "hr@google.com",
            "mobile": "+91-9876543212",
            "password_hash": hash_pw("google123"),
            "industry": "Technology",
            "gst_number": "07AADCG1234F1Z5",
            "logo_url": "https://ui-avatars.com/api/?name=Google&background=4285f4&color=fff&size=200&bold=true",
            "banner_url": "",
            "website": "https://careers.google.com",
            "about": "Google is a multinational technology company that specializes in internet-related services and products. Our mission is to organize the world's information.",
            "employee_count": "180,000+",
            "founding_year": "1998",
            "status": "active",
            "verified_email": True, "verified_mobile": True, "verified_gst": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "rec-flipkart-001",
            "company_name": "Flipkart",
            "slug": "flipkart",
            "email": "hr@flipkart.com",
            "mobile": "+91-9876543213",
            "password_hash": hash_pw("flipkart123"),
            "industry": "E-Commerce",
            "gst_number": "29AADCF1234F1Z5",
            "logo_url": "https://ui-avatars.com/api/?name=Flipkart&background=f59e0b&color=fff&size=200&bold=true",
            "banner_url": "",
            "website": "https://www.flipkart.com",
            "about": "Flipkart is an Indian e-commerce company. It is one of India's leading e-commerce marketplaces with over 400 million registered users.",
            "employee_count": "50,000+",
            "founding_year": "2007",
            "status": "active",
            "verified_email": True, "verified_mobile": False, "verified_gst": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "rec-razorpay-001",
            "company_name": "Razorpay",
            "slug": "razorpay",
            "email": "hr@razorpay.com",
            "mobile": "+91-9876543214",
            "password_hash": hash_pw("razorpay123"),
            "industry": "Fintech",
            "gst_number": "29AADCR1234F1Z5",
            "logo_url": "https://ui-avatars.com/api/?name=Razorpay&background=2563eb&color=fff&size=200&bold=true",
            "banner_url": "",
            "website": "https://razorpay.com",
            "about": "Razorpay is an Indian fintech company that provides payment solutions to businesses in India. It enables businesses to accept, process and disburse payments.",
            "employee_count": "3,000+",
            "founding_year": "2014",
            "status": "active",
            "verified_email": True, "verified_mobile": True, "verified_gst": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]

    await db.recruiters.delete_many({})
    await db.recruiters.insert_many([c.copy() for c in companies])

    # --- Update existing students with recruitment data ---
    exam_types = ["JEE", "NEET", "UPSC", "SSC", "Banking"]
    colleges = ["IIT Bombay", "IIT Delhi", "NIT Trichy", "BITS Pilani", "AIIMS Delhi", "St. Xavier's College", "Delhi University", "Anna University"]
    states = ["Maharashtra", "Delhi", "Tamil Nadu", "Karnataka", "Rajasthan", "Uttar Pradesh", "West Bengal", "Gujarat"]

    # Create sample students with AIR ranks if they don't exist
    sample_students = [
        {"name": "Arjun Sharma", "email": "arjun@ceibaa.in", "air_rank": 245, "exam_type": "JEE", "college": "IIT Bombay", "state": "Maharashtra"},
        {"name": "Priya Patel", "email": "priya@ceibaa.in", "air_rank": 1200, "exam_type": "NEET", "college": "AIIMS Delhi", "state": "Delhi"},
        {"name": "Rahul Kumar", "email": "rahul@ceibaa.in", "air_rank": 5600, "exam_type": "JEE", "college": "NIT Trichy", "state": "Tamil Nadu"},
        {"name": "Sneha Gupta", "email": "sneha@ceibaa.in", "air_rank": 890, "exam_type": "UPSC", "college": "Delhi University", "state": "Delhi"},
        {"name": "Vikram Singh", "email": "vikram@ceibaa.in", "air_rank": 15000, "exam_type": "SSC", "college": "Anna University", "state": "Tamil Nadu"},
        {"name": "Ananya Desai", "email": "ananya@ceibaa.in", "air_rank": 3200, "exam_type": "JEE", "college": "BITS Pilani", "state": "Rajasthan"},
        {"name": "Karthik Rajan", "email": "karthik@ceibaa.in", "air_rank": 780, "exam_type": "JEE", "college": "IIT Delhi", "state": "Delhi"},
        {"name": "Meera Nair", "email": "meera@ceibaa.in", "air_rank": 4500, "exam_type": "Banking", "college": "St. Xavier's College", "state": "West Bengal"},
    ]

    for s in sample_students:
        existing = await db.users.find_one({"email": s["email"]})
        if not existing:
            user_doc = {
                "id": str(uuid.uuid4()),
                "name": s["name"],
                "email": s["email"],
                "username": s["email"].split("@")[0],
                "password": hash_pw("student123"),
                "air_rank": s["air_rank"],
                "exam_type": s["exam_type"],
                "college": s["college"],
                "state": s["state"],
                "school": "Sample School",
                "skills": ["Python", "Data Analysis", "Machine Learning"],
                "linkedin": "",
                "github": "",
                "resume_url": "",
                "profile_picture": f"https://ui-avatars.com/api/?name={s['name'].replace(' ', '+')}&background=4f7cff&color=fff&size=200",
                "badges": ["CEIBAA Verified"],
                "verified": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(user_doc.copy())

    # --- Sample Posts (Pre-approved) ---
    posts = [
        {
            "id": "post-tcs-job-001",
            "company_id": "rec-tcs-001",
            "company_name": "Tata Consultancy Services",
            "company_logo": companies[0]["logo_url"],
            "post_type": "job",
            "title": "Software Developer - Campus Hiring 2026",
            "description": "Join TCS as a Software Developer. Work on cutting-edge projects with global clients. Ideal for fresh graduates with strong programming fundamentals.",
            "role_type": "Full-time",
            "location": "Mumbai, Bangalore, Hyderabad",
            "salary": "7-9 LPA",
            "air_filter": 20000,
            "min_qualification": "B.Tech/B.E.",
            "deadline": (datetime.now(timezone.utc) + timedelta(days=30)).strftime("%Y-%m-%d"),
            "screening_questions": ["Why do you want to join TCS?", "Describe a project you're proud of."],
            "status": "approved",
            "likes_count": 45, "comments_count": 12,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
            "approved_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        },
        {
            "id": "post-google-job-001",
            "company_id": "rec-google-001",
            "company_name": "Google India",
            "company_logo": companies[2]["logo_url"],
            "post_type": "job",
            "title": "SDE Intern - Summer 2026",
            "description": "Google India is hiring SDE Interns for Summer 2026. Work on real Google products used by billions. Strong DSA and problem-solving skills required.",
            "role_type": "Internship",
            "location": "Bangalore (Remote optional)",
            "salary": "80,000/month",
            "air_filter": 5000,
            "min_qualification": "B.Tech/B.E. (3rd/4th year)",
            "deadline": (datetime.now(timezone.utc) + timedelta(days=20)).strftime("%Y-%m-%d"),
            "screening_questions": ["Rate your DSA skills 1-10", "Your favorite Google product and why?"],
            "status": "approved",
            "likes_count": 120, "comments_count": 35,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
            "approved_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "post-infosys-quiz-001",
            "company_id": "rec-infosys-001",
            "company_name": "Infosys",
            "company_logo": companies[1]["logo_url"],
            "post_type": "quiz",
            "title": "Infosys Coding Challenge 2026",
            "description": "Test your aptitude and coding skills. Top 50 scorers get direct shortlist for Infosys Power Programmer role!",
            "num_questions": 5,
            "time_limit": 15,
            "reward": "Direct shortlist for top 50 scorers",
            "air_filter": None,
            "top_n_shortlist": 50,
            "questions": [
                {"question": "What is the time complexity of binary search?", "options": ["O(n)", "O(log n)", "O(n log n)", "O(1)"], "correct_answer": 1, "explanation": "Binary search halves the search space each time."},
                {"question": "Which data structure uses FIFO?", "options": ["Stack", "Queue", "Tree", "Graph"], "correct_answer": 1, "explanation": "Queue follows First In First Out principle."},
                {"question": "What does SQL stand for?", "options": ["Structured Query Language", "Simple Query Language", "Standard Query Language", "Sequential Query Language"], "correct_answer": 0, "explanation": "SQL stands for Structured Query Language."},
                {"question": "Which sorting algorithm has the best average case?", "options": ["Bubble Sort", "Selection Sort", "Merge Sort", "Insertion Sort"], "correct_answer": 2, "explanation": "Merge Sort has O(n log n) average case."},
                {"question": "What is the output of 2**3 in Python?", "options": ["6", "8", "9", "5"], "correct_answer": 1, "explanation": "2**3 = 2^3 = 8 in Python."}
            ],
            "status": "approved",
            "likes_count": 89, "comments_count": 22,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat(),
            "approved_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
        },
        {
            "id": "post-flipkart-hack-001",
            "company_id": "rec-flipkart-001",
            "company_name": "Flipkart",
            "company_logo": companies[3]["logo_url"],
            "post_type": "hackathon",
            "title": "Flipkart GRiD 6.0 - E-Commerce Innovation",
            "description": "Build innovative solutions for e-commerce challenges. Prizes worth 10 Lakhs! Open to all engineering students.",
            "theme": "E-Commerce Innovation & Sustainability",
            "prizes": {"first": "5,00,000", "second": "3,00,000", "third": "2,00,000"},
            "start_date": (datetime.now(timezone.utc) + timedelta(days=5)).strftime("%Y-%m-%d"),
            "end_date": (datetime.now(timezone.utc) + timedelta(days=20)).strftime("%Y-%m-%d"),
            "team_size": 4,
            "submission_format": "GitHub repository link",
            "air_filter": None,
            "status": "approved",
            "likes_count": 67, "comments_count": 18,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=4)).isoformat(),
            "approved_at": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat()
        },
        {
            "id": "post-razorpay-event-001",
            "company_id": "rec-razorpay-001",
            "company_name": "Razorpay",
            "company_logo": companies[4]["logo_url"],
            "post_type": "event",
            "title": "Fintech Career Webinar by Razorpay",
            "description": "Join our VP Engineering for a live webinar on careers in fintech. Learn about growth opportunities, tech stack, and culture at Razorpay.",
            "event_type": "Webinar",
            "event_date": (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%dT18:00:00"),
            "platform": "Google Meet",
            "registration_limit": 500,
            "air_filter": None,
            "status": "approved",
            "likes_count": 34, "comments_count": 8,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
            "approved_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "post-tcs-intern-001",
            "company_id": "rec-tcs-001",
            "company_name": "Tata Consultancy Services",
            "company_logo": companies[0]["logo_url"],
            "post_type": "job",
            "title": "Data Science Intern - Summer 2026",
            "description": "Work with TCS's data science team on real-world projects involving ML and AI. Learn from industry experts.",
            "role_type": "Internship",
            "location": "Pune, Remote",
            "salary": "40,000/month",
            "air_filter": 10000,
            "min_qualification": "B.Tech/M.Tech in CS/IT/Data Science",
            "deadline": (datetime.now(timezone.utc) + timedelta(days=25)).strftime("%Y-%m-%d"),
            "status": "approved",
            "likes_count": 28, "comments_count": 6,
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=12)).isoformat(),
            "approved_at": datetime.now(timezone.utc).isoformat()
        },
    ]

    await db.recruitment_posts.delete_many({})
    await db.recruitment_posts.insert_many([p.copy() for p in posts])

    # Seed some follows
    students = await db.users.find({"air_rank": {"$exists": True}}, {"_id": 0, "id": 1}).to_list(10)
    follows = []
    for i, s in enumerate(students):
        for c in companies[:3]:
            follows.append({
                "id": str(uuid.uuid4()),
                "user_id": s["id"],
                "company_id": c["id"],
                "created_at": datetime.now(timezone.utc).isoformat()
            })
    if follows:
        await db.recruitment_follows.delete_many({})
        await db.recruitment_follows.insert_many([f.copy() for f in follows])

    # Some sample applications
    if students:
        apps = [
            {
                "id": str(uuid.uuid4()),
                "post_id": "post-tcs-job-001",
                "company_id": "rec-tcs-001",
                "user_id": students[0]["id"],
                "user_name": "Arjun Sharma",
                "user_email": "arjun@ceibaa.in",
                "user_air": 245,
                "user_exam_type": "JEE",
                "user_college": "IIT Bombay",
                "status": "shortlisted",
                "created_at": (datetime.now(timezone.utc) - timedelta(hours=6)).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "post_id": "post-google-job-001",
                "company_id": "rec-google-001",
                "user_id": students[0]["id"],
                "user_name": "Arjun Sharma",
                "user_email": "arjun@ceibaa.in",
                "user_air": 245,
                "user_exam_type": "JEE",
                "user_college": "IIT Bombay",
                "status": "applied",
                "created_at": (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat()
            }
        ]
        await db.recruitment_applications.delete_many({})
        await db.recruitment_applications.insert_many([a.copy() for a in apps])

    print("[SEED] Recruitment data seeded successfully!")
    print("[SEED] Admin: admin@ceibaa.in / admin123")
    print("[SEED] TCS Recruiter: hr@tcs.com / tcs123")
    print("[SEED] Student: arjun@ceibaa.in / student123")
