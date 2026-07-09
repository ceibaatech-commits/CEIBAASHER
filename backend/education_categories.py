"""
Education Categories Reference Data
Structured data for Undergraduate, Postgraduate, and Diploma categories
"""

EDUCATION_CATEGORIES = {
    "undergraduate": [
        {
            "id": "ug_engineering",
            "name": "Engineering",
            "description": "B.Tech, B.E., and other engineering programs",
            "icon_category": "engineering",
            "popular_programs": ["B.Tech - Computer Science", "B.Tech - Mechanical", "B.Tech - Electrical"],
            "entrance_exams": ["JEE Main", "JEE Advanced", "BITSAT", "VITEEE"]
        },
        {
            "id": "ug_science_medical",
            "name": "Science & Medical",
            "description": "B.Sc., MBBS, BDS, and other science programs",
            "icon_category": "science",
            "popular_programs": ["MBBS", "B.Sc - Physics", "B.Sc - Chemistry", "BDS"],
            "entrance_exams": ["NEET", "AIIMS", "All India NEET"]
        },
        {
            "id": "ug_commerce",
            "name": "Commerce",
            "description": "B.Com, BCA, and commerce-related programs",
            "icon_category": "commerce",
            "popular_programs": ["B.Com", "BCA", "B.Com - Honors"],
            "entrance_exams": ["CCC", "BHU B.Com"]
        },
        {
            "id": "ug_liberal_arts",
            "name": "Liberal Arts & Science",
            "description": "B.A., B.Sc. in humanities and social sciences",
            "icon_category": "liberal_arts",
            "popular_programs": ["B.A - English", "B.A - History", "B.Sc - Psychology"],
            "entrance_exams": ["CLAT", "BHU BAT"]
        },
        {
            "id": "ug_law",
            "name": "Law",
            "description": "B.L.L., LL.B., and legal studies",
            "icon_category": "law",
            "popular_programs": ["B.A LL.B", "LL.B", "Constitutional Law"],
            "entrance_exams": ["CLAT", "AILET", "LSAC India"]
        },
        {
            "id": "ug_hotel_management",
            "name": "Hotel & Tourism Management",
            "description": "B.Sc. in Hotel Management and related programs",
            "icon_category": "hospitality",
            "popular_programs": ["B.Sc - Hotel Management", "B.Sc - Tourism"],
            "entrance_exams": ["NCHM JEE", "IIHM Entrance"]
        },
        {
            "id": "ug_fashion_design",
            "name": "Fashion & Design",
            "description": "Design and fashion-related undergraduate programs",
            "icon_category": "design",
            "popular_programs": ["B.Des - Fashion", "B.Des - Interior", "B.Sc - Fashion Technology"],
            "entrance_exams": ["NIFT", "UCEED", "CEED"]
        },
        {
            "id": "ug_nursing",
            "name": "Nursing",
            "description": "B.Sc Nursing and nursing programs",
            "icon_category": "nursing",
            "popular_programs": ["B.Sc Nursing", "Nursing Diploma"],
            "entrance_exams": ["NEET", "State Nursing Entrance"]
        },
        {
            "id": "ug_agriculture",
            "name": "Agriculture",
            "description": "B.Sc Agriculture and agricultural sciences",
            "icon_category": "agriculture",
            "popular_programs": ["B.Sc Agriculture", "B.Tech - Agricultural Engineering"],
            "entrance_exams": ["JEE Main (Agriculture)", "State Level Exams"]
        },
        {
            "id": "ug_journalism",
            "name": "Mass Communication & Journalism",
            "description": "B.A/B.Sc in Mass Communication and Journalism",
            "icon_category": "media",
            "popular_programs": ["B.A - Journalism", "B.A - Mass Communication"],
            "entrance_exams": ["DUET", "University Merit Based"]
        }
    ],
    "postgraduate": [
        {
            "id": "pg_mba",
            "name": "MBA",
            "description": "Master of Business Administration programs",
            "icon_category": "business",
            "popular_programs": ["MBA - General", "MBA - Finance", "MBA - Marketing", "MBA - HR"],
            "entrance_exams": ["CAT", "XAT", "MAT", "GMAT"]
        },
        {
            "id": "pg_engineering",
            "name": "M.Tech & Engineering",
            "description": "M.Tech, M.E., and postgraduate engineering programs",
            "icon_category": "engineering",
            "popular_programs": ["M.Tech - Computer Science", "M.Tech - Data Science", "M.E - Power Systems"],
            "entrance_exams": ["GATE", "ESE"]
        },
        {
            "id": "pg_law",
            "name": "LL.M & Law",
            "description": "LL.M., M.Phil in Law, and legal postgraduate programs",
            "icon_category": "law",
            "popular_programs": ["LL.M", "LL.M - Corporate Law", "LL.M - Intellectual Property"],
            "entrance_exams": ["CLAT LL.M", "University Merit"]
        },
        {
            "id": "pg_science",
            "name": "M.Sc & Research",
            "description": "M.Sc., M.Phil, and research-oriented science programs",
            "icon_category": "science",
            "popular_programs": ["M.Sc - Physics", "M.Sc - Chemistry", "M.Sc - Computer Science"],
            "entrance_exams": ["CSIR-NET", "GATE", "University Entrance"]
        }
    ],
    "diploma": [
        {
            "id": "diploma_polytechnic",
            "name": "Polytechnic Diploma",
            "description": "3-year diploma in various engineering and technical fields",
            "icon_category": "polytechnic",
            "popular_programs": ["Diploma - Civil", "Diploma - Electrical", "Diploma - Mechanical"],
            "entrance_exams": ["State Polytechnic Entrance", "Merit Based Selection"]
        }
    ]
}

def get_categories_by_level(education_level: str) -> list:
    """Get categories for a specific education level"""
    return EDUCATION_CATEGORIES.get(education_level, [])

def get_all_categories() -> dict:
    """Get all education categories"""
    return EDUCATION_CATEGORIES

def get_category_by_id(level: str, category_id: str) -> dict:
    """Get a specific category by level and ID"""
    categories = EDUCATION_CATEGORIES.get(level, [])
    for cat in categories:
        if cat["id"] == category_id:
            return cat
    return None

def seed_education_categories(db_collection) -> None:
    """Seed education categories to database (future use)"""
    pass
