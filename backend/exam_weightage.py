# Topic-wise Weightage Analysis for All Exams

EXAM_WEIGHTAGE = {
    "SSC": {
        "total_questions": 100,
        "subjects": {
            "English Language": {
                "questions": 25,
                "color": "from-purple-500 to-pink-500",
                "topics": [
                    {"name": "Reading Comprehension", "expected": "5-7", "importance": "Very High"},
                    {"name": "Grammar & Vocabulary", "expected": "8-10", "importance": "Very High"},
                    {"name": "Sentence Correction", "expected": "4-5", "importance": "High"},
                    {"name": "Fill in the Blanks", "expected": "3-4", "importance": "High"},
                    {"name": "Idioms & Phrases", "expected": "2-3", "importance": "Medium"},
                    {"name": "Synonyms & Antonyms", "expected": "2-3", "importance": "Medium"}
                ]
            },
            "General Intelligence": {
                "questions": 25,
                "color": "from-blue-500 to-cyan-500",
                "topics": [
                    {"name": "Logical Reasoning", "expected": "5-6", "importance": "Very High"},
                    {"name": "Analogies", "expected": "4-5", "importance": "High"},
                    {"name": "Classification", "expected": "3-4", "importance": "High"},
                    {"name": "Series", "expected": "4-5", "importance": "Very High"},
                    {"name": "Coding-Decoding", "expected": "3-4", "importance": "Medium"},
                    {"name": "Blood Relations", "expected": "2-3", "importance": "Medium"},
                    {"name": "Direction Sense", "expected": "2-3", "importance": "Low"}
                ]
            },
            "Quantitative Aptitude": {
                "questions": 25,
                "color": "from-orange-500 to-red-500",
                "topics": [
                    {"name": "Arithmetic", "expected": "8-10", "importance": "Very High"},
                    {"name": "Algebra", "expected": "4-5", "importance": "High"},
                    {"name": "Geometry", "expected": "4-5", "importance": "High"},
                    {"name": "Trigonometry", "expected": "3-4", "importance": "Medium"},
                    {"name": "Data Interpretation", "expected": "3-4", "importance": "High"},
                    {"name": "Mensuration", "expected": "2-3", "importance": "Medium"}
                ]
            },
            "General Awareness": {
                "questions": 25,
                "color": "from-green-500 to-teal-500",
                "topics": [
                    {"name": "Current Affairs", "expected": "10-12", "importance": "Very High"},
                    {"name": "History", "expected": "4-5", "importance": "High"},
                    {"name": "Geography", "expected": "3-4", "importance": "High"},
                    {"name": "Polity", "expected": "3-4", "importance": "Medium"},
                    {"name": "Economics", "expected": "2-3", "importance": "Medium"},
                    {"name": "Science & Technology", "expected": "2-3", "importance": "Medium"}
                ]
            }
        }
    },
    "JEE": {
        "total_questions": 75,
        "subjects": {
            "Physics": {
                "questions": 25,
                "color": "from-blue-500 to-indigo-500",
                "topics": [
                    {"name": "Mechanics", "expected": "8-10", "importance": "Very High"},
                    {"name": "Electromagnetism", "expected": "6-8", "importance": "Very High"},
                    {"name": "Modern Physics", "expected": "4-5", "importance": "High"},
                    {"name": "Thermodynamics", "expected": "3-4", "importance": "High"},
                    {"name": "Optics", "expected": "2-3", "importance": "Medium"},
                    {"name": "Waves", "expected": "1-2", "importance": "Low"}
                ]
            },
            "Chemistry": {
                "questions": 25,
                "color": "from-purple-500 to-pink-500",
                "topics": [
                    {"name": "Organic Chemistry", "expected": "10-12", "importance": "Very High"},
                    {"name": "Physical Chemistry", "expected": "8-9", "importance": "Very High"},
                    {"name": "Inorganic Chemistry", "expected": "5-6", "importance": "High"}
                ]
            },
            "Mathematics": {
                "questions": 25,
                "color": "from-orange-500 to-red-500",
                "topics": [
                    {"name": "Calculus", "expected": "8-10", "importance": "Very High"},
                    {"name": "Algebra", "expected": "6-8", "importance": "Very High"},
                    {"name": "Coordinate Geometry", "expected": "4-5", "importance": "High"},
                    {"name": "Trigonometry", "expected": "3-4", "importance": "High"},
                    {"name": "Vectors & 3D", "expected": "2-3", "importance": "Medium"}
                ]
            }
        }
    },
    "NEET": {
        "total_questions": 180,
        "subjects": {
            "Physics": {
                "questions": 45,
                "color": "from-blue-500 to-cyan-500",
                "topics": [
                    {"name": "Mechanics", "expected": "12-15", "importance": "Very High"},
                    {"name": "Electrodynamics", "expected": "10-12", "importance": "Very High"},
                    {"name": "Modern Physics", "expected": "8-10", "importance": "High"},
                    {"name": "Thermodynamics", "expected": "6-8", "importance": "High"},
                    {"name": "Optics & Waves", "expected": "8-10", "importance": "Medium"}
                ]
            },
            "Chemistry": {
                "questions": 45,
                "color": "from-purple-500 to-pink-500",
                "topics": [
                    {"name": "Organic Chemistry", "expected": "18-20", "importance": "Very High"},
                    {"name": "Physical Chemistry", "expected": "12-15", "importance": "High"},
                    {"name": "Inorganic Chemistry", "expected": "10-12", "importance": "High"}
                ]
            },
            "Biology": {
                "questions": 90,
                "color": "from-green-500 to-emerald-500",
                "topics": [
                    {"name": "Human Physiology", "expected": "18-20", "importance": "Very High"},
                    {"name": "Genetics & Evolution", "expected": "15-18", "importance": "Very High"},
                    {"name": "Plant Physiology", "expected": "12-15", "importance": "High"},
                    {"name": "Cell Biology", "expected": "10-12", "importance": "High"},
                    {"name": "Ecology", "expected": "8-10", "importance": "Medium"},
                    {"name": "Biotechnology", "expected": "6-8", "importance": "Medium"}
                ]
            }
        }
    },
    "UPSC": {
        "total_questions": 200,
        "subjects": {
            "General Studies": {
                "questions": 100,
                "color": "from-amber-500 to-orange-500",
                "topics": [
                    {"name": "Current Affairs", "expected": "25-30", "importance": "Very High"},
                    {"name": "Indian Polity", "expected": "18-20", "importance": "Very High"},
                    {"name": "History", "expected": "15-18", "importance": "High"},
                    {"name": "Geography", "expected": "12-15", "importance": "High"},
                    {"name": "Economics", "expected": "12-15", "importance": "High"},
                    {"name": "Science & Technology", "expected": "10-12", "importance": "Medium"}
                ]
            },
            "CSAT": {
                "questions": 80,
                "color": "from-blue-500 to-indigo-500",
                "topics": [
                    {"name": "Comprehension", "expected": "20-25", "importance": "Very High"},
                    {"name": "Logical Reasoning", "expected": "15-18", "importance": "High"},
                    {"name": "Analytical Ability", "expected": "12-15", "importance": "High"},
                    {"name": "Decision Making", "expected": "10-12", "importance": "Medium"},
                    {"name": "Basic Numeracy", "expected": "18-20", "importance": "High"}
                ]
            }
        }
    }
}

def get_exam_weightage(exam_id):
    """Get weightage data for a specific exam"""
    return EXAM_WEIGHTAGE.get(exam_id, None)
