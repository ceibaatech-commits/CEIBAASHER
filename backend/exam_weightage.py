# Topic-wise Weightage Analysis for All Exams

EXAM_WEIGHTAGE = {
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
        "marks_distribution": {
            "Mathematics": 300,
            "General Ability Test": 600
        },
        "subjects": {
            "Mathematics (300 Marks)": {
                "questions": 120,
                "color": "from-green-600 to-emerald-600",
                "topics": [
                    {"name": "Algebra", "expected": "30-35", "importance": "Very High"},
                    {"name": "Trigonometry", "expected": "20-25", "importance": "Very High"},
                    {"name": "Analytical Geometry 2D", "expected": "20-25", "importance": "Very High"},
                    {"name": "Analytical Geometry 3D", "expected": "12-15", "importance": "High"},
                    {"name": "Differential Calculus", "expected": "20-25", "importance": "Very High"},
                    {"name": "Integral Calculus & Differential Equations", "expected": "20-25", "importance": "Very High"},
                    {"name": "Vector Algebra", "expected": "12-15", "importance": "High"},
                    {"name": "Statistics & Probability", "expected": "12-15", "importance": "High"}
                ]
            },
            "General Ability Test - GAT (600 Marks)": {
                "questions": 150,
                "color": "from-blue-600 to-cyan-600",
                "topics": [
                    {"name": "English", "expected": "45-50", "importance": "Very High"},
                    {"name": "Physics", "expected": "22-25", "importance": "High"},
                    {"name": "Chemistry", "expected": "22-25", "importance": "High"},
                    {"name": "General Science (Biology)", "expected": "18-20", "importance": "High"},
                    {"name": "History", "expected": "22-25", "importance": "High"},
                    {"name": "Geography", "expected": "18-20", "importance": "High"},
                    {"name": "Current Affairs", "expected": "12-15", "importance": "Very High"},
                    {"name": "Polity", "expected": "18-20", "importance": "High"},
                    {"name": "Economics", "expected": "12-15", "importance": "Medium"}
                ]
            }
        }
    },
    "Agniveer": {
        "total_questions": 50,
        "total_marks": 100,
        "marks_per_question": 2,
        "negative_marking": "No negative marking",
        "duration": "1 hour",
        "subjects": {
            "General Knowledge (30 Marks)": {
                "questions": 15,
                "color": "from-orange-500 to-red-500",
                "topics": [
                    {"name": "India and Its Neighboring Countries", "expected": "2", "importance": "High"},
                    {"name": "Abbreviations", "expected": "1", "importance": "Medium"},
                    {"name": "Sports", "expected": "2", "importance": "High"},
                    {"name": "Awards and Prizes", "expected": "1", "importance": "Medium"},
                    {"name": "Terminology", "expected": "1", "importance": "Medium"},
                    {"name": "Indian Armed Forces", "expected": "2", "importance": "Very High"},
                    {"name": "Continents and Subcontinents", "expected": "1", "importance": "Medium"},
                    {"name": "Inventions and Discoveries", "expected": "1", "importance": "Medium"},
                    {"name": "The Constitution of India", "expected": "1", "importance": "High"},
                    {"name": "International Organizations", "expected": "1", "importance": "Medium"},
                    {"name": "Books and Authors", "expected": "1", "importance": "Low"},
                    {"name": "Important Events", "expected": "1", "importance": "High"},
                    {"name": "Current World Events", "expected": "1", "importance": "Very High"},
                    {"name": "Prominent Personalities", "expected": "1", "importance": "Medium"}
                ]
            },
            "Logical Reasoning (10 Marks)": {
                "questions": 5,
                "color": "from-indigo-500 to-purple-500",
                "topics": [
                    {"name": "Logical Ability", "expected": "5", "importance": "Very High"}
                ]
            },
            "Mathematics (30 Marks)": {
                "questions": 15,
                "color": "from-blue-500 to-cyan-500",
                "topics": [
                    {"name": "Number Systems", "expected": "2", "importance": "High"},
                    {"name": "Fundamental Arithmetical Operations", "expected": "8", "importance": "Very High"},
                    {"name": "Algebra", "expected": "2", "importance": "High"},
                    {"name": "Geometry", "expected": "1", "importance": "Medium"},
                    {"name": "Mensuration", "expected": "1", "importance": "Medium"},
                    {"name": "Trigonometry", "expected": "1", "importance": "Medium"}
                ]
            },
            "General Science (30 Marks)": {
                "questions": 15,
                "color": "from-green-500 to-emerald-500",
                "topics": [
                    {"name": "Physics and Chemistry", "expected": "8", "importance": "Very High"},
                    {"name": "Biology", "expected": "7", "importance": "Very High"}
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
    },
    
    "GATE": {
        "total_questions": 65,
        "subjects": {
            "Engineering Mathematics": {
                "questions": 30,
                "color": "from-purple-500 to-blue-500",
                "topics": [
                    {"name": "Linear Algebra", "expected": "8-10", "importance": "Very High"},
                    {"name": "Calculus", "expected": "10-12", "importance": "Very High"},
                    {"name": "Differential Equations", "expected": "5-6", "importance": "High"},
                    {"name": "Probability & Statistics", "expected": "5-7", "importance": "High"}
                ]
            },
            "General Aptitude": {
                "questions": 20,
                "color": "from-green-500 to-teal-500",
                "topics": [
                    {"name": "Verbal Ability", "expected": "8-10", "importance": "High"},
                    {"name": "Numerical Ability", "expected": "8-10", "importance": "High"},
                    {"name": "Logical Reasoning", "expected": "2-4", "importance": "Medium"}
                ]
            },
            "Core Engineering": {
                "questions": 15,
                "color": "from-orange-500 to-red-500",
                "topics": [
                    {"name": "Technical Fundamentals", "expected": "15", "importance": "Very High"}
                ]
            }
        }
    },
    
    "CUET": {
        "total_questions": 200,
        "subjects": {
            "General Test": {
                "questions": 120,
                "color": "from-green-500 to-teal-500",
                "topics": [
                    {"name": "General Knowledge", "expected": "35-40", "importance": "Very High"},
                    {"name": "General Mental Ability", "expected": "35-40", "importance": "Very High"},
                    {"name": "Numerical Ability", "expected": "35-40", "importance": "Very High"}
                ]
            },
            "Language": {
                "questions": 40,
                "color": "from-purple-500 to-pink-500",
                "topics": [
                    {"name": "Reading Comprehension", "expected": "15-18", "importance": "Very High"},
                    {"name": "Grammar", "expected": "12-15", "importance": "High"},
                    {"name": "Vocabulary", "expected": "8-10", "importance": "Medium"}
                ]
            },
            "Domain Subject": {
                "questions": 40,
                "color": "from-blue-500 to-indigo-500",
                "topics": [
                    {"name": "Core Concepts", "expected": "20-25", "importance": "Very High"},
                    {"name": "Applications", "expected": "10-12", "importance": "High"},
                    {"name": "Problem Solving", "expected": "5-8", "importance": "Medium"}
                ]
            }
        }
    },
    
    "UGC_NET": {
        "total_questions": 150,
        "subjects": {
            "Teaching Aptitude": {
                "questions": 30,
                "color": "from-purple-500 to-indigo-500",
                "topics": [
                    {"name": "Teaching Methods", "expected": "12-15", "importance": "Very High"},
                    {"name": "Research Aptitude", "expected": "12-15", "importance": "Very High"},
                    {"name": "Evaluation Systems", "expected": "3-5", "importance": "Medium"}
                ]
            },
            "Reasoning": {
                "questions": 30,
                "color": "from-blue-500 to-cyan-500",
                "topics": [
                    {"name": "Logical Reasoning", "expected": "12-15", "importance": "Very High"},
                    {"name": "Mathematical Reasoning", "expected": "12-15", "importance": "High"}
                ]
            },
            "General Awareness": {
                "questions": 40,
                "color": "from-green-500 to-emerald-500",
                "topics": [
                    {"name": "Current Affairs", "expected": "18-20", "importance": "Very High"},
                    {"name": "Higher Education System", "expected": "15-18", "importance": "High"},
                    {"name": "ICT & Environment", "expected": "5-7", "importance": "Medium"}
                ]
            },
            "Subject Specific": {
                "questions": 50,
                "color": "from-orange-500 to-red-500",
                "topics": [
                    {"name": "Core Subject Fundamentals", "expected": "35-40", "importance": "Very High"},
                    {"name": "Advanced Topics", "expected": "8-12", "importance": "High"},
                    {"name": "Recent Developments", "expected": "2-5", "importance": "Medium"}
                ]
            }
        }
    },
    
    "CAT": {
        "total_questions": 66,
        "subjects": {
            "Verbal Ability": {
                "questions": 24,
                "color": "from-orange-500 to-red-500",
                "topics": [
                    {"name": "Reading Comprehension", "expected": "16-18", "importance": "Very High"},
                    {"name": "Para Jumbles", "expected": "3-4", "importance": "High"},
                    {"name": "Para Summary", "expected": "2-3", "importance": "Medium"}
                ]
            },
            "Data Interpretation": {
                "questions": 20,
                "color": "from-blue-500 to-cyan-500",
                "topics": [
                    {"name": "Tables & Charts", "expected": "8-10", "importance": "Very High"},
                    {"name": "Caselets", "expected": "6-8", "importance": "High"},
                    {"name": "Data Sufficiency", "expected": "4-5", "importance": "Medium"}
                ]
            },
            "Quantitative Ability": {
                "questions": 22,
                "color": "from-purple-500 to-pink-500",
                "topics": [
                    {"name": "Arithmetic", "expected": "8-10", "importance": "Very High"},
                    {"name": "Algebra", "expected": "5-6", "importance": "High"},
                    {"name": "Geometry", "expected": "5-6", "importance": "High"},
                    {"name": "Number System", "expected": "2-3", "importance": "Medium"}
                ]
            }
        }
    },
    
    "CLAT": {
        "total_questions": 120,
        "subjects": {
            "English Language": {
                "questions": 28,
                "color": "from-blue-500 to-indigo-500",
                "topics": [
                    {"name": "Reading Comprehension", "expected": "18-20", "importance": "Very High"},
                    {"name": "Grammar", "expected": "5-6", "importance": "High"},
                    {"name": "Vocabulary", "expected": "3-4", "importance": "Medium"}
                ]
            },
            "Current Affairs": {
                "questions": 35,
                "color": "from-green-500 to-teal-500",
                "topics": [
                    {"name": "National & International News", "expected": "20-25", "importance": "Very High"},
                    {"name": "Static GK", "expected": "8-10", "importance": "High"},
                    {"name": "Legal Current Affairs", "expected": "3-5", "importance": "Medium"}
                ]
            },
            "Legal Reasoning": {
                "questions": 35,
                "color": "from-orange-500 to-red-500",
                "topics": [
                    {"name": "Legal Principles & Applications", "expected": "25-28", "importance": "Very High"},
                    {"name": "Case Analysis", "expected": "5-7", "importance": "High"},
                    {"name": "Legal Logic", "expected": "2-4", "importance": "Medium"}
                ]
            },
            "Logical Reasoning": {
                "questions": 22,
                "color": "from-purple-500 to-pink-500",
                "topics": [
                    {"name": "Analytical Reasoning", "expected": "12-15", "importance": "Very High"},
                    {"name": "Logical Puzzles", "expected": "5-7", "importance": "High"},
                    {"name": "Critical Analysis", "expected": "3-5", "importance": "Medium"}
                ]
            }
        }
    },
    
    "NATA": {
        "total_questions": 125,
        "subjects": {
            "Mathematics": {
                "questions": 40,
                "color": "from-blue-500 to-purple-500",
                "topics": [
                    {"name": "Algebra", "expected": "12-15", "importance": "Very High"},
                    {"name": "Calculus", "expected": "12-15", "importance": "Very High"},
                    {"name": "Coordinate Geometry", "expected": "8-10", "importance": "High"},
                    {"name": "Trigonometry", "expected": "3-5", "importance": "Medium"}
                ]
            },
            "General Aptitude": {
                "questions": 45,
                "color": "from-green-500 to-teal-500",
                "topics": [
                    {"name": "Visual Perception", "expected": "18-20", "importance": "Very High"},
                    {"name": "Aesthetic Sensitivity", "expected": "12-15", "importance": "High"},
                    {"name": "Logical Reasoning", "expected": "8-10", "importance": "High"},
                    {"name": "Architectural Awareness", "expected": "5-7", "importance": "Medium"}
                ]
            },
            "Drawing Ability": {
                "questions": 40,
                "color": "from-pink-500 to-purple-500",
                "topics": [
                    {"name": "2D & 3D Drawing", "expected": "25-30", "importance": "Very High"},
                    {"name": "Perspective Drawing", "expected": "8-10", "importance": "High"},
                    {"name": "Imagination & Creativity", "expected": "2-5", "importance": "Medium"}
                ]
            }
        }
    },
    
    "GMAT": {
        "total_questions": 80,
        "subjects": {
            "Quantitative Reasoning": {
                "questions": 31,
                "color": "from-cyan-500 to-blue-500",
                "topics": [
                    {"name": "Arithmetic", "expected": "10-12", "importance": "Very High"},
                    {"name": "Algebra", "expected": "10-12", "importance": "Very High"},
                    {"name": "Geometry", "expected": "8-10", "importance": "High"}
                ]
            },
            "Verbal Reasoning": {
                "questions": 36,
                "color": "from-purple-500 to-pink-500",
                "topics": [
                    {"name": "Reading Comprehension", "expected": "16-18", "importance": "Very High"},
                    {"name": "Critical Reasoning", "expected": "10-12", "importance": "High"},
                    {"name": "Sentence Correction", "expected": "8-10", "importance": "High"}
                ]
            },
            "Data Insights": {
                "questions": 13,
                "color": "from-green-500 to-emerald-500",
                "topics": [
                    {"name": "Graphics Interpretation", "expected": "4-5", "importance": "Very High"},
                    {"name": "Two-Part Analysis", "expected": "4-5", "importance": "High"},
                    {"name": "Multi-source Reasoning", "expected": "3-4", "importance": "High"}
                ]
            }
        }
    },
    
    # ==================== TEACHING EXAMINATIONS ====================
    
    "DSSB_PGT": {
        "total_questions": 200,
        "subjects": {
            "General Awareness": {
                "questions": 50,
                "color": "from-emerald-500 to-teal-500",
                "topics": [
                    {"name": "Current Affairs", "expected": "12-15", "importance": "Very High"},
                    {"name": "History & Geography", "expected": "10-12", "importance": "High"},
                    {"name": "Polity & Economics", "expected": "8-10", "importance": "High"},
                    {"name": "Delhi GK", "expected": "15-18", "importance": "Very High"}
                ]
            },
            "General Intelligence": {
                "questions": 50,
                "color": "from-blue-500 to-cyan-500",
                "topics": [
                    {"name": "Logical Reasoning", "expected": "12-15", "importance": "Very High"},
                    {"name": "Verbal Reasoning", "expected": "8-10", "importance": "High"},
                    {"name": "Arithmetic", "expected": "15-18", "importance": "Very High"},
                    {"name": "Data Interpretation", "expected": "7-10", "importance": "High"}
                ]
            },
            "Subject Specific Knowledge": {
                "questions": 60,
                "color": "from-purple-500 to-pink-500",
                "topics": [
                    {"name": "Advanced Concepts", "expected": "35-40", "importance": "Very High"},
                    {"name": "Subject Pedagogy", "expected": "15-20", "importance": "Very High"},
                    {"name": "Curriculum Design", "expected": "5-10", "importance": "High"}
                ]
            },
            "Teaching Methodology": {
                "questions": 40,
                "color": "from-orange-500 to-red-500",
                "topics": [
                    {"name": "Teaching Methods", "expected": "12-15", "importance": "Very High"},
                    {"name": "Educational Psychology", "expected": "15-18", "importance": "Very High"},
                    {"name": "Classroom Management", "expected": "8-10", "importance": "High"}
                ]
            }
        }
    },
    
    "DSSB_TGT": {
        "total_questions": 200,
        "subjects": {
            "General Awareness": {
                "questions": 50,
                "color": "from-blue-500 to-cyan-500",
                "topics": [
                    {"name": "Current Affairs", "expected": "12-15", "importance": "Very High"},
                    {"name": "Indian History", "expected": "8-10", "importance": "High"},
                    {"name": "Geography & Science", "expected": "10-12", "importance": "High"},
                    {"name": "Delhi Specific GK", "expected": "15-18", "importance": "Very High"}
                ]
            },
            "Reasoning & Aptitude": {
                "questions": 50,
                "color": "from-purple-500 to-pink-500",
                "topics": [
                    {"name": "Logical Reasoning", "expected": "12-15", "importance": "Very High"},
                    {"name": "Analogies & Series", "expected": "8-10", "importance": "High"},
                    {"name": "Arithmetic", "expected": "15-18", "importance": "Very High"},
                    {"name": "Percentages & DI", "expected": "7-10", "importance": "High"}
                ]
            },
            "Subject Knowledge": {
                "questions": 50,
                "color": "from-green-500 to-emerald-500",
                "topics": [
                    {"name": "Subject Fundamentals", "expected": "30-35", "importance": "Very High"},
                    {"name": "Subject Pedagogy", "expected": "12-15", "importance": "Very High"},
                    {"name": "Curriculum", "expected": "3-5", "importance": "Medium"}
                ]
            },
            "Teaching Methodology": {
                "questions": 50,
                "color": "from-amber-500 to-orange-500",
                "topics": [
                    {"name": "Child Psychology", "expected": "20-25", "importance": "Very High"},
                    {"name": "Teaching Skills", "expected": "20-25", "importance": "Very High"},
                    {"name": "Assessment Methods", "expected": "5-10", "importance": "High"}
                ]
            }
        }
    },
    
    "KVS_PRT": {
        "total_questions": 180,
        "subjects": {
            "General Awareness": {
                "questions": 40,
                "color": "from-amber-500 to-orange-500",
                "topics": [
                    {"name": "Current Affairs", "expected": "12-15", "importance": "Very High"},
                    {"name": "History & Geography", "expected": "10-12", "importance": "High"},
                    {"name": "Science", "expected": "8-10", "importance": "High"},
                    {"name": "KVS & Education Policies", "expected": "8-10", "importance": "Very High"}
                ]
            },
            "Reasoning Ability": {
                "questions": 20,
                "color": "from-blue-500 to-cyan-500",
                "topics": [
                    {"name": "Logical Reasoning", "expected": "12-15", "importance": "Very High"},
                    {"name": "Analogies & Classification", "expected": "5-8", "importance": "High"}
                ]
            },
            "Child Development & Pedagogy": {
                "questions": 30,
                "color": "from-purple-500 to-pink-500",
                "topics": [
                    {"name": "Child Psychology", "expected": "12-15", "importance": "Very High"},
                    {"name": "Learning Theories", "expected": "8-10", "importance": "Very High"},
                    {"name": "Pedagogy & Inclusive Education", "expected": "7-10", "importance": "High"}
                ]
            },
            "Language I (Hindi)": {
                "questions": 30,
                "color": "from-green-500 to-emerald-500",
                "topics": [
                    {"name": "Hindi Grammar", "expected": "12-15", "importance": "Very High"},
                    {"name": "Comprehension", "expected": "10-12", "importance": "High"},
                    {"name": "Pedagogy", "expected": "5-8", "importance": "High"}
                ]
            },
            "Language II (English)": {
                "questions": 30,
                "color": "from-indigo-500 to-purple-500",
                "topics": [
                    {"name": "English Grammar", "expected": "12-15", "importance": "Very High"},
                    {"name": "Comprehension", "expected": "10-12", "importance": "High"},
                    {"name": "Pedagogy", "expected": "5-8", "importance": "High"}
                ]
            },
            "Mathematics & EVS": {
                "questions": 30,
                "color": "from-orange-500 to-red-500",
                "topics": [
                    {"name": "Mathematics", "expected": "12-15", "importance": "Very High"},
                    {"name": "Environmental Studies", "expected": "12-15", "importance": "Very High"},
                    {"name": "Pedagogy", "expected": "3-6", "importance": "High"}
                ]
            }
        }
    },
    
    "CTET": {
        "total_questions": 150,
        "subjects": {
            "Child Development & Pedagogy": {
                "questions": 30,
                "color": "from-purple-500 to-pink-500",
                "topics": [
                    {"name": "Child Development", "expected": "12-15", "importance": "Very High"},
                    {"name": "Learning Theories", "expected": "8-10", "importance": "Very High"},
                    {"name": "Pedagogy & Inclusive Education", "expected": "7-10", "importance": "High"}
                ]
            },
            "Language I": {
                "questions": 30,
                "color": "from-blue-500 to-cyan-500",
                "topics": [
                    {"name": "Reading Comprehension", "expected": "12-15", "importance": "Very High"},
                    {"name": "Language Pedagogy", "expected": "12-15", "importance": "Very High"},
                    {"name": "Grammar & Vocabulary", "expected": "3-6", "importance": "High"}
                ]
            },
            "Language II": {
                "questions": 30,
                "color": "from-green-500 to-emerald-500",
                "topics": [
                    {"name": "Comprehension", "expected": "12-15", "importance": "Very High"},
                    {"name": "Pedagogy", "expected": "12-15", "importance": "Very High"},
                    {"name": "Language Skills", "expected": "3-6", "importance": "High"}
                ]
            },
            "Mathematics & Science": {
                "questions": 60,
                "color": "from-orange-500 to-red-500",
                "topics": [
                    {"name": "Mathematics Content", "expected": "20-25", "importance": "Very High"},
                    {"name": "Mathematics Pedagogy", "expected": "8-10", "importance": "Very High"},
                    {"name": "Science Content", "expected": "20-25", "importance": "Very High"},
                    {"name": "Science Pedagogy", "expected": "7-10", "importance": "Very High"}
                ]
            }
        }
    },
    
    "MPSET": {
        "total_questions": 150,
        "subjects": {
            "Paper I - Teaching Aptitude": {
                "questions": 30,
                "color": "from-indigo-500 to-purple-500",
                "topics": [
                    {"name": "Teaching Aptitude", "expected": "12-15", "importance": "Very High"},
                    {"name": "Research Aptitude", "expected": "12-15", "importance": "Very High"},
                    {"name": "Evaluation Systems", "expected": "3-6", "importance": "High"}
                ]
            },
            "Reasoning & Comprehension": {
                "questions": 20,
                "color": "from-blue-500 to-cyan-500",
                "topics": [
                    {"name": "Logical Reasoning", "expected": "8-10", "importance": "Very High"},
                    {"name": "Comprehension & Analysis", "expected": "8-10", "importance": "Very High"},
                    {"name": "Inference", "expected": "2-4", "importance": "High"}
                ]
            },
            "General Awareness": {
                "questions": 30,
                "color": "from-green-500 to-emerald-500",
                "topics": [
                    {"name": "Higher Education System", "expected": "12-15", "importance": "Very High"},
                    {"name": "UGC & NEP 2020", "expected": "10-12", "importance": "Very High"},
                    {"name": "ICT & Environment", "expected": "5-8", "importance": "High"}
                ]
            },
            "Paper II - Subject Specific": {
                "questions": 70,
                "color": "from-orange-500 to-red-500",
                "topics": [
                    {"name": "Core Subject Knowledge", "expected": "45-50", "importance": "Very High"},
                    {"name": "Advanced Topics", "expected": "12-15", "importance": "Very High"},
                    {"name": "Subject Pedagogy", "expected": "8-12", "importance": "High"}
                ]
            }
        }
    },
    "CDS": {
        "total_questions": 100,
        "subjects": {
            "Mathematics": {
                "questions": 100,
                "color": "from-green-500 to-emerald-500",
                "topics": [
                    {
                        "name": "Algebra",
                        "expected": "15-20",
                        "importance": "Very High",
                        "subtopics": ["Complex Numbers", "Quadratic Equations", "Logarithms", "Permutations & Combinations"]
                    },
                    {
                        "name": "Matrices & Determinants",
                        "expected": "10-15",
                        "importance": "Very High",
                        "subtopics": ["Types of Matrices", "Determinants", "Inverse of Matrix", "Properties"]
                    },
                    {
                        "name": "Trigonometry",
                        "expected": "12-15",
                        "importance": "Very High",
                        "subtopics": ["Trigonometric Ratios", "Identities", "Heights & Distances", "Inverse Trigonometric Functions"]
                    },
                    {
                        "name": "Calculus",
                        "expected": "10-12",
                        "importance": "High",
                        "subtopics": ["Limits", "Differentiation", "Integration", "Applications"]
                    },
                    {
                        "name": "Geometry",
                        "expected": "10-12",
                        "importance": "High",
                        "subtopics": ["Coordinate Geometry", "Circles", "Straight Lines"]
                    },
                    {
                        "name": "Mensuration",
                        "expected": "8-10",
                        "importance": "Medium",
                        "subtopics": ["2D Shapes", "3D Shapes", "Surface Area & Volume"]
                    },
                    {
                        "name": "Statistics & Probability",
                        "expected": "6-8",
                        "importance": "Medium",
                        "subtopics": ["Mean, Median, Mode", "Probability", "Data Interpretation"]
                    }
                ]
            }
        }
    }
}

def get_exam_weightage(exam_id):
    """Get weightage data for a specific exam"""
    return EXAM_WEIGHTAGE.get(exam_id, None)
