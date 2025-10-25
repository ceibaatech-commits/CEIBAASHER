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
    },
    "RPSC": {
        "total_questions": 150,
        "subjects": {
            "General Knowledge": {
                "questions": 60,
                "color": "from-orange-500 to-red-500",
                "topics": [
                    {"name": "Rajasthan GK", "expected": "30-35", "importance": "Very High"},
                    {"name": "Indian History", "expected": "8-10", "importance": "High"},
                    {"name": "Indian Geography", "expected": "8-10", "importance": "High"},
                    {"name": "Indian Polity", "expected": "6-8", "importance": "Medium"},
                    {"name": "Economics", "expected": "4-6", "importance": "Medium"},
                    {"name": "Current Affairs", "expected": "3-5", "importance": "Medium"}
                ]
            },
            "Reasoning": {
                "questions": 30,
                "color": "from-purple-500 to-pink-500",
                "topics": [
                    {"name": "Logical Reasoning", "expected": "8-10", "importance": "Very High"},
                    {"name": "Analogies", "expected": "5-7", "importance": "High"},
                    {"name": "Series & Patterns", "expected": "5-7", "importance": "High"},
                    {"name": "Coding-Decoding", "expected": "4-5", "importance": "Medium"},
                    {"name": "Blood Relations", "expected": "3-4", "importance": "Low"},
                    {"name": "Direction Sense", "expected": "2-3", "importance": "Low"}
                ]
            },
            "Mathematics": {
                "questions": 40,
                "color": "from-blue-500 to-cyan-500",
                "topics": [
                    {"name": "Statistics", "expected": "12-15", "importance": "Very High"},
                    {"name": "Arithmetic", "expected": "10-12", "importance": "Very High"},
                    {"name": "Data Interpretation", "expected": "8-10", "importance": "High"},
                    {"name": "Algebra", "expected": "5-6", "importance": "Medium"},
                    {"name": "Geometry", "expected": "3-5", "importance": "Low"}
                ]
            },
            "Computer Knowledge": {
                "questions": 20,
                "color": "from-green-500 to-teal-500",
                "topics": [
                    {"name": "Computer Fundamentals", "expected": "6-8", "importance": "Very High"},
                    {"name": "MS Office", "expected": "4-6", "importance": "High"},
                    {"name": "Internet & Email", "expected": "3-4", "importance": "Medium"},
                    {"name": "Operating Systems", "expected": "3-4", "importance": "Medium"},
                    {"name": "Computer Networks", "expected": "2-3", "importance": "Low"}
                ]
            }
        }
    },
    "NDA": {
        "total_questions": 270,
        "subjects": {
            "Mathematics": {
                "questions": 120,
                "color": "from-green-600 to-emerald-600",
                "topics": [
                    {"name": "Algebra", "expected": "25-30", "importance": "Very High"},
                    {"name": "Matrices & Determinants", "expected": "15-20", "importance": "High"},
                    {"name": "Trigonometry", "expected": "20-25", "importance": "Very High"},
                    {"name": "Calculus", "expected": "25-30", "importance": "Very High"},
                    {"name": "Vector Algebra", "expected": "10-15", "importance": "Medium"},
                    {"name": "Statistics", "expected": "10-12", "importance": "Medium"}
                ]
            },
            "General Ability": {
                "questions": 150,
                "color": "from-blue-600 to-cyan-600",
                "topics": [
                    {"name": "English", "expected": "50-55", "importance": "Very High"},
                    {"name": "General Knowledge", "expected": "40-45", "importance": "Very High"},
                    {"name": "Physics", "expected": "25-30", "importance": "High"},
                    {"name": "Chemistry", "expected": "20-25", "importance": "Medium"},
                    {"name": "Biology", "expected": "10-12", "importance": "Low"}
                ]
            }
        }
    },
    "Agniveer": {
        "total_questions": 100,
        "subjects": {
            "General Knowledge": {
                "questions": 30,
                "color": "from-orange-500 to-red-500",
                "topics": [
                    {"name": "Indian History", "expected": "8-10", "importance": "High"},
                    {"name": "Geography", "expected": "8-10", "importance": "High"},
                    {"name": "Current Affairs", "expected": "8-10", "importance": "Very High"},
                    {"name": "Indian Polity", "expected": "4-6", "importance": "Medium"}
                ]
            },
            "General Science": {
                "questions": 35,
                "color": "from-purple-500 to-pink-500",
                "topics": [
                    {"name": "Physics", "expected": "12-15", "importance": "Very High"},
                    {"name": "Chemistry", "expected": "10-12", "importance": "High"},
                    {"name": "Biology", "expected": "8-10", "importance": "High"}
                ]
            },
            "Mathematics": {
                "questions": 35,
                "color": "from-blue-500 to-indigo-500",
                "topics": [
                    {"name": "Arithmetic", "expected": "15-18", "importance": "Very High"},
                    {"name": "Algebra", "expected": "10-12", "importance": "High"},
                    {"name": "Geometry", "expected": "8-10", "importance": "Medium"}
                ]
            }
        }
    },
    "CDS": {
        "total_questions": 340,
        "subjects": {
            "English": {
                "questions": 120,
                "color": "from-purple-600 to-pink-600",
                "topics": [
                    {"name": "Grammar", "expected": "35-40", "importance": "Very High"},
                    {"name": "Vocabulary", "expected": "35-40", "importance": "Very High"},
                    {"name": "Comprehension", "expected": "40-45", "importance": "Very High"}
                ]
            },
            "General Knowledge": {
                "questions": 120,
                "color": "from-amber-500 to-orange-500",
                "topics": [
                    {"name": "History", "expected": "20-25", "importance": "High"},
                    {"name": "Geography", "expected": "18-22", "importance": "High"},
                    {"name": "Polity", "expected": "15-18", "importance": "High"},
                    {"name": "Economics", "expected": "12-15", "importance": "Medium"},
                    {"name": "Science", "expected": "18-22", "importance": "High"},
                    {"name": "Current Affairs", "expected": "15-20", "importance": "Very High"}
                ]
            },
            "Elementary Mathematics": {
                "questions": 100,
                "color": "from-blue-600 to-cyan-600",
                "topics": [
                    {"name": "Arithmetic", "expected": "30-35", "importance": "Very High"},
                    {"name": "Algebra", "expected": "25-30", "importance": "High"},
                    {"name": "Trigonometry", "expected": "15-18", "importance": "Medium"},
                    {"name": "Geometry", "expected": "20-25", "importance": "High"}
                ]
            }
        }
    },
    "CAPF": {
        "total_questions": 250,
        "subjects": {
            "General Ability": {
                "questions": 150,
                "color": "from-indigo-600 to-blue-600",
                "topics": [
                    {"name": "General Knowledge", "expected": "40-45", "importance": "Very High"},
                    {"name": "Current Affairs", "expected": "20-25", "importance": "Very High"},
                    {"name": "Logical Reasoning", "expected": "20-25", "importance": "High"},
                    {"name": "Mental Ability", "expected": "15-20", "importance": "High"},
                    {"name": "Basic Numeracy", "expected": "25-30", "importance": "High"}
                ]
            },
            "General Studies": {
                "questions": 100,
                "color": "from-green-600 to-teal-600",
                "topics": [
                    {"name": "Essay Writing", "expected": "25-30", "importance": "Very High"},
                    {"name": "Comprehension", "expected": "30-35", "importance": "Very High"},
                    {"name": "Precis Writing", "expected": "15-20", "importance": "High"},
                    {"name": "Communication Skills", "expected": "20-25", "importance": "High"}
                ]
            }
        }
    }
}

def get_exam_weightage(exam_id):
    """Get weightage data for a specific exam"""
    return EXAM_WEIGHTAGE.get(exam_id, None)
