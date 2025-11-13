# Complete Ceibaa Exam Data Structure
# 8 Major Exam Categories with Full Syllabus

EXAM_DATA = {
    "JEE": {
        "name": "JEE Main & Advanced",
        "full_name": "Joint Entrance Examination",
        "description": "Engineering entrance exam for IITs, NITs, and premier engineering institutes",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/tlt2dw8j_Gemini_Generated_Image_8fhn578fhn578fhn_2-removebg-preview.png",
        "color": "from-blue-500 to-indigo-600",
        "total_questions": 75,
        "duration": "3 hours",
        "category": "Admission Tests",
        "syllabus_topics": {
            "Physics": {
                "subjects": {
                    "Mechanics": {
                        "sub_topics": ["Kinematics", "Laws of Motion", "Work Energy Power", "Rotational Motion", "Gravitation"],
                        "questions": 25
                    },
                    "Thermodynamics": {
                        "sub_topics": ["Heat and Temperature", "Kinetic Theory", "Thermodynamic Processes"],
                        "questions": 20
                    },
                    "Electromagnetism": {
                        "sub_topics": ["Electrostatics", "Current Electricity", "Magnetic Effects", "Electromagnetic Induction"],
                        "questions": 30
                    },
                    "Optics": {
                        "sub_topics": ["Ray Optics", "Wave Optics", "Optical Instruments"],
                        "questions": 20
                    },
                    "Modern Physics": {
                        "sub_topics": ["Dual Nature", "Atoms and Nuclei", "Semiconductor Devices"],
                        "questions": 25
                    }
                }
            },
            "Chemistry": {
                "subjects": {
                    "Physical Chemistry": {
                        "sub_topics": ["Atomic Structure", "Chemical Bonding", "Thermodynamics", "Equilibrium", "Electrochemistry"],
                        "questions": 30
                    },
                    "Organic Chemistry": {
                        "sub_topics": ["Hydrocarbons", "Functional Groups", "Biomolecules", "Polymers"],
                        "questions": 35
                    },
                    "Inorganic Chemistry": {
                        "sub_topics": ["Periodic Table", "Chemical Bonding", "Coordination Compounds", "Metallurgy"],
                        "questions": 30
                    }
                }
            },
            "Mathematics": {
                "subjects": {
                    "Algebra": {
                        "sub_topics": ["Complex Numbers", "Quadratic Equations", "Sequences and Series", "Permutations"],
                        "questions": 30
                    },
                    "Calculus": {
                        "sub_topics": ["Limits", "Differentiation", "Integration", "Differential Equations"],
                        "questions": 35
                    },
                    "Coordinate Geometry": {
                        "sub_topics": ["Straight Lines", "Circles", "Parabola", "Ellipse", "Hyperbola"],
                        "questions": 25
                    },
                    "Vectors and 3D": {
                        "sub_topics": ["Vectors", "3D Geometry", "Vector Algebra"],
                        "questions": 20
                    },
                    "Trigonometry": {
                        "sub_topics": ["Trigonometric Ratios", "Equations", "Properties of Triangles"],
                        "questions": 20
                    }
                }
            }
        }
    },
    "NEET": {
        "name": "NEET",
        "full_name": "National Eligibility cum Entrance Test",
        "description": "Medical entrance exam for MBBS/BDS courses in India",
        "icon": "🏥",
        "color": "from-green-500 to-emerald-600",
        "total_questions": 200,
        "duration": "3 hours",
        "category": "Medical Entrance",
        "syllabus_topics": {
            "Physics": {
                "subjects": {
                    "Mechanics": {
                        "sub_topics": ["Kinematics", "Laws of Motion", "Work Energy Power", "Rotational Motion", "Gravitation", "Simple Harmonic Motion", "Elasticity", "Fluid Mechanics"],
                        "questions": 20
                    },
                    "Thermodynamics": {
                        "sub_topics": ["Heat and Temperature", "Thermal Expansion", "Calorimetry", "Heat Transfer", "Kinetic Theory", "Laws of Thermodynamics"],
                        "questions": 15
                    },
                    "Optics": {
                        "sub_topics": ["Ray Optics", "Wave Optics", "Reflection", "Refraction", "Lenses", "Mirrors", "Optical Instruments"],
                        "questions": 15
                    },
                    "Electromagnetism": {
                        "sub_topics": ["Electrostatics", "Current Electricity", "Magnetic Effects", "Electromagnetic Induction", "AC Circuits"],
                        "questions": 20
                    },
                    "Modern Physics": {
                        "sub_topics": ["Atomic Structure", "Nuclear Physics", "Photoelectric Effect", "Dual Nature", "Semiconductor Devices"],
                        "questions": 15
                    },
                    "Waves": {
                        "sub_topics": ["Wave Motion", "Sound Waves", "Doppler Effect", "Superposition"],
                        "questions": 10
                    },
                    "Sound": {
                        "sub_topics": ["Sound Propagation", "Acoustic Phenomena", "Musical Instruments"],
                        "questions": 10
                    },
                    "Electricity": {
                        "sub_topics": ["Electric Charge", "Electric Field", "Electric Potential", "Capacitance", "Current Electricity Basics"],
                        "questions": 15
                    }
                }
            },
            "Chemistry": {
                "subjects": {
                    "Physical Chemistry": {
                        "sub_topics": ["Atomic Structure", "States of Matter", "Equilibrium", "Redox"],
                        "questions": 25
                    },
                    "Organic Chemistry": {
                        "sub_topics": ["Basic Principles", "Hydrocarbons", "Functional Groups", "Biomolecules"],
                        "questions": 30
                    },
                    "Inorganic Chemistry": {
                        "sub_topics": ["Periodic Table", "Chemical Bonding", "p-Block Elements", "d-Block Elements"],
                        "questions": 25
                    }
                }
            },
            "Biology": {
                "subjects": {
                    "Plant Physiology": {
                        "sub_topics": ["Plant Anatomy", "Photosynthesis", "Respiration", "Plant Growth"],
                        "questions": 25
                    },
                    "Human Physiology": {
                        "sub_topics": ["Digestion", "Breathing", "Circulation", "Excretion", "Nervous System"],
                        "questions": 30
                    },
                    "Genetics": {
                        "sub_topics": ["Heredity", "Molecular Basis", "Evolution"],
                        "questions": 20
                    },
                    "Cell Biology": {
                        "sub_topics": ["Cell Structure", "Cell Division", "Biomolecules"],
                        "questions": 20
                    },
                    "Ecology": {
                        "sub_topics": ["Ecosystem", "Biodiversity", "Environment"],
                        "questions": 15
                    }
                }
            }
        }
    },
    "UPSC": {
        "name": "UPSC CSE",
        "full_name": "Civil Services Examination",
        "description": "Premier exam for IAS, IPS, IFS and other civil services",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/lwzydz67_Gemini_Generated_Image_69zrpn69zrpn69zr_2-removebg-preview.png",
        "color": "from-amber-500 to-orange-500",
        "total_questions": 200,
        "duration": "2 hours",
        "category": "UPSC Examinations",
        "syllabus_topics": {
            "General Studies": {
                "subjects": {
                    "History": {
                        "sub_topics": ["Ancient India", "Medieval India", "Modern India", "World History"],
                        "questions": 35
                    },
                    "Geography": {
                        "sub_topics": ["Physical Geography", "Indian Geography", "World Geography", "Environment"],
                        "questions": 30
                    },
                    "Polity": {
                        "sub_topics": ["Constitution", "Governance", "Social Justice", "International Relations"],
                        "questions": 40
                    },
                    "Economy": {
                        "sub_topics": ["Indian Economy", "Economic Development", "Planning", "Banking"],
                        "questions": 35
                    },
                    "Science & Technology": {
                        "sub_topics": ["Basics", "Space", "Defence", "Biotechnology", "IT"],
                        "questions": 30
                    },
                    "Current Affairs": {
                        "sub_topics": ["National", "International", "Sports", "Awards"],
                        "questions": 30
                    }
                }
            }
        }
    },
    "Agriculture": {
        "name": "Agriculture Exams",
        "full_name": "Agriculture Officer & Related Exams",
        "description": "IBPS AFO, FCI, NABARD, State Agriculture Exams",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/uleda2pa_Gemini_Generated_Image_hheyrwhheyrwhhey_2-removebg-preview.png",
        "color": "from-green-500 to-emerald-600",
        "total_questions": 120,
        "duration": "2 hours",
        "syllabus_topics": {
            "Agriculture": {
                "subjects": {
                    "Agronomy": {
                        "sub_topics": ["Crop Production", "Cropping Systems", "Weed Management", "Irrigation"],
                        "questions": 30
                    },
                    "Horticulture": {
                        "sub_topics": ["Fruit Science", "Vegetable Science", "Floriculture", "Post Harvest"],
                        "questions": 25
                    },
                    "Soil Science": {
                        "sub_topics": ["Soil Classification", "Soil Fertility", "Soil Conservation"],
                        "questions": 20
                    },
                    "Plant Protection": {
                        "sub_topics": ["Entomology", "Plant Pathology", "Pest Management"],
                        "questions": 25
                    },
                    "Agricultural Economics": {
                        "sub_topics": ["Farm Management", "Marketing", "Agricultural Finance"],
                        "questions": 20
                    }
                }
            },
            "General Studies": {
                "subjects": {
                    "Current Affairs": {
                        "sub_topics": ["Agriculture News", "Government Schemes", "Rural Development"],
                        "questions": 20
                    },
                    "Reasoning & Aptitude": {
                        "sub_topics": ["Logical Reasoning", "Numerical Ability", "Data Interpretation"],
                        "questions": 30
                    }
                }
            }
        }
    },
    "RPSC": {
        "name": "RPSC Statistical Officer",
        "full_name": "Rajasthan Public Service Commission Statistical Officer",
        "description": "Statistical Officer recruitment exam for Rajasthan government departments",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/axxtkfie_IMG_1341-removebg-preview.png",
        "color": "from-orange-500 to-red-500",
        "total_questions": 150,
        "duration": "3 hours",
        "syllabus_topics": {
            "General Knowledge": {
                "subjects": {
                    "Rajasthan GK": {
                        "sub_topics": ["History", "Geography", "Culture", "Economy", "Polity", "Current Affairs"],
                        "questions": 50
                    },
                    "Indian GK": {
                        "sub_topics": ["History", "Geography", "Polity", "Economy", "Science"],
                        "questions": 40
                    }
                }
            },
            "Reasoning": {
                "subjects": {
                    "Logical Reasoning": {
                        "sub_topics": ["Analogies", "Classification", "Series", "Coding"],
                        "questions": 25
                    }
                }
            },
            "Mathematics": {
                "subjects": {
                    "Arithmetic": {
                        "sub_topics": ["Number System", "Percentage", "Ratio", "Average", "Time & Work"],
                        "questions": 25
                    }
                }
            },
            "Computer Knowledge": {
                "subjects": {
                    "Basics": {
                        "sub_topics": ["Hardware", "Software", "MS Office", "Internet", "Cyber Security"],
                        "questions": 20
                    }
                }
            }
        }
    },
    "NDA": {
        "name": "NDA Exam",
        "full_name": "National Defence Academy",
        "description": "Joint Services Entrance Exam for Army, Navy & Air Force",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/5ssemynn_IMG_1343.png",
        "color": "from-green-700 to-emerald-800",
        "total_questions": 270,
        "duration": "5 hours",
        "syllabus_topics": {
            "Mathematics": {
                "subjects": {
                    "Algebra": {"sub_topics": ["Complex Numbers", "Quadratic Equations", "Logarithms", "Permutations"], "questions": 20},
                    "Matrices & Determinants": {"sub_topics": ["Types of Matrices", "Determinants", "Inverse", "Properties"], "questions": 15},
                    "Trigonometry": {"sub_topics": ["Ratios", "Identities", "Heights & Distances", "Equations"], "questions": 20},
                    "Calculus": {"sub_topics": ["Differentiation", "Integration", "Applications", "Limits"], "questions": 25},
                    "Vector Algebra": {"sub_topics": ["Vectors", "Dot Product", "Cross Product"], "questions": 15}
                }
            },
            "General Ability": {
                "subjects": {
                    "English": {"sub_topics": ["Grammar", "Vocabulary", "Comprehension", "Sentence Correction"], "questions": 50},
                    "General Knowledge": {"sub_topics": ["History", "Geography", "Current Affairs", "Polity"], "questions": 40},
                    "Physics": {"sub_topics": ["Mechanics", "Heat", "Light", "Electricity"], "questions": 30},
                    "Chemistry": {"sub_topics": ["Physical Chemistry", "Inorganic", "Organic"], "questions": 25}
                }
            }
        }
    },
    "Agniveer": {
        "name": "Agniveer Exam",
        "full_name": "Agniveer Recruitment",
        "description": "Indian Armed Forces recruitment for soldiers across all three services",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/5ssemynn_IMG_1343.png",
        "color": "from-green-600 to-teal-700",
        "total_questions": 100,
        "duration": "2 hours",
        "syllabus_topics": {
            "General Knowledge": {
                "subjects": {
                    "Indian History": {"sub_topics": ["Ancient India", "Medieval India", "Modern India"], "questions": 10},
                    "Geography": {"sub_topics": ["Physical Geography", "Economic Geography", "World Geography"], "questions": 10},
                    "Current Affairs": {"sub_topics": ["National Events", "International Events", "Sports"], "questions": 10}
                }
            },
            "General Science": {
                "subjects": {
                    "Physics": {"sub_topics": ["Mechanics", "Electricity", "Optics", "Sound"], "questions": 15},
                    "Chemistry": {"sub_topics": ["Elements", "Compounds", "Reactions", "Acids & Bases"], "questions": 10},
                    "Biology": {"sub_topics": ["Human Body", "Plants", "Diseases", "Nutrition"], "questions": 10}
                }
            },
            "Mathematics": {
                "subjects": {
                    "Arithmetic": {"sub_topics": ["Number System", "Percentage", "Ratio & Proportion", "Average"], "questions": 15},
                    "Algebra": {"sub_topics": ["Linear Equations", "Polynomials", "Factorization"], "questions": 10},
                    "Geometry": {"sub_topics": ["Triangles", "Circles", "Mensuration", "Angles"], "questions": 10}
                }
            }
        }
    },
    "CDS": {
        "name": "CDS Exam",
        "full_name": "Combined Defence Services",
        "description": "Entry exam for IMA, INA, AFA and OTA",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/5ssemynn_IMG_1343.png",
        "color": "from-teal-600 to-cyan-700",
        "total_questions": 340,
        "duration": "6 hours",
        "syllabus_topics": {
            "English": {
                "subjects": {
                    "Grammar": {"sub_topics": ["Tenses", "Voice", "Narration", "Articles"], "questions": 20},
                    "Vocabulary": {"sub_topics": ["Synonyms", "Antonyms", "Idioms", "Phrases"], "questions": 20},
                    "Comprehension": {"sub_topics": ["Reading Comprehension", "Passage Analysis", "Inference"], "questions": 20}
                }
            },
            "General Knowledge": {
                "subjects": {
                    "History": {"sub_topics": ["Indian History", "World History", "Freedom Movement"], "questions": 20},
                    "Geography": {"sub_topics": ["Physical Geography", "Economic Geography", "Political Geography"], "questions": 20},
                    "Polity": {"sub_topics": ["Constitution", "Governance", "Rights"], "questions": 15},
                    "Economics": {"sub_topics": ["Indian Economy", "World Economy", "Economic Development"], "questions": 15},
                    "Science": {"sub_topics": ["Physics", "Chemistry", "Biology", "Technology"], "questions": 20}
                }
            },
            "Elementary Mathematics": {
                "subjects": {
                    "Arithmetic": {"sub_topics": ["Number System", "LCM HCF", "Percentage", "Profit & Loss"], "questions": 25},
                    "Algebra": {"sub_topics": ["Linear Equations", "Quadratic Equations", "Polynomials"], "questions": 20},
                    "Trigonometry": {"sub_topics": ["Ratios", "Identities", "Heights & Distances"], "questions": 15},
                    "Geometry": {"sub_topics": ["Triangles", "Circles", "Mensuration", "Coordinate Geometry"], "questions": 20}
                }
            }
        }
    },
    "CAPF": {
        "name": "UPSC CAPF AC",
        "full_name": "Central Armed Police Forces Assistant Commandant",
        "description": "Recruitment for BSF, CRPF, CISF, ITBP, SSB officers",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/5ssemynn_IMG_1343.png",
        "color": "from-purple-600 to-indigo-700",
        "total_questions": 250,
        "duration": "4 hours",
        "syllabus_topics": {
            "General Ability": {
                "subjects": {
                    "General Knowledge": {"sub_topics": ["History", "Geography", "Polity", "Economics"], "questions": 40},
                    "Current Affairs": {"sub_topics": ["National Events", "International Events", "Awards"], "questions": 20},
                    "Logical Reasoning": {"sub_topics": ["Analogies", "Series", "Coding", "Classification"], "questions": 20}
                }
            },
            "General Studies": {
                "subjects": {
                    "Essay Writing": {"sub_topics": ["Current Topics", "Social Issues", "National Security"], "questions": 10},
                    "Comprehension": {"sub_topics": ["Reading", "Analysis", "Inference"], "questions": 20},
                    "Communication Skills": {"sub_topics": ["Grammar", "Vocabulary", "Sentence Formation"], "questions": 20}
                }
            }
        }
    },
    
    # ==================== ADMISSION TESTS ====================
    
    "GATE": {
        "name": "GATE",
        "full_name": "Graduate Aptitude Test in Engineering",
        "description": "National level engineering entrance exam for M.Tech, PSU recruitment",
        "icon": "https://customer-assets.emergentagent.com/job_prepninja-exams/artifacts/9pbxgmoq_Gemini_Generated_Image_1zgyxl1zgyxl1zgy_2-removebg-preview.png",
        "color": "from-purple-600 to-blue-600",
        "total_questions": 65,
        "duration": "3 hours",
        "category": "Admission Tests",
        "syllabus_topics": {
            "Engineering Mathematics": {
                "subjects": {
                    "Linear Algebra": {"sub_topics": ["Matrices", "Determinants", "Eigen Values", "Linear Equations"], "questions": 10},
                    "Calculus": {"sub_topics": ["Limits", "Differentiation", "Integration", "Differential Equations"], "questions": 12},
                    "Probability": {"sub_topics": ["Random Variables", "Distributions", "Statistics"], "questions": 8}
                }
            },
            "General Aptitude": {
                "subjects": {
                    "Verbal Ability": {"sub_topics": ["Grammar", "Sentence Completion", "Verbal Analogies"], "questions": 10},
                    "Numerical Ability": {"sub_topics": ["Data Interpretation", "Numerical Computation", "Quantitative Comparison"], "questions": 10}
                }
            },
            "Core Engineering": {
                "subjects": {
                    "Technical Fundamentals": {"sub_topics": ["Core Concepts", "Advanced Topics", "Applications"], "questions": 15}
                }
            }
        }
    },
    
    "CUET": {
        "name": "CUET",
        "full_name": "Common University Entrance Test",
        "description": "National level entrance exam for undergraduate programs in central universities",
        "icon": "https://customer-assets.emergentagent.com/job_prepninja-exams/artifacts/9pbxgmoq_Gemini_Generated_Image_1zgyxl1zgyxl1zgy_2-removebg-preview.png",
        "color": "from-green-600 to-teal-600",
        "total_questions": 200,
        "duration": "3 hours",
        "category": "Admission Tests",
        "syllabus_topics": {
            "General Test": {
                "subjects": {
                    "General Knowledge": {"sub_topics": ["Current Affairs", "History", "Geography", "Polity"], "questions": 40},
                    "General Mental Ability": {"sub_topics": ["Logical Reasoning", "Analytical Reasoning", "Quantitative Reasoning"], "questions": 40},
                    "Numerical Ability": {"sub_topics": ["Arithmetic", "Data Interpretation", "Modern Math"], "questions": 40}
                }
            },
            "Language": {
                "subjects": {
                    "English": {"sub_topics": ["Reading Comprehension", "Grammar", "Vocabulary"], "questions": 40}
                }
            },
            "Domain Subject": {
                "subjects": {
                    "Subject Specific": {"sub_topics": ["Core Concepts", "Applications", "Problem Solving"], "questions": 40}
                }
            }
        }
    },
    
    "UGC_NET": {
        "name": "UGC NET",
        "full_name": "University Grants Commission National Eligibility Test",
        "description": "National level exam for determining eligibility for lectureship and JRF",
        "icon": "https://customer-assets.emergentagent.com/job_prepninja-exams/artifacts/9pbxgmoq_Gemini_Generated_Image_1zgyxl1zgyxl1zgy_2-removebg-preview.png",
        "color": "from-indigo-600 to-purple-700",
        "total_questions": 150,
        "duration": "3 hours",
        "category": "Admission Tests",
        "syllabus_topics": {
            "Teaching Aptitude": {
                "subjects": {
                    "Teaching Methods": {"sub_topics": ["Teaching Techniques", "Evaluation Systems", "Student Psychology"], "questions": 15},
                    "Research Aptitude": {"sub_topics": ["Research Methods", "Data Analysis", "Research Ethics"], "questions": 15}
                }
            },
            "Reasoning": {
                "subjects": {
                    "Logical Reasoning": {"sub_topics": ["Deduction", "Induction", "Analogies"], "questions": 15},
                    "Mathematical Reasoning": {"sub_topics": ["Number Series", "Data Interpretation", "Problem Solving"], "questions": 15}
                }
            },
            "General Awareness": {
                "subjects": {
                    "Current Affairs": {"sub_topics": ["National", "International", "Academic World"], "questions": 20},
                    "Higher Education": {"sub_topics": ["Education System", "ICT", "Environment"], "questions": 20}
                }
            },
            "Subject Specific": {
                "subjects": {
                    "Core Subject": {"sub_topics": ["Fundamentals", "Advanced Topics", "Recent Developments"], "questions": 50}
                }
            }
        }
    },
    
    "CAT": {
        "name": "CAT",
        "full_name": "Common Admission Test",
        "description": "National level entrance exam for IIMs and top B-schools",
        "icon": "https://customer-assets.emergentagent.com/job_prepninja-exams/artifacts/9pbxgmoq_Gemini_Generated_Image_1zgyxl1zgyxl1zgy_2-removebg-preview.png",
        "color": "from-orange-600 to-red-600",
        "total_questions": 66,
        "duration": "2 hours",
        "category": "Admission Tests",
        "syllabus_topics": {
            "Verbal Ability": {
                "subjects": {
                    "Reading Comprehension": {"sub_topics": ["Passage Analysis", "Critical Reasoning", "Inference"], "questions": 18},
                    "Verbal Reasoning": {"sub_topics": ["Para Jumbles", "Para Summary", "Sentence Correction"], "questions": 6}
                }
            },
            "Data Interpretation": {
                "subjects": {
                    "Tables & Charts": {"sub_topics": ["Bar Charts", "Pie Charts", "Line Graphs", "Tables"], "questions": 10},
                    "Data Analysis": {"sub_topics": ["Caselets", "Data Sufficiency", "Logical DI"], "questions": 10}
                }
            },
            "Quantitative Ability": {
                "subjects": {
                    "Arithmetic": {"sub_topics": ["Percentages", "Profit & Loss", "Time & Work", "Ratio & Proportion"], "questions": 10},
                    "Algebra": {"sub_topics": ["Equations", "Inequalities", "Functions"], "questions": 6},
                    "Geometry": {"sub_topics": ["Mensuration", "Coordinate Geometry", "Trigonometry"], "questions": 6}
                }
            }
        }
    },
    
    "CLAT": {
        "name": "CLAT",
        "full_name": "Common Law Admission Test",
        "description": "National level entrance exam for admission to law programs",
        "icon": "https://customer-assets.emergentagent.com/job_prepninja-exams/artifacts/9pbxgmoq_Gemini_Generated_Image_1zgyxl1zgyxl1zgy_2-removebg-preview.png",
        "color": "from-indigo-500 to-blue-600",
        "total_questions": 120,
        "duration": "2 hours",
        "category": "Admission Tests",
        "syllabus_topics": {
            "English Language": {
                "subjects": {
                    "Comprehension": {"sub_topics": ["Reading Comprehension", "Grammar", "Vocabulary"], "questions": 28}
                }
            },
            "Current Affairs": {
                "subjects": {
                    "General Knowledge": {"sub_topics": ["National News", "International News", "Static GK"], "questions": 35}
                }
            },
            "Legal Reasoning": {
                "subjects": {
                    "Legal Aptitude": {"sub_topics": ["Legal Principles", "Case Analysis", "Legal Logic"], "questions": 35}
                }
            },
            "Logical Reasoning": {
                "subjects": {
                    "Critical Thinking": {"sub_topics": ["Analytical Reasoning", "Logical Puzzles", "Critical Analysis"], "questions": 22}
                }
            }
        }
    },
    
    "NATA": {
        "name": "NATA",
        "full_name": "National Aptitude Test in Architecture",
        "description": "National level entrance exam for B.Arch programs",
        "icon": "https://customer-assets.emergentagent.com/job_prepninja-exams/artifacts/9pbxgmoq_Gemini_Generated_Image_1zgyxl1zgyxl1zgy_2-removebg-preview.png",
        "color": "from-fuchsia-500 to-pink-600",
        "total_questions": 125,
        "duration": "3 hours",
        "category": "Admission Tests",
        "syllabus_topics": {
            "Mathematics": {
                "subjects": {
                    "Algebra": {"sub_topics": ["Sets", "Functions", "Quadratic Equations", "Matrices"], "questions": 15},
                    "Calculus": {"sub_topics": ["Limits", "Differentiation", "Integration", "Applications"], "questions": 15},
                    "Coordinate Geometry": {"sub_topics": ["2D Geometry", "Circles", "Conic Sections"], "questions": 10}
                }
            },
            "General Aptitude": {
                "subjects": {
                    "Visual Perception": {"sub_topics": ["Objects", "Textures", "Building Forms"], "questions": 20},
                    "Aesthetic Sensitivity": {"sub_topics": ["Design", "Color", "Contrast", "Harmony"], "questions": 15},
                    "Logical Reasoning": {"sub_topics": ["Sets", "Relationships", "Patterns"], "questions": 10}
                }
            },
            "Drawing Ability": {
                "subjects": {
                    "Sketching": {"sub_topics": ["2D Drawing", "3D Perception", "Imagination"], "questions": 40}
                }
            }
        }
    },
    
    "GMAT": {
        "name": "GMAT",
        "full_name": "Graduate Management Admission Test",
        "description": "International entrance exam for MBA and business programs",
        "icon": "https://customer-assets.emergentagent.com/job_prepninja-exams/artifacts/9pbxgmoq_Gemini_Generated_Image_1zgyxl1zgyxl1zgy_2-removebg-preview.png",
        "color": "from-sky-500 to-cyan-600",
        "total_questions": 80,
        "duration": "3.5 hours",
        "category": "Admission Tests",
        "syllabus_topics": {
            "Quantitative Reasoning": {
                "subjects": {
                    "Problem Solving": {"sub_topics": ["Arithmetic", "Algebra", "Geometry"], "questions": 31}
                }
            },
            "Verbal Reasoning": {
                "subjects": {
                    "Reading Comprehension": {"sub_topics": ["Passages", "Critical Reasoning", "Inference"], "questions": 18},
                    "Sentence Correction": {"sub_topics": ["Grammar", "Idioms", "Meaning"], "questions": 18}
                }
            },
            "Data Insights": {
                "subjects": {
                    "Data Analysis": {"sub_topics": ["Graphics", "Tables", "Multi-source Reasoning"], "questions": 13}
                }
            }
        }
    },

    
    # ==================== BANKING EXAMINATIONS ====================
    
    "IBPS_PO": {
        "name": "IBPS PO",
        "full_name": "Institute of Banking Personnel Selection Probationary Officer",
        "description": "Entrance exam for Probationary Officer in public sector banks",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/dgbp1l60_Gemini_Generated_Image_be1xs8be1xs8be1x_2-removebg-preview.png",
        "color": "from-blue-600 to-cyan-600",
        "total_questions": 200,
        "duration": "3 hours",
        "category": "Banking Examinations",
        "syllabus_topics": {
            "Reasoning Ability": {
                "subjects": {
                    "Verbal Reasoning": {"sub_topics": ["Analogies", "Classification", "Series"], "questions": 20},
                    "Non-Verbal Reasoning": {"sub_topics": ["Mirror Images", "Pattern Completion", "Figure Matrix"], "questions": 15},
                    "Puzzles & Seating Arrangement": {"sub_topics": ["Linear", "Circular", "Box Type"], "questions": 25}
                }
            },
            "Quantitative Aptitude": {
                "subjects": {
                    "Arithmetic": {"sub_topics": ["Percentage", "Profit & Loss", "Time & Work", "SI & CI"], "questions": 25},
                    "Data Interpretation": {"sub_topics": ["Tables", "Bar Graph", "Pie Chart", "Line Graph"], "questions": 20},
                    "Number System": {"sub_topics": ["LCM HCF", "Divisibility", "Squares & Cubes"], "questions": 15}
                }
            },
            "English Language": {
                "subjects": {
                    "Reading Comprehension": {"sub_topics": ["Passages", "Vocabulary", "Inference"], "questions": 20},
                    "Grammar": {"sub_topics": ["Error Spotting", "Sentence Improvement", "Cloze Test"], "questions": 20}
                }
            },
            "General Awareness": {
                "subjects": {
                    "Banking Awareness": {"sub_topics": ["Banking Terms", "RBI", "Financial News"], "questions": 20},
                    "Current Affairs": {"sub_topics": ["National", "International", "Sports"], "questions": 20}
                }
            }
        }
    },
    
    "IBPS_CLERK": {
        "name": "IBPS Clerk",
        "full_name": "Institute of Banking Personnel Selection Clerical Cadre",
        "description": "Entrance exam for Clerk position in public sector banks",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/dgbp1l60_Gemini_Generated_Image_be1xs8be1xs8be1x_2-removebg-preview.png",
        "color": "from-indigo-600 to-blue-600",
        "total_questions": 190,
        "duration": "2 hours 40 minutes",
        "category": "Banking Examinations",
        "syllabus_topics": {
            "Reasoning Ability": {
                "subjects": {
                    "Logical Reasoning": {"sub_topics": ["Syllogism", "Blood Relations", "Coding-Decoding"], "questions": 25},
                    "Seating Arrangement": {"sub_topics": ["Linear", "Circular", "Square"], "questions": 10}
                }
            },
            "Quantitative Aptitude": {
                "subjects": {
                    "Arithmetic": {"sub_topics": ["Time & Distance", "Average", "Ratio & Proportion"], "questions": 25},
                    "Data Interpretation": {"sub_topics": ["Tables", "Charts", "Graphs"], "questions": 10}
                }
            },
            "English Language": {
                "subjects": {
                    "Reading Comprehension": {"sub_topics": ["Passages", "Vocabulary"], "questions": 15},
                    "Grammar": {"sub_topics": ["Error Detection", "Sentence Completion"], "questions": 20}
                }
            },
            "General Awareness": {
                "subjects": {
                    "Banking & Financial Awareness": {"sub_topics": ["Banking News", "Economy", "Monetary Policy"], "questions": 30}
                }
            },
            "Computer Knowledge": {
                "subjects": {
                    "Computer Fundamentals": {"sub_topics": ["Hardware", "Software", "Internet", "MS Office"], "questions": 20}
                }
            }
        }
    },
    
    "IBPS_SO": {
        "name": "IBPS SO",
        "full_name": "Institute of Banking Personnel Selection Specialist Officer",
        "description": "Entrance exam for IT, Agricultural, Marketing and other specialist officers",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/dgbp1l60_Gemini_Generated_Image_be1xs8be1xs8be1x_2-removebg-preview.png",
        "color": "from-purple-600 to-indigo-600",
        "total_questions": 200,
        "duration": "3 hours",
        "category": "Banking Examinations",
        "syllabus_topics": {
            "Reasoning": {
                "subjects": {
                    "Analytical Reasoning": {"sub_topics": ["Puzzles", "Data Sufficiency", "Inequalities"], "questions": 25}
                }
            },
            "Quantitative Aptitude": {
                "subjects": {
                    "Mathematics": {"sub_topics": ["Algebra", "Geometry", "DI"], "questions": 25}
                }
            },
            "English Language": {
                "subjects": {
                    "English Proficiency": {"sub_topics": ["RC", "Grammar", "Vocabulary"], "questions": 25}
                }
            },
            "General Awareness": {
                "subjects": {
                    "Banking & Economy": {"sub_topics": ["Current Affairs", "Banking Terms", "Economy"], "questions": 25}
                }
            },
            "Professional Knowledge": {
                "subjects": {
                    "Specialized Subject": {"sub_topics": ["IT/Agriculture/Marketing/Law/HR"], "questions": 100}
                }
            }
        }
    },
    
    "SBI_PO": {
        "name": "SBI PO",
        "full_name": "State Bank of India Probationary Officer",
        "description": "Entrance exam for PO in State Bank of India",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/dgbp1l60_Gemini_Generated_Image_be1xs8be1xs8be1x_2-removebg-preview.png",
        "color": "from-cyan-500 to-blue-600",
        "total_questions": 190,
        "duration": "3 hours",
        "category": "Banking Examinations",
        "syllabus_topics": {
            "Reasoning Ability": {
                "subjects": {
                    "Puzzles & Seating": {"sub_topics": ["Complex Puzzles", "Seating Arrangement", "Blood Relations"], "questions": 35},
                    "Verbal Reasoning": {"sub_topics": ["Syllogism", "Input-Output", "Coding"], "questions": 15}
                }
            },
            "Quantitative Aptitude": {
                "subjects": {
                    "Arithmetic": {"sub_topics": ["Percentage", "Profit Loss", "Time Work", "SI CI"], "questions": 20},
                    "Data Interpretation": {"sub_topics": ["Charts", "Tables", "Graphs", "Caselets"], "questions": 15}
                }
            },
            "English Language": {
                "subjects": {
                    "Reading Comprehension": {"sub_topics": ["RC Passages", "Vocabulary"], "questions": 20},
                    "Grammar": {"sub_topics": ["Error Spotting", "Sentence Correction", "Para Jumbles"], "questions": 15}
                }
            },
            "General Awareness": {
                "subjects": {
                    "Banking Awareness": {"sub_topics": ["Banking News", "Financial Terms", "RBI Policies"], "questions": 30}
                }
            },
            "Data Analysis": {
                "subjects": {
                    "Data Interpretation": {"sub_topics": ["Advanced DI", "Data Sufficiency"], "questions": 50}
                }
            }
        }
    },
    
    "SBI_CLERK": {
        "name": "SBI Clerk",
        "full_name": "State Bank of India Junior Associate",
        "description": "Entrance exam for Clerical position in SBI",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/dgbp1l60_Gemini_Generated_Image_be1xs8be1xs8be1x_2-removebg-preview.png",
        "color": "from-teal-500 to-cyan-600",
        "total_questions": 190,
        "duration": "2 hours 40 minutes",
        "category": "Banking Examinations",
        "syllabus_topics": {
            "Reasoning Ability": {
                "subjects": {
                    "Logical Reasoning": {"sub_topics": ["Syllogism", "Inequality", "Coding-Decoding"], "questions": 25},
                    "Puzzles": {"sub_topics": ["Seating Arrangement", "Floor Puzzle"], "questions": 10}
                }
            },
            "Quantitative Aptitude": {
                "subjects": {
                    "Arithmetic": {"sub_topics": ["Percentage", "Average", "Ratio"], "questions": 25},
                    "DI": {"sub_topics": ["Tables", "Bar Graph", "Pie Chart"], "questions": 10}
                }
            },
            "English Language": {
                "subjects": {
                    "Reading Comprehension": {"sub_topics": ["Passages", "Vocabulary"], "questions": 20},
                    "Grammar": {"sub_topics": ["Error Detection", "Fill in Blanks"], "questions": 15}
                }
            },
            "General Awareness": {
                "subjects": {
                    "Banking & Current Affairs": {"sub_topics": ["Banking News", "Economy", "Sports"], "questions": 30}
                }
            },
            "Computer Aptitude": {
                "subjects": {
                    "Computer Knowledge": {"sub_topics": ["MS Office", "Internet", "Networking"], "questions": 20}
                }
            }
        }
    },
    
    "RBI_GRADE_B": {
        "name": "RBI Grade B",
        "full_name": "Reserve Bank of India Grade B Officer",
        "description": "Entrance exam for Grade B Officer in RBI",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/dgbp1l60_Gemini_Generated_Image_be1xs8be1xs8be1x_2-removebg-preview.png",
        "color": "from-red-600 to-orange-600",
        "total_questions": 200,
        "duration": "3.5 hours",
        "category": "Banking Examinations",
        "syllabus_topics": {
            "General Awareness": {
                "subjects": {
                    "Economy & Banking": {"sub_topics": ["Indian Economy", "Monetary Policy", "Banking Structure"], "questions": 40},
                    "Current Affairs": {"sub_topics": ["National", "International", "Financial News"], "questions": 40}
                }
            },
            "English Language": {
                "subjects": {
                    "Reading Comprehension": {"sub_topics": ["Business Passages", "Economic Articles"], "questions": 20},
                    "Grammar & Vocabulary": {"sub_topics": ["Error Correction", "Idioms", "Synonyms"], "questions": 20}
                }
            },
            "Quantitative Aptitude": {
                "subjects": {
                    "Advanced Mathematics": {"sub_topics": ["Probability", "Permutation", "Algebra"], "questions": 20}
                }
            },
            "Reasoning": {
                "subjects": {
                    "Analytical Reasoning": {"sub_topics": ["Complex Puzzles", "Data Sufficiency"], "questions": 20}
                }
            },
            "Economic & Social Issues": {
                "subjects": {
                    "Economics": {"sub_topics": ["Macro Economics", "Micro Economics", "Indian Economy"], "questions": 40}
                }
            }
        }
    },
    
    "NABARD": {
        "name": "NABARD Grade A/B",
        "full_name": "National Bank for Agriculture and Rural Development",
        "description": "Entrance exam for Grade A and Grade B Officers in NABARD",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/dgbp1l60_Gemini_Generated_Image_be1xs8be1xs8be1x_2-removebg-preview.png",
        "color": "from-green-600 to-teal-700",
        "total_questions": 200,
        "duration": "3 hours",
        "category": "Banking Examinations",
        "syllabus_topics": {
            "Reasoning": {
                "subjects": {
                    "Logical Reasoning": {"sub_topics": ["Syllogism", "Puzzles", "Seating"], "questions": 40}
                }
            },
            "Quantitative Aptitude": {
                "subjects": {
                    "Mathematics & DI": {"sub_topics": ["Arithmetic", "Algebra", "Data Interpretation"], "questions": 40}
                }
            },
            "English Language": {
                "subjects": {
                    "English Proficiency": {"sub_topics": ["RC", "Grammar", "Vocabulary"], "questions": 40}
                }
            },
            "General Awareness": {
                "subjects": {
                    "Agriculture & Rural Dev": {"sub_topics": ["Agriculture", "Rural Economy", "Banking"], "questions": 40}
                }
            },
            "Computer Knowledge": {
                "subjects": {
                    "IT & Computers": {"sub_topics": ["Computer Basics", "MS Office", "Internet"], "questions": 40}
                }
            }
        }
    },

    
    # ==================== UPSC EXAMINATIONS ====================
    
    "IES_ISS": {
        "name": "IES/ISS",
        "full_name": "Indian Economic Service / Indian Statistical Service",
        "description": "Entrance exam for economic and statistical positions in Government of India",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/lwzydz67_Gemini_Generated_Image_69zrpn69zrpn69zr_2-removebg-preview.png",
        "color": "from-orange-600 to-red-600",
        "total_questions": 200,
        "duration": "3 hours",
        "category": "UPSC Examinations",
        "syllabus_topics": {
            "General English": {
                "subjects": {
                    "English Proficiency": {"sub_topics": ["Essay", "Precis", "Comprehension"], "questions": 100}
                }
            },
            "General Studies": {
                "subjects": {
                    "Economics": {"sub_topics": ["Macro Economics", "Micro Economics", "Indian Economy"], "questions": 40},
                    "Statistics": {"sub_topics": ["Probability", "Statistical Methods", "Data Analysis"], "questions": 30},
                    "Current Affairs": {"sub_topics": ["National", "International", "Economic News"], "questions": 30}
                }
            }
        }
    },
    
    "EPFO": {
        "name": "EPFO EO/AO",
        "full_name": "Employees' Provident Fund Organisation Enforcement/Accounts Officer",
        "description": "Entrance exam for Enforcement Officer and Accounts Officer in EPFO",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/lwzydz67_Gemini_Generated_Image_69zrpn69zrpn69zr_2-removebg-preview.png",
        "color": "from-amber-500 to-orange-500",
        "total_questions": 200,
        "duration": "2.5 hours",
        "category": "UPSC Examinations",
        "syllabus_topics": {
            "General Intelligence": {
                "subjects": {
                    "Reasoning": {"sub_topics": ["Verbal", "Non-Verbal", "Analytical"], "questions": 50}
                }
            },
            "General Awareness": {
                "subjects": {
                    "Current Affairs": {"sub_topics": ["National", "International", "Sports"], "questions": 30},
                    "Indian Polity": {"sub_topics": ["Constitution", "Government", "Rights"], "questions": 20}
                }
            },
            "Quantitative Aptitude": {
                "subjects": {
                    "Mathematics": {"sub_topics": ["Arithmetic", "Algebra", "Geometry"], "questions": 50}
                }
            },
            "English Language": {
                "subjects": {
                    "English": {"sub_topics": ["Grammar", "Vocabulary", "Comprehension"], "questions": 50}
                }
            }
        }
    },
    
    # ==================== SSC EXAMINATIONS ====================
    
    "SSC_CGL": {
        "name": "SSC CGL",
        "full_name": "Staff Selection Commission Combined Graduate Level",
        "description": "Exam for Group B and Group C posts in government departments",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/37tv8za2_Gemini_Generated_Image_6rtg7l6rtg7l6rtg_2-removebg-preview.png",
        "color": "from-red-600 to-rose-700",
        "total_questions": 200,
        "duration": "2 hours",
        "category": "SSC Examinations",
        "syllabus_topics": {
            "General Intelligence": {
                "subjects": {
                    "Reasoning": {"sub_topics": ["Analogies", "Classification", "Series", "Coding-Decoding"], "questions": 50}
                }
            },
            "General Awareness": {
                "subjects": {
                    "Current Affairs": {"sub_topics": ["National", "International", "Sports"], "questions": 25},
                    "Static GK": {"sub_topics": ["History", "Geography", "Polity", "Economy"], "questions": 25}
                }
            },
            "Quantitative Aptitude": {
                "subjects": {
                    "Arithmetic": {"sub_topics": ["Percentage", "Profit Loss", "Time Work", "SI CI"], "questions": 30},
                    "Algebra": {"sub_topics": ["Linear Equations", "Quadratic Equations"], "questions": 10},
                    "Geometry": {"sub_topics": ["Triangles", "Circles", "Mensuration"], "questions": 10}
                }
            },
            "English Comprehension": {
                "subjects": {
                    "Vocabulary": {"sub_topics": ["Synonyms", "Antonyms", "Idioms"], "questions": 15},
                    "Grammar": {"sub_topics": ["Error Detection", "Fill in Blanks", "Sentence Improvement"], "questions": 20},
                    "Reading Comprehension": {"sub_topics": ["Passages", "Inference"], "questions": 15}
                }
            }
        }
    },
    
    "SSC_CHSL": {
        "name": "SSC CHSL",
        "full_name": "Staff Selection Commission Combined Higher Secondary Level",
        "description": "Exam for 10+2 level posts like LDC, DEO, Postal Assistant",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/37tv8za2_Gemini_Generated_Image_6rtg7l6rtg7l6rtg_2-removebg-preview.png",
        "color": "from-pink-600 to-red-600",
        "total_questions": 100,
        "duration": "1 hour",
        "category": "SSC Examinations",
        "syllabus_topics": {
            "General Intelligence": {
                "subjects": {
                    "Reasoning": {"sub_topics": ["Verbal", "Non-Verbal", "Logical"], "questions": 25}
                }
            },
            "General Awareness": {
                "subjects": {
                    "GK & Current Affairs": {"sub_topics": ["Static GK", "Current Events"], "questions": 25}
                }
            },
            "Quantitative Aptitude": {
                "subjects": {
                    "Mathematics": {"sub_topics": ["Arithmetic", "Algebra", "Geometry"], "questions": 25}
                }
            },
            "English Language": {
                "subjects": {
                    "English": {"sub_topics": ["Grammar", "Vocabulary", "Comprehension"], "questions": 25}
                }
            }
        }
    },
    
    "SSC_GD": {
        "name": "SSC GD Constable",
        "full_name": "Staff Selection Commission General Duty Constable",
        "description": "Exam for Constable (GD) in CAPFs, NIA, SSF and Rifleman (GD) in Assam Rifles",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/37tv8za2_Gemini_Generated_Image_6rtg7l6rtg7l6rtg_2-removebg-preview.png",
        "color": "from-orange-600 to-red-700",
        "total_questions": 160,
        "duration": "2 hours",
        "category": "SSC Examinations",
        "syllabus_topics": {
            "General Intelligence": {
                "subjects": {
                    "Reasoning": {"sub_topics": ["Analogies", "Similarities", "Differences", "Problem Solving"], "questions": 40}
                }
            },
            "General Knowledge": {
                "subjects": {
                    "General Awareness": {"sub_topics": ["India & Neighbours", "Sports", "Books & Authors"], "questions": 40}
                }
            },
            "Elementary Mathematics": {
                "subjects": {
                    "Mathematics": {"sub_topics": ["Number System", "Arithmetic", "Geometry"], "questions": 40}
                }
            },
            "English": {
                "subjects": {
                    "English Language": {"sub_topics": ["Vocabulary", "Grammar", "Sentence Structure"], "questions": 40}
                }
            }
        }
    },
    
    "SSC_STENO": {
        "name": "SSC Stenographer",
        "full_name": "Staff Selection Commission Stenographer Grade C & D",
        "description": "Exam for Stenographer Grade C and Grade D posts",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/37tv8za2_Gemini_Generated_Image_6rtg7l6rtg7l6rtg_2-removebg-preview.png",
        "color": "from-purple-600 to-pink-600",
        "total_questions": 200,
        "duration": "2 hours",
        "category": "SSC Examinations",
        "syllabus_topics": {
            "General Intelligence": {
                "subjects": {
                    "Reasoning": {"sub_topics": ["Analogies", "Classification", "Series"], "questions": 50}
                }
            },
            "General Awareness": {
                "subjects": {
                    "GK": {"sub_topics": ["Current Affairs", "Static GK", "Indian Polity"], "questions": 50}
                }
            },
            "English Language": {
                "subjects": {
                    "English": {"sub_topics": ["Vocabulary", "Grammar", "Sentence Formation", "Comprehension"], "questions": 100}
                }
            }
        }
    },
    
    # ==================== TEACHING EXAMINATIONS ====================
    
    "DSSB_PGT": {
        "name": "DSSB PGT",
        "full_name": "Delhi Subordinate Services Selection Board Post Graduate Teacher",
        "description": "Teaching exam for PGT positions in Delhi Government Schools (Classes 11-12)",
        "icon": "https://customer-assets.emergentagent.com/job_prepninja-exams/artifacts/pv7esjzw_IMG_1360-removebg-preview.png",
        "color": "from-emerald-500 to-teal-600",
        "total_questions": 200,
        "duration": "3 hours",
        "category": "Teaching Examinations",
        "syllabus_topics": {
            "General Awareness": {
                "subjects": {
                    "General Knowledge": {"sub_topics": ["Current Affairs", "History", "Geography", "Polity"], "questions": 30},
                    "Delhi GK": {"sub_topics": ["Delhi History", "Delhi Administration", "Monuments", "Culture"], "questions": 20}
                }
            },
            "General Intelligence": {
                "subjects": {
                    "Reasoning": {"sub_topics": ["Logical Reasoning", "Verbal Reasoning", "Non-Verbal Reasoning"], "questions": 25},
                    "Numerical Ability": {"sub_topics": ["Arithmetic", "Data Interpretation", "Number System"], "questions": 25}
                }
            },
            "Subject Specific Knowledge": {
                "subjects": {
                    "Core Subject": {"sub_topics": ["Advanced Concepts", "Subject Pedagogy", "Curriculum Design"], "questions": 60}
                }
            },
            "Teaching Methodology": {
                "subjects": {
                    "Teaching Aptitude": {"sub_topics": ["Teaching Methods", "Learning Theories", "Classroom Management"], "questions": 20},
                    "Educational Psychology": {"sub_topics": ["Adolescent Psychology", "Learning Styles", "Motivation"], "questions": 20}
                }
            }
        }
    },
    
    "DSSB_TGT": {
        "name": "DSSB TGT",
        "full_name": "Delhi Subordinate Services Selection Board Trained Graduate Teacher",
        "description": "Teaching exam for TGT positions in Delhi Government Schools (Classes 6-10)",
        "icon": "https://customer-assets.emergentagent.com/job_prepninja-exams/artifacts/pv7esjzw_IMG_1360-removebg-preview.png",
        "color": "from-blue-500 to-cyan-600",
        "total_questions": 200,
        "duration": "3 hours",
        "category": "Teaching Examinations",
        "syllabus_topics": {
            "General Awareness": {
                "subjects": {
                    "General Knowledge": {"sub_topics": ["Current Affairs", "Indian History", "Geography", "Science"], "questions": 30},
                    "Delhi Specific GK": {"sub_topics": ["Delhi History", "Delhi Culture", "Administration"], "questions": 20}
                }
            },
            "Reasoning & Aptitude": {
                "subjects": {
                    "Logical Reasoning": {"sub_topics": ["Analogies", "Series", "Coding-Decoding"], "questions": 25},
                    "Numerical Aptitude": {"sub_topics": ["Arithmetic", "Percentages", "Data Interpretation"], "questions": 25}
                }
            },
            "Subject Knowledge": {
                "subjects": {
                    "Core Subject": {"sub_topics": ["Subject Fundamentals", "Pedagogy", "Curriculum"], "questions": 50}
                }
            },
            "Teaching Methodology": {
                "subjects": {
                    "Child Psychology": {"sub_topics": ["Learning Theories", "Development Stages", "Individual Differences"], "questions": 25},
                    "Teaching Skills": {"sub_topics": ["Teaching Methods", "Classroom Management", "Assessment"], "questions": 25}
                }
            }
        }
    },
    
    "KVS_PRT": {
        "name": "KVS PRT",
        "full_name": "Kendriya Vidyalaya Sangathan Primary Teacher",
        "description": "Primary teacher recruitment for Kendriya Vidyalaya Schools (Classes 1-5)",
        "icon": "https://customer-assets.emergentagent.com/job_prepninja-exams/artifacts/pv7esjzw_IMG_1360-removebg-preview.png",
        "color": "from-amber-500 to-orange-600",
        "total_questions": 180,
        "duration": "3 hours",
        "category": "Teaching Examinations",
        "syllabus_topics": {
            "General Awareness": {
                "subjects": {
                    "General Knowledge": {"sub_topics": ["Current Affairs", "History", "Geography", "Science"], "questions": 30},
                    "KVS & Education": {"sub_topics": ["KVS History", "NEP 2020", "Education Policies"], "questions": 10}
                }
            },
            "Reasoning Ability": {
                "subjects": {
                    "Logical Reasoning": {"sub_topics": ["Analogies", "Classification", "Series"], "questions": 20}
                }
            },
            "Child Development & Pedagogy": {
                "subjects": {
                    "Child Psychology": {"sub_topics": ["Learning Theories", "Development Stages", "Individual Differences"], "questions": 15},
                    "Pedagogy": {"sub_topics": ["Teaching Methods", "Classroom Management", "Inclusive Education"], "questions": 15}
                }
            },
            "Language I (Hindi)": {
                "subjects": {
                    "Hindi": {"sub_topics": ["Grammar", "Comprehension", "Pedagogy"], "questions": 30}
                }
            },
            "Language II (English)": {
                "subjects": {
                    "English": {"sub_topics": ["Grammar", "Comprehension", "Pedagogy"], "questions": 30}
                }
            },
            "Mathematics & EVS": {
                "subjects": {
                    "Mathematics": {"sub_topics": ["Number System", "Arithmetic", "Pedagogy"], "questions": 15},
                    "Environmental Studies": {"sub_topics": ["Science Concepts", "Social Studies", "Pedagogy"], "questions": 15}
                }
            }
        }
    },
    
    "CTET": {
        "name": "CTET",
        "full_name": "Central Teacher Eligibility Test",
        "description": "Central TET conducted by CBSE for teaching eligibility certification (Paper I & II)",
        "icon": "https://customer-assets.emergentagent.com/job_prepninja-exams/artifacts/pv7esjzw_IMG_1360-removebg-preview.png",
        "color": "from-purple-500 to-pink-600",
        "total_questions": 150,
        "duration": "2.5 hours",
        "category": "Teaching Examinations",
        "syllabus_topics": {
            "Child Development & Pedagogy": {
                "subjects": {
                    "Child Development": {"sub_topics": ["Learning Theories", "Piaget, Kohlberg, Vygotsky", "Individual Differences"], "questions": 15},
                    "Pedagogy": {"sub_topics": ["Learning Process", "Inclusive Education", "Assessment & Evaluation"], "questions": 15}
                }
            },
            "Language I": {
                "subjects": {
                    "Comprehension": {"sub_topics": ["Reading Passages", "Unseen Passages", "Inference"], "questions": 15},
                    "Language Pedagogy": {"sub_topics": ["Teaching Strategies", "Language Development", "Assessment"], "questions": 15}
                }
            },
            "Language II": {
                "subjects": {
                    "Comprehension": {"sub_topics": ["Reading Comprehension", "Grammar", "Vocabulary"], "questions": 15},
                    "Pedagogy": {"sub_topics": ["Language Skills", "Teaching Methods", "Learning Materials"], "questions": 15}
                }
            },
            "Mathematics & Science": {
                "subjects": {
                    "Mathematics": {"sub_topics": ["Number System", "Algebra", "Geometry", "Pedagogy"], "questions": 30},
                    "Science": {"sub_topics": ["Physics", "Chemistry", "Biology", "Pedagogy"], "questions": 30}
                }
            }
        }
    },
    
    "MPSET": {
        "name": "MPSET",
        "full_name": "Madhya Pradesh State Eligibility Test",
        "description": "MP SET for Assistant Professor eligibility in Madhya Pradesh colleges and universities",
        "icon": "https://customer-assets.emergentagent.com/job_prepninja-exams/artifacts/pv7esjzw_IMG_1360-removebg-preview.png",
        "color": "from-violet-500 to-purple-600",
        "total_questions": 150,
        "duration": "3 hours",
        "category": "Teaching Examinations",
        "syllabus_topics": {
            "Paper I - Teaching Aptitude": {
                "subjects": {
                    "Teaching Aptitude": {"sub_topics": ["Teaching Methods", "Classroom Communication", "Evaluation Systems"], "questions": 15},
                    "Research Aptitude": {"sub_topics": ["Research Methods", "Data Interpretation", "Research Ethics"], "questions": 15}
                }
            },
            "Reasoning & Comprehension": {
                "subjects": {
                    "Logical Reasoning": {"sub_topics": ["Deduction", "Induction", "Analogies", "Venn Diagrams"], "questions": 10},
                    "Comprehension": {"sub_topics": ["Reading Comprehension", "Analysis", "Inference"], "questions": 10}
                }
            },
            "General Awareness": {
                "subjects": {
                    "Higher Education": {"sub_topics": ["UGC Regulations", "NEP 2020", "Education System"], "questions": 15},
                    "ICT & Environment": {"sub_topics": ["Information Technology", "Environment & Sustainability"], "questions": 15}
                }
            },
            "Paper II - Subject Specific": {
                "subjects": {
                    "Core Subject Knowledge": {"sub_topics": ["Subject Fundamentals", "Advanced Topics", "Contemporary Issues"], "questions": 50},
                    "Subject Pedagogy": {"sub_topics": ["Teaching Methodologies", "Assessment Techniques"], "questions": 20}
                }
            }
        }
    },
    
    "TS_SET": {
        "name": "TS SET",
        "full_name": "Telangana State Eligibility Test",
        "description": "Telangana state exam for Assistant Professor eligibility",
        "icon": "https://customer-assets.emergentagent.com/job_prepninja-exams/artifacts/pv7esjzw_IMG_1360-removebg-preview.png",
        "color": "from-rose-500 to-pink-600",
        "total_questions": 150,
        "duration": "3 hours",
        "category": "Teaching Examinations",
        "syllabus_topics": {
            "Teaching Aptitude": {
                "subjects": {
                    "Pedagogy": {"sub_topics": ["Teaching Methods", "Learning Assessment"], "questions": 30}
                }
            },
            "Research Aptitude": {
                "subjects": {
                    "Research Methods": {"sub_topics": ["Quantitative", "Qualitative", "Data Analysis"], "questions": 30}
                }
            },
            "Comprehension": {
                "subjects": {
                    "Reading & Communication": {"sub_topics": ["Comprehension", "Logical Reasoning"], "questions": 30}
                }
            },
            "Subject Knowledge": {
                "subjects": {
                    "Subject Specific": {"sub_topics": ["Core Concepts", "Advanced Topics"], "questions": 60}
                }
            }
        }
    },
    
    "UP_TGT": {
        "name": "UP TGT",
        "full_name": "Uttar Pradesh Trained Graduate Teacher",
        "description": "UP state exam for TGT posts",
        "icon": "https://customer-assets.emergentagent.com/job_prepninja-exams/artifacts/pv7esjzw_IMG_1360-removebg-preview.png",
        "color": "from-sky-500 to-blue-600",
        "total_questions": 150,
        "duration": "2.5 hours",
        "category": "Teaching Examinations",
        "syllabus_topics": {
            "General Knowledge": {
                "subjects": {
                    "GK & Current Affairs": {"sub_topics": ["UP GK", "National", "International"], "questions": 40}
                }
            },
            "General Hindi": {
                "subjects": {
                    "Hindi Language": {"sub_topics": ["Grammar", "Comprehension"], "questions": 20}
                }
            },
            "Subject Knowledge": {
                "subjects": {
                    "Subject Specific": {"sub_topics": ["Core Concepts", "Pedagogy"], "questions": 60}
                }
            },
            "General Intelligence": {
                "subjects": {
                    "Reasoning": {"sub_topics": ["Verbal", "Non-Verbal", "Analytical"], "questions": 30}
                }
            }
        }
    },
    
    "UP_PGT": {
        "name": "UP PGT",
        "full_name": "Uttar Pradesh Post Graduate Teacher",
        "description": "UP state exam for PGT posts",
        "icon": "https://customer-assets.emergentagent.com/job_prepninja-exams/artifacts/pv7esjzw_IMG_1360-removebg-preview.png",
        "color": "from-lime-500 to-green-600",
        "total_questions": 150,
        "duration": "2.5 hours",
        "category": "Teaching Examinations",
        "syllabus_topics": {
            "General Knowledge": {
                "subjects": {
                    "GK": {"sub_topics": ["UP GK", "Current Affairs", "Indian Polity"], "questions": 40}
                }
            },
            "General Hindi": {
                "subjects": {
                    "Hindi": {"sub_topics": ["Grammar", "Literature", "Comprehension"], "questions": 20}
                }
            },
            "Subject Knowledge": {
                "subjects": {
                    "Subject Specific": {"sub_topics": ["Advanced Concepts", "Pedagogy"], "questions": 70}
                }
            },
            "Teaching Aptitude": {
                "subjects": {
                    "Pedagogy": {"sub_topics": ["Teaching Methods", "Learning Assessment"], "questions": 20}
                }
            }
        }
    },
    
    "HTET": {
        "name": "HTET",
        "full_name": "Haryana Teacher Eligibility Test",
        "description": "Haryana state teaching eligibility test",
        "icon": "https://customer-assets.emergentagent.com/job_prepninja-exams/artifacts/pv7esjzw_IMG_1360-removebg-preview.png",
        "color": "from-orange-600 to-red-700",
        "total_questions": 150,
        "duration": "2.5 hours",
        "category": "Teaching Examinations",
        "syllabus_topics": {
            "Child Development": {
                "subjects": {
                    "CDP & Pedagogy": {"sub_topics": ["Learning Theories", "Assessment"], "questions": 30}
                }
            },
            "Language I": {
                "subjects": {
                    "Hindi/English": {"sub_topics": ["Comprehension", "Pedagogy"], "questions": 30}
                }
            },
            "Language II": {
                "subjects": {
                    "Sanskrit/Other": {"sub_topics": ["Grammar", "Comprehension"], "questions": 30}
                }
            },
            "Mathematics/Science": {
                "subjects": {
                    "Subject & Pedagogy": {"sub_topics": ["Content", "Teaching Methods"], "questions": 30}
                }
            },
            "Social Studies/EVS": {
                "subjects": {
                    "Subject & Pedagogy": {"sub_topics": ["Content", "Teaching Methods"], "questions": 30}
                }
            }
        }
    },

    # Language Proficiency Tests (8 Languages)
    "SPANISH": {
        "name": "Spanish",
        "full_name": "Spanish Language Proficiency Test",
        "description": "Test your Spanish language skills with 100 questions in 2 hours",
        "icon": "https://customer-assets.emergentagent.com/job_examprep-hub-29/artifacts/49xouqbu_Gemini_Generated_Image_y4o4v7y4o4v7y4o4_2-removebg-preview.png",
        "color": "from-blue-500 to-cyan-500",
        "total_questions": 100,
        "duration": "2 hours",
        "category": "Language Proficiency Tests",
        "syllabus_topics": {
            "Language Test": {
                "subjects": {
                    "Gap-fill": {
                        "sub_topics": ["Fill in the blanks", "Complete the sentence"],
                        "questions": 35
                    },
                    "Vocabulary Building": {
                        "sub_topics": ["Synonyms", "Antonyms", "Word meanings"],
                        "questions": 35
                    },
                    "One Word Substitution": {
                        "sub_topics": ["Replace phrases with single words"],
                        "questions": 30
                    }
                }
            }
        }
    },

    "FRENCH": {
        "name": "French",
        "full_name": "French Language Proficiency Test",
        "description": "Test your French language skills with 100 questions in 2 hours",
        "icon": "https://customer-assets.emergentagent.com/job_examprep-hub-29/artifacts/49xouqbu_Gemini_Generated_Image_y4o4v7y4o4v7y4o4_2-removebg-preview.png",
        "color": "from-blue-600 to-indigo-500",
        "total_questions": 100,
        "duration": "2 hours",
        "category": "Language Proficiency Tests",
        "syllabus_topics": {
            "Language Test": {
                "subjects": {
                    "Gap-fill": {
                        "sub_topics": ["Fill in the blanks", "Complete the sentence"],
                        "questions": 35
                    },
                    "Vocabulary Building": {
                        "sub_topics": ["Synonyms", "Antonyms", "Word meanings"],
                        "questions": 35
                    },
                    "One Word Substitution": {
                        "sub_topics": ["Replace phrases with single words"],
                        "questions": 30
                    }
                }
            }
        }
    },

    "TAMIL": {
        "name": "Tamil",
        "full_name": "Tamil Language Proficiency Test",
        "description": "Test your Tamil language skills with 100 questions in 2 hours",
        "icon": "https://customer-assets.emergentagent.com/job_examprep-hub-29/artifacts/49xouqbu_Gemini_Generated_Image_y4o4v7y4o4v7y4o4_2-removebg-preview.png",
        "color": "from-sky-500 to-blue-500",
        "total_questions": 100,
        "duration": "2 hours",
        "category": "Language Proficiency Tests",
        "syllabus_topics": {
            "Language Test": {
                "subjects": {
                    "Gap-fill": {
                        "sub_topics": ["Fill in the blanks", "Complete the sentence"],
                        "questions": 35
                    },
                    "Vocabulary Building": {
                        "sub_topics": ["Synonyms", "Antonyms", "Word meanings"],
                        "questions": 35
                    },
                    "One Word Substitution": {
                        "sub_topics": ["Replace phrases with single words"],
                        "questions": 30
                    }
                }
            }
        }
    },

    "TELUGU": {
        "name": "Telugu",
        "full_name": "Telugu Language Proficiency Test",
        "description": "Test your Telugu language skills with 100 questions in 2 hours",
        "icon": "https://customer-assets.emergentagent.com/job_examprep-hub-29/artifacts/49xouqbu_Gemini_Generated_Image_y4o4v7y4o4v7y4o4_2-removebg-preview.png",
        "color": "from-cyan-500 to-sky-500",
        "total_questions": 100,
        "duration": "2 hours",
        "category": "Language Proficiency Tests",
        "syllabus_topics": {
            "Language Test": {
                "subjects": {
                    "Gap-fill": {
                        "sub_topics": ["Fill in the blanks", "Complete the sentence"],
                        "questions": 35
                    },
                    "Vocabulary Building": {
                        "sub_topics": ["Synonyms", "Antonyms", "Word meanings"],
                        "questions": 35
                    },
                    "One Word Substitution": {
                        "sub_topics": ["Replace phrases with single words"],
                        "questions": 30
                    }
                }
            }
        }
    },

    "KANNADA": {
        "name": "Kannada",
        "full_name": "Kannada Language Proficiency Test",
        "description": "Test your Kannada language skills with 100 questions in 2 hours",
        "icon": "https://customer-assets.emergentagent.com/job_examprep-hub-29/artifacts/49xouqbu_Gemini_Generated_Image_y4o4v7y4o4v7y4o4_2-removebg-preview.png",
        "color": "from-blue-400 to-cyan-400",
        "total_questions": 100,
        "duration": "2 hours",
        "category": "Language Proficiency Tests",
        "syllabus_topics": {
            "Language Test": {
                "subjects": {
                    "Gap-fill": {
                        "sub_topics": ["Fill in the blanks", "Complete the sentence"],
                        "questions": 35
                    },
                    "Vocabulary Building": {
                        "sub_topics": ["Synonyms", "Antonyms", "Word meanings"],
                        "questions": 35
                    },
                    "One Word Substitution": {
                        "sub_topics": ["Replace phrases with single words"],
                        "questions": 30
                    }
                }
            }
        }
    },

    "CHINESE": {
        "name": "Chinese",
        "full_name": "Chinese Language Proficiency Test",
        "description": "Test your Chinese language skills with 100 questions in 2 hours",
        "icon": "https://customer-assets.emergentagent.com/job_examprep-hub-29/artifacts/49xouqbu_Gemini_Generated_Image_y4o4v7y4o4v7y4o4_2-removebg-preview.png",
        "color": "from-blue-600 to-indigo-600",
        "total_questions": 100,
        "duration": "2 hours",
        "category": "Language Proficiency Tests",
        "syllabus_topics": {
            "Language Test": {
                "subjects": {
                    "Gap-fill": {
                        "sub_topics": ["Fill in the blanks", "Complete the sentence"],
                        "questions": 35
                    },
                    "Vocabulary Building": {
                        "sub_topics": ["Synonyms", "Antonyms", "Word meanings"],
                        "questions": 35
                    },
                    "One Word Substitution": {
                        "sub_topics": ["Replace phrases with single words"],
                        "questions": 30
                    }
                }
            }
        }
    },

    "JAPANESE": {
        "name": "Japanese",
        "full_name": "Japanese Language Proficiency Test",
        "description": "Test your Japanese language skills with 100 questions in 2 hours",
        "icon": "https://customer-assets.emergentagent.com/job_examprep-hub-29/artifacts/49xouqbu_Gemini_Generated_Image_y4o4v7y4o4v7y4o4_2-removebg-preview.png",
        "color": "from-sky-600 to-blue-600",
        "total_questions": 100,
        "duration": "2 hours",
        "category": "Language Proficiency Tests",
        "syllabus_topics": {
            "Language Test": {
                "subjects": {
                    "Gap-fill": {
                        "sub_topics": ["Fill in the blanks", "Complete the sentence"],
                        "questions": 35
                    },
                    "Vocabulary Building": {
                        "sub_topics": ["Synonyms", "Antonyms", "Word meanings"],
                        "questions": 35
                    },
                    "One Word Substitution": {
                        "sub_topics": ["Replace phrases with single words"],
                        "questions": 30
                    }
                }
            }
        }
    },

    "KOREAN": {
        "name": "Korean",
        "full_name": "Korean Language Proficiency Test",
        "description": "Test your Korean language skills with 100 questions in 2 hours",
        "icon": "https://customer-assets.emergentagent.com/job_examprep-hub-29/artifacts/49xouqbu_Gemini_Generated_Image_y4o4v7y4o4v7y4o4_2-removebg-preview.png",
        "color": "from-cyan-600 to-sky-600",
        "total_questions": 100,
        "duration": "2 hours",
        "category": "Language Proficiency Tests",
        "syllabus_topics": {
            "Language Test": {
                "subjects": {
                    "Gap-fill": {
                        "sub_topics": ["Fill in the blanks", "Complete the sentence"],
                        "questions": 35
                    },
                    "Vocabulary Building": {
                        "sub_topics": ["Synonyms", "Antonyms", "Word meanings"],
                        "questions": 35
                    },
                    "One Word Substitution": {
                        "sub_topics": ["Replace phrases with single words"],
                        "questions": 30
                    }
                }
            }
        }
    },
    "RRB_NTPC": {
        "name": "RRB NTPC",
        "full_name": "Railway Recruitment Board - Non-Technical Popular Categories",
        "description": "Railway recruitment exam for non-technical posts like Station Master, Goods Guard, Commercial cum Ticket Clerk",
        "icon": "🚂",
        "color": "from-blue-600 to-purple-700",
        "total_questions": 100,
        "duration": "90 minutes",
        "category": "Government Jobs",
        "syllabus_topics": {
            "General Awareness": {
                "subjects": {
                    "Current Affairs": {
                        "sub_topics": ["National News", "International News", "Economy News", "Sports News"],
                        "questions": 50
                    },
                    "Static GK": {
                        "sub_topics": ["Books and Authors", "Awards", "Sports", "Capitals", "Important Days"],
                        "questions": 50
                    },
                    "Banking Awareness": {
                        "sub_topics": ["Banking Terms", "RBI Functions", "Monetary Policy", "Banking News"],
                        "questions": 50
                    },
                    "Economics": {
                        "sub_topics": ["Indian Economy", "Economic Terms", "Budget", "GDP"],
                        "questions": 50
                    }
                }
            },
            "Mathematics": {
                "subjects": {
                    "Algebra": {
                        "sub_topics": ["Linear Equations", "Quadratic Equations"],
                        "questions": 35
                    },
                    "Calculus": {
                        "sub_topics": ["Differentiation", "Integration", "Limits"],
                        "questions": 35
                    },
                    "Coordinate Geometry": {
                        "sub_topics": ["Lines", "Circles", "Parabola"],
                        "questions": 30
                    },
                    "Trigonometry": {
                        "sub_topics": ["Trigonometric Ratios", "Identities", "Heights and Distances"],
                        "questions": 30
                    },
                    "Statistics": {
                        "sub_topics": ["Mean", "Median", "Mode", "Standard Deviation"],
                        "questions": 30
                    },
                    "Probability": {
                        "sub_topics": ["Basic Probability", "Conditional Probability", "Bayes Theorem"],
                        "questions": 30
                    },
                    "Vectors": {
                        "sub_topics": ["Vector Operations", "Dot Product", "Cross Product"],
                        "questions": 30
                    },
                    "Differential Equations": {
                        "sub_topics": ["First Order", "Second Order", "Linear Equations"],
                        "questions": 30
                    }
                }
            },
            "General Intelligence": {
                "subjects": {
                    "Verbal Reasoning": {
                        "sub_topics": ["Analogies", "Classification", "Series", "Coding-Decoding", "Blood Relations", "Direction Sense"],
                        "questions": 35
                    },
                    "Non-Verbal Reasoning": {
                        "sub_topics": ["Pattern Recognition", "Figure Series", "Mirror Images", "Paper Folding"],
                        "questions": 30
                    },
                    "Analytical Reasoning": {
                        "sub_topics": ["Logical Deductions", "Statement Arguments", "Assumptions", "Courses of Action"],
                        "questions": 25
                    }
                }
            }
        }
    },
    "AFCAT": {
        "name": "AFCAT",
        "full_name": "Air Force Common Admission Test",
        "description": "Indian Air Force entrance exam for Flying and Ground Duty (Technical & Non-Technical) branches",
        "icon": "✈️",
        "color": "from-sky-500 to-indigo-700",
        "total_questions": 100,
        "duration": "120 minutes",
        "category": "Defence Exams",
        "syllabus_topics": {
            "English": {
                "subjects": {
                    "Reading Comprehension": {
                        "sub_topics": ["Passage Reading", "Inference Questions", "Main Idea", "Vocabulary in Context"],
                        "questions": 90
                    },
                    "Vocabulary": {
                        "sub_topics": ["Synonyms", "Antonyms", "Idioms and Phrases", "One Word Substitution"],
                        "questions": 90
                    },
                    "Grammar": {
                        "sub_topics": ["Tenses", "Articles", "Prepositions", "Active Passive Voice", "Error Detection", "Sentence Improvement"],
                        "questions": 90
                    },
                    "Error Detection": {
                        "sub_topics": ["Grammatical Errors", "Spelling Errors", "Punctuation Errors"],
                        "questions": 90
                    },
                    "Sentence Improvement": {
                        "sub_topics": ["Sentence Correction", "Phrase Replacement", "Sentence Completion"],
                        "questions": 90
                    }
                }
            },
            "General Awareness": {
                "subjects": {
                    "Current Affairs": {
                        "sub_topics": ["National News", "International News", "Economy News", "Sports News"],
                        "questions": 75
                    },
                    "Static GK": {
                        "sub_topics": ["Books and Authors", "Awards", "Sports", "Capitals", "Important Days"],
                        "questions": 75
                    },
                    "Banking Awareness": {
                        "sub_topics": ["Banking Terms", "RBI Functions", "Monetary Policy", "Banking News"],
                        "questions": 75
                    },
                    "Economics": {
                        "sub_topics": ["Indian Economy", "Economic Terms", "Budget", "GDP"],
                        "questions": 75
                    }
                }
            },
            "Numerical Ability": {
                "subjects": {
                    "Arithmetic": {
                        "sub_topics": ["Number System", "Percentage", "Profit Loss", "Simple Interest", "Compound Interest", "Time Work", "Time Speed Distance", "Ratio Proportion", "Average", "Mixture Alligation"],
                        "questions": 60
                    },
                    "Algebra": {
                        "sub_topics": ["Linear Equations", "Quadratic Equations"],
                        "questions": 60
                    },
                    "Mensuration": {
                        "sub_topics": ["Area", "Perimeter", "Volume", "Surface Area", "Height and Distance"],
                        "questions": 60
                    },
                    "Data Interpretation": {
                        "sub_topics": ["Tables", "Graphs", "Charts"],
                        "questions": 60
                    }
                }
            },
            "Reasoning & Military Aptitude": {
                "subjects": {
                    "Verbal Reasoning": {
                        "sub_topics": ["Analogies", "Classification", "Series", "Coding-Decoding", "Blood Relations", "Direction Sense"],
                        "questions": 75
                    },
                    "Non-Verbal Reasoning": {
                        "sub_topics": ["Pattern Recognition", "Figure Series", "Mirror Images", "Paper Folding"],
                        "questions": 75
                    },
                    "Spatial Ability": {
                        "sub_topics": ["Figure Series", "Paper Folding", "Mirror Images", "Water Images", "Embedded Figures"],
                        "questions": 75
                    },
                    "Military Aptitude": {
                        "sub_topics": ["Logical Reasoning", "Critical Thinking", "Decision Making", "Problem Solving"],
                        "questions": 75
                    }
                }
            }
        }
    }

}



def get_all_exams():
    """Get list of all exams"""
    return [
        {
            "id": exam_id,
            "name": data["name"],
            "full_name": data["full_name"],
            "description": data["description"],
            "icon": data["icon"],
            "color": data["color"],
            "total_questions": data["total_questions"],
            "duration": data["duration"],
            "syllabus_topics": list(data["syllabus_topics"].keys()),
            "category": data.get("category", "Other")
        }
        for exam_id, data in EXAM_DATA.items()
    ]


def get_exam_details(exam_id):
    """Get complete details of an exam"""
    if exam_id not in EXAM_DATA:
        return None
    return EXAM_DATA[exam_id]


def get_syllabus_topics(exam_id):
    """Get all syllabus topics for an exam (what was previously called subjects)"""
    if exam_id not in EXAM_DATA:
        return []
    return list(EXAM_DATA[exam_id]["syllabus_topics"].keys())


def get_exam_subjects(exam_id):
    """Alias for backwards compatibility - returns syllabus topics"""
    return get_syllabus_topics(exam_id)


def get_topic_subjects(exam_id, syllabus_topic):
    """Get all subjects for a syllabus topic (what was previously called topics)"""
    if exam_id not in EXAM_DATA:
        return []
    if syllabus_topic not in EXAM_DATA[exam_id]["syllabus_topics"]:
        return []
    
    subjects = EXAM_DATA[exam_id]["syllabus_topics"][syllabus_topic]["subjects"]
    return [
        {
            "name": subject_name,
            "sub_topics": subject_data["sub_topics"],
            "questions": subject_data["questions"]
        }
        for subject_name, subject_data in subjects.items()
    ]


def get_subject_topics(exam_id, syllabus_topic):
    """Alias for backwards compatibility"""
    return get_topic_subjects(exam_id, syllabus_topic)


def get_all_topics_flat(exam_id):
    """Get all subjects across all syllabus topics in flat structure"""
    if exam_id not in EXAM_DATA:
        return []
    
    all_subjects = []
    for syllabus_topic, syllabus_topic_data in EXAM_DATA[exam_id]["syllabus_topics"].items():
        for subject_name, subject_data in syllabus_topic_data["subjects"].items():
            all_subjects.append({
                "syllabus_topic": syllabus_topic,
                "subject": subject_name,
                "sub_topics": subject_data["sub_topics"],
                "questions": subject_data["questions"]
            })
    return all_subjects
