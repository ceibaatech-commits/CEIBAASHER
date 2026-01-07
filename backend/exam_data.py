# ══════════════════════════════════════════════════════════════════════════════
# 📋 CEIBAA EXAM DATA - SINGLE SOURCE OF TRUTH
# ══════════════════════════════════════════════════════════════════════════════
#
# HOW TO ADD A NEW EXAM:
# 
# 1. Add your exam entry below following the structure:
#    "EXAM_ID": {
#        "name": "Display Name",
#        "full_name": "Full Official Name",
#        "description": "Brief description",
#        "icon": "URL or emoji",
#        "color": "from-color-500 to-color-600",  # Tailwind gradient
#        "total_questions": 100,
#        "duration": "3 hours",
#        "category": "Category Name",  # IMPORTANT: Must match frontend category
#        "syllabus_topics": {
#            "Topic 1": {
#                "subjects": {
#                    "Subject 1": {
#                        "sub_topics": ["Sub Topic 1", "Sub Topic 2"],
#                        "questions": 10
#                    }
#                }
#            }
#        }
#    }
#
# 2. EXISTING CATEGORIES (use these for auto-display on homepage):
#    - "Admission Tests"
#    - "Medical Entrance" / "Medical"
#    - "Defence" / "Defence Examinations"
#    - "Banking Examinations"
#    - "Teaching Examinations"
#    - "SSC Examinations"
#    - "UPSC Examinations"
#    - "RSMSSB Examinations"
#    - "Language Proficiency Tests" / "Language Games"
#
# 3. If using a NEW category, also update:
#    - /app/frontend/src/pages/Home.js (add category to 'categories' array)
#    - /app/frontend/src/pages/Home.js (add desktop section for new category)
#
# 4. Admin Panel auto-loads from this file via /api/exam-metadata endpoint
#
# ══════════════════════════════════════════════════════════════════════════════

EXAM_DATA = {
    "JEE": {
        "name": "JEE Main",
        "full_name": "Joint Entrance Examination - Main",
        "description": "Engineering entrance exam for IITs, NITs, and premier engineering institutes",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/tlt2dw8j_Gemini_Generated_Image_8fhn578fhn578fhn_2-removebg-preview.png",
        "color": "from-blue-500 to-indigo-600",
        "total_questions": 90,
        "duration": "3 hours",
        "category": "Admission Tests",
        "syllabus_topics": {
            "Physics": {
                "subjects": {
                    "Mechanics": {
                        "sub_topics": ["Kinematics", "Laws of Motion", "Work/Energy/Power", "Rotational Motion", "Gravitation", "Oscillations", "SHM"],
                        "questions": 8
                    },
                    "Thermodynamics & Waves": {
                        "sub_topics": ["Thermal Properties of Matter", "Kinetic Theory of Gases", "Thermodynamics", "Waves and Sound", "Simple Harmonic Motion"],
                        "questions": 7
                    },
                    "E&M & Optics": {
                        "sub_topics": ["Electrostatics", "Current Electricity", "Magnetism (Moving Charges and Matter)", "EMI", "AC", "Ray Optics", "Wave Optics"],
                        "questions": 10
                    },
                    "Modern Physics": {
                        "sub_topics": ["Dual Nature of Radiation/Matter", "Atoms", "Nuclei", "Semiconductor Electronics", "Communication Systems"],
                        "questions": 5
                    }
                }
            },
            "Chemistry": {
                "subjects": {
                    "Physical Chemistry": {
                        "sub_topics": ["Atomic Structure", "Chemical Bonding", "States of Matter", "Thermodynamics", "Equilibrium", "Solutions", "Electrochemistry", "Chemical Kinetics"],
                        "questions": 10
                    },
                    "Inorganic Chemistry": {
                        "sub_topics": ["Classification of Elements (Periodicity)", "s-Block", "p-Block", "d- and f-Block Elements", "Coordination Compounds"],
                        "questions": 10
                    },
                    "Organic Chemistry": {
                        "sub_topics": ["Basic Principles", "Hydrocarbons", "Haloalkanes/Haloarenes", "Alcohols/Phenols/Ethers", "Aldehydes/Ketones/Carboxylic Acids", "Amines", "Biomolecules"],
                        "questions": 10
                    }
                }
            },
            "Mathematics": {
                "subjects": {
                    "Algebra": {
                        "sub_topics": ["Sets/Relations/Functions", "Complex Numbers", "Quadratic Equations", "Sequences & Series", "Permutations & Combinations", "Binomial Theorem", "Matrices & Determinants"],
                        "questions": 8
                    },
                    "Calculus": {
                        "sub_topics": ["Limits", "Continuity & Differentiability", "Application of Derivatives", "Indefinite/Definite Integration", "Application of Integrals", "Differential Equations"],
                        "questions": 8
                    },
                    "Coordinate Geometry": {
                        "sub_topics": ["Straight Lines", "Circles", "Conic Sections (Parabola, Ellipse, Hyperbola)", "3D Geometry"],
                        "questions": 7
                    },
                    "Statistics & Probability": {
                        "sub_topics": ["Statistics", "Probability", "Vector Algebra", "Mathematical Reasoning"],
                        "questions": 7
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
                        "sub_topics": ["Atomic Structure", "Chemical Bonding", "States of Matter", "Thermodynamics", "Equilibrium", "Ionic Equilibrium", "Redox Reactions", "Electrochemistry", "Chemical Kinetics", "Surface Chemistry"],
                        "questions": 30
                    },
                    "Organic Chemistry": {
                        "sub_topics": ["Basic Concepts", "Hydrocarbons", "Haloalkanes", "Alcohols Phenols Ethers", "Aldehydes Ketones", "Carboxylic Acids", "Amines", "Biomolecules", "Polymers"],
                        "questions": 35
                    },
                    "Inorganic Chemistry": {
                        "sub_topics": ["Periodic Table", "Chemical Bonding", "Coordination Compounds", "Metallurgy", "p-Block Elements", "d-Block Elements", "f-Block Elements"],
                        "questions": 25
                    }
                }
            },
            "Biology": {
                "subjects": {
                    "Botany": {
                        "sub_topics": ["Plant Physiology", "Plant Anatomy", "Plant Kingdom", "Reproduction in Plants", "Photosynthesis", "Respiration"],
                        "questions": 30
                    },
                    "Zoology": {
                        "sub_topics": ["Animal Kingdom", "Human Anatomy", "Animal Physiology", "Reproduction", "Circulatory System", "Nervous System"],
                        "questions": 30
                    },
                    "Ecology": {
                        "sub_topics": ["Ecosystem", "Biodiversity", "Environmental Issues", "Conservation"],
                        "questions": 15
                    },
                    "Genetics": {
                        "sub_topics": ["Principles of Inheritance", "Molecular Basis", "DNA Replication", "Gene Expression"],
                        "questions": 15
                    },
                    "Evolution": {
                        "sub_topics": ["Origin of Life", "Evolution Theory", "Natural Selection", "Human Evolution"],
                        "questions": 10
                    },
                    "Human Physiology": {
                        "sub_topics": ["Digestion", "Breathing", "Circulation", "Excretion", "Neural Control"],
                        "questions": 20
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
        "category": "Government Jobs",
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
        "category": "RSMSSB Examinations",
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
        "category": "Defence Exams",
        "marks_distribution": {
            "Mathematics": 300,
            "General Ability Test": 600
        },
        "syllabus_topics": {
            "Mathematics (300 Marks)": {
                "subjects": {
                    "Algebra": {
                        "sub_topics": [
                            "Basic Operations",
                            "Statements & Logical Operations",
                            "Venn Diagrams",
                            "Real Numbers (Rational & Irrational)",
                            "Complex Numbers (Modulus, Argument, Algebra)",
                            "Square Roots of Complex Numbers",
                            "Quadratic Equations (Solution, Nature of Roots)",
                            "Linear Inequalities",
                            "Set Theory (Union, Intersection, Cartesian Product)",
                            "Functions (Domain, Range, Composite)",
                            "Binary Operations (Types & Properties)",
                            "Matrices & Determinants (Types, Properties, Inverse)",
                            "Permutation & Combination (Basic Formulas)",
                            "Binomial Theorem (General Term, Coefficients)",
                            "Probability (Basic Rules)"
                        ],
                        "questions": 35
                    },
                    "Trigonometry": {
                        "sub_topics": [
                            "Trigonometric Ratios & Identities",
                            "Angles & Their Measures (Degree, Radian)",
                            "Trigonometric Equations",
                            "Inverse Trigonometric Functions",
                            "Height & Distance Problems",
                            "Properties of Triangles (Sine Rule, Cosine Rule, Tangent Rule)"
                        ],
                        "questions": 25
                    },
                    "Analytical Geometry 2D": {
                        "sub_topics": [
                            "Cartesian Coordinate System",
                            "Distance Formula",
                            "Section & Midpoint Formula",
                            "Straight Lines (Slope, Intercepts, Normal Form)",
                            "Angle Between Two Lines",
                            "Circle (Equation, Tangent, Normal)",
                            "Conic Sections (Parabola, Ellipse, Hyperbola)"
                        ],
                        "questions": 25
                    },
                    "Analytical Geometry 3D": {
                        "sub_topics": [
                            "Direction Cosines & Direction Ratios",
                            "Equation of Line in Space",
                            "Angle Between Two Lines",
                            "Equation of Plane",
                            "Distance of Point from Line/Plane"
                        ],
                        "questions": 15
                    },
                    "Differential Calculus": {
                        "sub_topics": [
                            "Concept of Function & Limits",
                            "Continuity & Differentiability",
                            "Derivatives of Standard Functions",
                            "Chain Rule",
                            "Maxima & Minima",
                            "Rolle's Theorem (Simple Applications)",
                            "Lagrange's Theorem (Simple Applications)"
                        ],
                        "questions": 25
                    },
                    "Integral Calculus & Differential Equations": {
                        "sub_topics": [
                            "Integration as Inverse Differentiation",
                            "Definite & Indefinite Integrals",
                            "Standard Integrals",
                            "Applications of Integrals (Area Under Curves)",
                            "Differential Equations (First Order, First Degree)",
                            "Variables Separable Method",
                            "Homogeneous Differential Equations"
                        ],
                        "questions": 25
                    },
                    "Vector Algebra": {
                        "sub_topics": [
                            "Magnitude & Direction of Vectors",
                            "Addition & Subtraction of Vectors",
                            "Scalar Product (Dot Product)",
                            "Vector Product (Cross Product)"
                        ],
                        "questions": 15
                    },
                    "Statistics & Probability": {
                        "sub_topics": [
                            "Data Types",
                            "Measures of Central Tendency (Mean, Median, Mode)",
                            "Measures of Dispersion (Variance, Standard Deviation)",
                            "Correlation & Regression (Basic)",
                            "Probability Rules & Theorems"
                        ],
                        "questions": 15
                    }
                }
            },
            "General Ability Test - GAT (600 Marks)": {
                "subjects": {
                    "English (200 Marks)": {
                        "sub_topics": [
                            "Grammar & Usage",
                            "Vocabulary",
                            "Comprehension",
                            "Sentence Improvement",
                            "Spotting Errors",
                            "Para-Jumbles",
                            "Synonyms & Antonyms",
                            "Idioms & Phrases"
                        ],
                        "questions": 50
                    },
                    "Physics": {
                        "sub_topics": [
                            "Motion, Force, Work, Energy",
                            "Gravitation",
                            "Heat & Thermodynamics",
                            "Sound",
                            "Light (Reflection, Refraction)",
                            "Electricity & Magnetism",
                            "Modern Physics (Atoms, Nuclei, Radioactivity)"
                        ],
                        "questions": 25
                    },
                    "Chemistry": {
                        "sub_topics": [
                            "Basic Concepts of Chemistry",
                            "Atomic Structure",
                            "Chemical Bonding",
                            "Acids, Bases & Salts",
                            "Metals & Non-Metals",
                            "Carbon & its Compounds",
                            "Industrial Chemistry",
                            "Environmental Chemistry"
                        ],
                        "questions": 25
                    },
                    "General Science (Biology)": {
                        "sub_topics": [
                            "Cell Structure & Functions",
                            "Tissues",
                            "Human Body Systems",
                            "Nutrition",
                            "Diseases & Prevention",
                            "Food & Resources",
                            "Biotechnology (Basics)"
                        ],
                        "questions": 20
                    },
                    "History": {
                        "sub_topics": [
                            "Ancient India",
                            "Medieval India",
                            "Modern India",
                            "Indian National Movement",
                            "Indian Freedom Struggle",
                            "Constitution Formation"
                        ],
                        "questions": 25
                    },
                    "Geography": {
                        "sub_topics": [
                            "Earth & Its Structure",
                            "Climate & Weather",
                            "Latitudes & Longitudes",
                            "Types of Soils",
                            "Agriculture in India",
                            "Water Resources",
                            "Minerals & Industries"
                        ],
                        "questions": 20
                    },
                    "Current Affairs": {
                        "sub_topics": [
                            "National Events",
                            "International Events",
                            "Defence News",
                            "Sports & Awards",
                            "Government Schemes"
                        ],
                        "questions": 15
                    },
                    "Polity": {
                        "sub_topics": [
                            "Constitution of India",
                            "Fundamental Rights & Duties",
                            "Parliament & Judiciary",
                            "Panchayati Raj",
                            "Executive & Legislative Systems"
                        ],
                        "questions": 20
                    },
                    "Economics": {
                        "sub_topics": [
                            "Basic Economic Concepts",
                            "Indian Economy",
                            "Budget & Taxation",
                            "Economic Growth & Development"
                        ],
                        "questions": 15
                    }
                }
            }
        }
    },
    "Agniveer": {
        "name": "Tradesman Agniveer",
        "full_name": "Indian Army Tradesman Agniveer",
        "description": "Indian Army recruitment for Soldier Tradesman",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/5ssemynn_IMG_1343.png",
        "color": "from-green-600 to-teal-700",
        "total_questions": 50,
        "total_marks": 100,
        "duration": "1 hour",
        "category": "Defence Exams",
        "negative_marking": "No negative marking",
        "marks_per_question": 2,
        "exam_type": "Objective Type Questions",
        "syllabus_topics": {
            "General Knowledge (30 Marks)": {
                "subjects": {
                    "India and Its Neighboring Countries": {
                        "sub_topics": [
                            "History of India and neighboring countries",
                            "Culture and traditions",
                            "Geography of India and neighboring countries",
                            "Important figures and leaders"
                        ],
                        "questions": 2
                    },
                    "Abbreviations": {
                        "sub_topics": [
                            "Common abbreviations and their meanings",
                            "National and international organization abbreviations"
                        ],
                        "questions": 1
                    },
                    "Sports": {
                        "sub_topics": [
                            "Major sports events",
                            "Sports awards and achievements",
                            "National and international sports records",
                            "Indian sports personalities"
                        ],
                        "questions": 2
                    },
                    "Awards and Prizes": {
                        "sub_topics": [
                            "National awards (Bharat Ratna, Padma awards)",
                            "International awards (Nobel Prize, etc.)",
                            "Military awards and decorations",
                            "Significance and history of awards"
                        ],
                        "questions": 1
                    },
                    "Terminology": {
                        "sub_topics": [
                            "Important terms from various fields",
                            "Military terminology",
                            "Scientific and technical terms"
                        ],
                        "questions": 1
                    },
                    "Indian Armed Forces": {
                        "sub_topics": [
                            "Structure of Indian Armed Forces",
                            "History and establishment",
                            "Ranks and hierarchy",
                            "Role and significance in national defense"
                        ],
                        "questions": 2
                    },
                    "Continents and Subcontinents": {
                        "sub_topics": [
                            "Knowledge of continents and their features",
                            "Countries and their capitals",
                            "Major geographical divisions",
                            "Important rivers, mountains, and landmarks"
                        ],
                        "questions": 1
                    },
                    "Inventions and Discoveries": {
                        "sub_topics": [
                            "Important inventions and discoveries",
                            "Indian contributions to science",
                            "Scientists and inventors",
                            "Historical timeline of discoveries"
                        ],
                        "questions": 1
                    },
                    "The Constitution of India": {
                        "sub_topics": [
                            "Key features of the Constitution",
                            "Fundamental Rights",
                            "Fundamental Duties",
                            "Directive Principles of State Policy"
                        ],
                        "questions": 1
                    },
                    "International Organizations": {
                        "sub_topics": [
                            "Role and importance of UN, WHO, UNESCO",
                            "International peacekeeping organizations",
                            "Economic organizations (IMF, World Bank)",
                            "Regional organizations (SAARC, ASEAN)"
                        ],
                        "questions": 1
                    },
                    "Books and Authors": {
                        "sub_topics": [
                            "Famous books and their authors",
                            "Indian literary works",
                            "Global literary contributions",
                            "Award-winning books"
                        ],
                        "questions": 1
                    },
                    "Knowledge of Important Events": {
                        "sub_topics": [
                            "Major historical events in India",
                            "World historical events",
                            "Independence movement milestones",
                            "Recent significant events"
                        ],
                        "questions": 1
                    },
                    "Current Important World Events": {
                        "sub_topics": [
                            "Ongoing political events",
                            "Economic developments",
                            "Scientific and technological advancements",
                            "International relations"
                        ],
                        "questions": 1
                    },
                    "Prominent Personalities": {
                        "sub_topics": [
                            "Famous personalities from India",
                            "Global leaders and achievers",
                            "Military heroes and martyrs",
                            "Contributions to nation-building"
                        ],
                        "questions": 1
                    }
                }
            },
            "Logical Reasoning (10 Marks)": {
                "subjects": {
                    "Logical Ability": {
                        "sub_topics": [
                            "Logical thinking and pattern recognition",
                            "Problem-solving ability",
                            "Analytical reasoning",
                            "Sequence and series",
                            "Coding-decoding",
                            "Blood relations",
                            "Direction sense",
                            "Puzzles and arrangements"
                        ],
                        "questions": 5
                    }
                }
            },
            "Mathematics (30 Marks)": {
                "subjects": {
                    "Number Systems": {
                        "sub_topics": [
                            "Whole numbers",
                            "Decimal and fractions",
                            "Relationship between numbers",
                            "Types of numbers (prime, composite, odd, even)"
                        ],
                        "questions": 2
                    },
                    "Fundamental Arithmetical Operations": {
                        "sub_topics": [
                            "HCF and LCM",
                            "Decimal fraction",
                            "Percentages",
                            "Ratio and Proportion",
                            "Square roots",
                            "Averages",
                            "Simple Interest and Compound Interest",
                            "Profit and Loss",
                            "Discount",
                            "Partnership Business",
                            "Time and Distance",
                            "Time and Work"
                        ],
                        "questions": 8
                    },
                    "Algebra": {
                        "sub_topics": [
                            "Basic algebraic problems",
                            "Linear equations",
                            "Quadratic equations",
                            "Algebraic identities",
                            "Factorization"
                        ],
                        "questions": 2
                    },
                    "Geometry": {
                        "sub_topics": [
                            "Elementary geometric figures",
                            "Properties of triangles",
                            "Properties of quadrilaterals",
                            "Properties of circles",
                            "Geometric facts and theorems"
                        ],
                        "questions": 1
                    },
                    "Mensuration": {
                        "sub_topics": [
                            "Area of triangles",
                            "Perimeter of triangles",
                            "Area and perimeter of quadrilaterals",
                            "Area and perimeter of polygons",
                            "Area and circumference of circles"
                        ],
                        "questions": 1
                    },
                    "Trigonometry": {
                        "sub_topics": [
                            "Trigonometric ratios",
                            "Complementary angles",
                            "Height and distance problems",
                            "Basic trigonometric identities"
                        ],
                        "questions": 1
                    }
                }
            },
            "General Science (30 Marks)": {
                "subjects": {
                    "Physics and Chemistry": {
                        "sub_topics": [
                            "Fundamental concepts of physics",
                            "Laws of motion",
                            "Force, energy, and power",
                            "Heat and temperature",
                            "Light and sound",
                            "Electricity and magnetism",
                            "Basic concepts of chemistry",
                            "Elements, compounds, and mixtures",
                            "Chemical reactions",
                            "Acids, bases, and salts",
                            "Day-to-day applications of physics and chemistry"
                        ],
                        "questions": 8
                    },
                    "Biology": {
                        "sub_topics": [
                            "Difference between living and non-living things",
                            "Cells - structure and functions",
                            "Tissues - types and functions",
                            "Growth and reproduction in plants",
                            "Growth and reproduction in animals",
                            "Basic human body knowledge",
                            "Human body systems (digestive, respiratory, circulatory)",
                            "Common diseases and their causes",
                            "Disease prevention methods",
                            "Nutrition and balanced diet",
                            "Vitamins and minerals"
                        ],
                        "questions": 7
                    }
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
        "category": "Defence Exams",
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
        "category": "Defence Exams",
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
        "description": "National level engineering entrance exam for M.Tech, PSU recruitment (Syllabus varies by paper; CSE as example)",
        "icon": "https://customer-assets.emergentagent.com/job_prepninja-exams/artifacts/9pbxgmoq_Gemini_Generated_Image_1zgyxl1zgyxl1zgy_2-removebg-preview.png",
        "color": "from-purple-600 to-blue-600",
        "total_questions": 65,
        "duration": "3 hours",
        "category": "Admission Tests",
        "syllabus_topics": {
            "General Aptitude (GA)": {
                "subjects": {
                    "Verbal Ability": {
                        "sub_topics": ["English Grammar", "Vocabulary", "Reading Comprehension", "Verbal Analogies"],
                        "questions": 10
                    },
                    "Quantitative Aptitude": {
                        "sub_topics": ["Numerical Computation", "Data Interpretation (Graphs, Charts)", "Quantitative Reasoning"],
                        "questions": 10
                    }
                }
            },
            "Engineering Mathematics": {
                "subjects": {
                    "Discrete Mathematics": {
                        "sub_topics": ["Propositional/First-Order Logic", "Sets, Relations, Functions", "Graph Theory", "Combinatorics"],
                        "questions": 7
                    },
                    "Linear Algebra & Calculus": {
                        "sub_topics": ["Matrices", "Determinants", "Eigenvalues/Eigenvectors", "Limits", "Continuity", "Differentiation", "Integration"],
                        "questions": 10
                    },
                    "Probability & Statistics": {
                        "sub_topics": ["Random Variables", "Distributions (Uniform, Normal, Poisson, Binomial)", "Mean, Median, Mode", "Bayes' Theorem"],
                        "questions": 6
                    }
                }
            },
            "Core Subject (e.g., CSE)": {
                "subjects": {
                    "Computer Org. & Architecture": {
                        "sub_topics": ["Machine Instructions", "ALU", "Data Path", "Control Unit", "Pipelining", "Memory Hierarchy (Cache, Main Memory)"],
                        "questions": 8
                    },
                    "Programming & DS": {
                        "sub_topics": ["C Programming", "Recursion", "Arrays", "Stacks", "Queues", "Linked Lists", "Trees", "Binary Search Trees", "Graphs"],
                        "questions": 8
                    },
                    "Algorithms": {
                        "sub_topics": ["Searching", "Sorting", "Hashing", "Time & Space Complexity", "Algorithm Design Techniques (Greedy, Dynamic, Divide-and-Conquer)"],
                        "questions": 8
                    },
                    "Operating System": {
                        "sub_topics": ["System Calls", "Processes", "Threads", "Concurrency", "Synchronization", "Deadlock", "CPU Scheduling", "Memory Management", "File Systems"],
                        "questions": 8
                    }
                }
            }
        }
    },
    
    "CUET": {
        "name": "CUET UG",
        "full_name": "Common University Entrance Test - Undergraduate",
        "description": "National level entrance exam for undergraduate programs in central universities",
        "icon": "https://customer-assets.emergentagent.com/job_prepninja-exams/artifacts/9pbxgmoq_Gemini_Generated_Image_1zgyxl1zgyxl1zgy_2-removebg-preview.png",
        "color": "from-green-600 to-teal-600",
        "total_questions": 200,
        "duration": "3 hours",
        "category": "Admission Tests",
        "syllabus_topics": {
            "Section I: Languages": {
                "subjects": {
                    "Reading Comprehension": {
                        "sub_topics": ["Factual, Literary, and Narrative Passages (Testing Central Theme, Vocabulary, Tone)"],
                        "questions": 25
                    },
                    "Language Proficiency": {
                        "sub_topics": ["Verbal Ability", "Grammar (Tenses, Parts of Speech)", "Vocabulary (Synonyms, Antonyms)", "Error Spotting"],
                        "questions": 25
                    }
                }
            },
            "Section II: Domain Subjects": {
                "subjects": {
                    "Subject Specific": {
                        "sub_topics": ["Subject syllabi are strictly based on the Class 12 NCERT syllabus only (e.g., Physics, History, Accountancy, Psychology, etc.)"],
                        "questions": 50
                    }
                }
            },
            "Section III: General Test": {
                "subjects": {
                    "General Awareness & CA": {
                        "sub_topics": ["General Knowledge", "Current Affairs (National & International)"],
                        "questions": 40
                    },
                    "Reasoning & Mental Ability": {
                        "sub_topics": ["General Mental Ability", "Logical & Analytical Reasoning"],
                        "questions": 40
                    },
                    "Quantitative Reasoning": {
                        "sub_topics": ["Numerical Ability", "Quantitative Reasoning (Arithmetic, Algebra, Geometry, Mensuration up to Grade 8)"],
                        "questions": 40
                    }
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
            "Verbal Ability & RC (VARC)": {
                "subjects": {
                    "Reading Comprehension": {
                        "sub_topics": ["Passages (Philosophy, Science, Economics, History) followed by questions on Main Idea, Tone, Inference, Structure"],
                        "questions": 18
                    },
                    "Verbal Ability (VA)": {
                        "sub_topics": ["Para Jumbles (Ordering Sentences)", "Para Summary", "Odd Sentence Out (Critical Reasoning elements)"],
                        "questions": 6
                    }
                }
            },
            "Data Interpretation & LR (DILR)": {
                "subjects": {
                    "Data Interpretation (DI)": {
                        "sub_topics": ["Caselets (Text-based)", "Tables", "Charts (Bar, Line, Pie)", "Venn Diagrams (Set Theory)", "Analytical Puzzle-based DI"],
                        "questions": 10
                    },
                    "Logical Reasoning (LR)": {
                        "sub_topics": ["Seating Arrangements", "Puzzles (Scheduling, Distribution)", "Blood Relations", "Series", "Critical Reasoning (Inference, Assumption, Conclusion)"],
                        "questions": 10
                    }
                }
            },
            "Quantitative Aptitude (QA)": {
                "subjects": {
                    "Arithmetic": {
                        "sub_topics": ["Percentage", "Profit/Loss", "Ratio/Proportion", "Average/Mixtures", "Time/Speed/Distance", "Time & Work", "Simple/Compound Interest"],
                        "questions": 10
                    },
                    "Algebra": {
                        "sub_topics": ["Linear/Quadratic Equations", "Inequalities", "Functions/Graphs", "Logarithms", "Progressions (AP, GP, HP)", "Sequences & Series"],
                        "questions": 6
                    },
                    "Geometry & Mensuration": {
                        "sub_topics": ["Lines/Angles", "Triangles", "Circles", "Polygons", "Coordinate Geometry", "Mensuration (Area/Volume of 2D & 3D Shapes)"],
                        "questions": 6
                    },
                    "Modern Math": {
                        "sub_topics": ["Permutations & Combinations (P&C)", "Probability", "Set Theory"],
                        "questions": 3
                    },
                    "Number System": {
                        "sub_topics": ["Divisibility Rules", "HCF/LCM", "Remainders", "Factorials"],
                        "questions": 3
                    }
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
                    "Reading Comprehension": {
                        "sub_topics": ["Passages (~450 words) followed by questions on Main Idea, Vocabulary, Grammar, Inference"],
                        "questions": 20
                    },
                    "Vocabulary & Grammar": {
                        "sub_topics": ["Synonyms", "Antonyms", "Error Detection", "Sentence Correction", "Tenses", "Parts of Speech"],
                        "questions": 8
                    }
                }
            },
            "Current Affairs & GK": {
                "subjects": {
                    "Current Affairs": {
                        "sub_topics": ["National and International events (last 9-12 months)", "Summits", "Reports", "Awards"],
                        "questions": 20
                    },
                    "Static GK": {
                        "sub_topics": ["Constitution of India", "Basic Economics", "History (Freedom Struggle)", "Art & Culture"],
                        "questions": 10
                    }
                }
            },
            "Legal Reasoning": {
                "subjects": {
                    "Legal Principles": {
                        "sub_topics": ["Application of legal principles to factual scenarios (Torts, Contracts, Criminal Law, Family Law, Constitutional Law)"],
                        "questions": 25
                    },
                    "Case Law & Policy": {
                        "sub_topics": ["Awareness of important contemporary legal and public policy issues", "major Supreme Court judgments"],
                        "questions": 5
                    }
                }
            },
            "Logical Reasoning": {
                "subjects": {
                    "Critical Reasoning": {
                        "sub_topics": ["Identifying Argument Structure", "Premise", "Conclusion", "Inference", "Strengthening/Weakening Arguments"],
                        "questions": 15
                    },
                    "Analytical Reasoning": {
                        "sub_topics": ["Syllogisms", "Sequences", "Analogies", "Puzzles", "Blood Relations"],
                        "questions": 7
                    }
                }
            },
            "Quantitative Techniques": {
                "subjects": {
                    "Data Interpretation": {
                        "sub_topics": ["Sets of Facts", "Graphs", "Diagrams (Testing Class 10th level Maths application)"],
                        "questions": 6
                    },
                    "Basic Arithmetic": {
                        "sub_topics": ["Ratios", "Percentages", "Averages", "P&L", "Interest", "Time/Speed/Distance"],
                        "questions": 4
                    }
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
            "Drawing & Composition": {
                "subjects": {
                    "Composition & Sketching": {
                        "sub_topics": ["Visualizing and sketching scenes (Daily life, Urban scape)", "Creative Composition", "Proportion & Scale (Human/Building)"],
                        "questions": 40
                    },
                    "Spatial Visualization": {
                        "sub_topics": ["Perspective Drawing (One-point, Two-point)", "3D Visualization of Objects", "Memory Drawing", "Understanding Light and Shadow"],
                        "questions": 40
                    }
                }
            },
            "General Aptitude": {
                "subjects": {
                    "Spatial Reasoning": {
                        "sub_topics": ["Mental Rotation", "Pattern Recognition", "Visualizing different sides of 3D objects", "Logical Reasoning using Diagrams"],
                        "questions": 20
                    },
                    "Architectural Awareness": {
                        "sub_topics": ["General Knowledge of Famous Architects", "Buildings (National/International)", "Building Materials", "Aesthetic Sensitivity", "Colour Theory"],
                        "questions": 15
                    }
                }
            },
            "Mathematics & Physics": {
                "subjects": {
                    "Mathematics": {
                        "sub_topics": ["Algebra", "Trigonometry (Identities, Heights & Distances)", "Coordinate Geometry", "3D Geometry", "Mensuration", "Statistics", "Probability"],
                        "questions": 15
                    },
                    "Physics": {
                        "sub_topics": ["Basics of Mechanics (IX-XII level)", "Light", "Electricity", "Heat"],
                        "questions": 15
                    }
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
        "name": "IBPS PO Prelims",
        "full_name": "Institute of Banking Personnel Selection Probationary Officer - Preliminary Exam",
        "description": "Entrance exam for Probationary Officer in public sector banks",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/dgbp1l60_Gemini_Generated_Image_be1xs8be1xs8be1x_2-removebg-preview.png",
        "color": "from-blue-600 to-cyan-600",
        "total_questions": 100,
        "duration": "1 hour",
        "category": "Banking Examinations",
        "syllabus_topics": {
            "Reasoning Ability": {
                "subjects": {
                    "Puzzles & Seating Arrangement": {"sub_topics": ["Floor/Flat Puzzles", "Box Puzzles", "Scheduling (Day Month Year Time-based)", "Category-based", "Circular Seating (Inward/Outward)", "Linear Seating (Single Row & Double Row)", "Square/Rectangular Arrangement", "Uncertain number of people"], "questions": 24},
                    "Logical Deductions": {"sub_topics": ["Syllogism (Including 'Only a Few')", "Possibility cases", "Coded Inequalities (Symbols)", "Data Sufficiency (2 or 3 statements)"], "questions": 8},
                    "Miscellaneous Logic": {"sub_topics": ["Direction Sense", "Blood Relations (Family Tree)", "Blood Relations (Coded)", "Alphanumeric Series", "Order and Ranking", "Coding-Decoding (Simple)", "Coding-Decoding (Fictitious)", "Input-Output"], "questions": 8}
                }
            },
            "Quantitative Aptitude": {
                "subjects": {
                    "Data Interpretation (DI)": {"sub_topics": ["Line Graph", "Bar Graph", "Pie Chart (Single & Multiple)", "Tabular DI", "Mixed Graphs", "Caselet DI (Paragraph based)", "Missing Data DI"], "questions": 14},
                    "Speed & Calculation": {"sub_topics": ["Simplification", "Approximation", "Missing Number Series", "Wrong Number Series", "Quadratic Equations", "Quantity Comparison (Q1 & Q2)"], "questions": 12},
                    "Arithmetic (Word Problems)": {"sub_topics": ["Percentage", "Ratio and Proportion", "Average", "Age Problems", "Profit and Loss", "Simple Interest (SI)", "Compound Interest (CI)", "Time and Work", "Time Speed and Distance", "Pipes and Cisterns", "Boats and Streams", "Probability", "Permutation and Combination", "Mixture and Allegations", "Mensuration (2D & 3D)"], "questions": 15}
                }
            },
            "English Language": {
                "subjects": {
                    "Reading Comprehension (RC)": {"sub_topics": ["Passage comprehension", "Theme detection", "Tone of the Passage", "Inference-based questions", "Vocabulary (Synonyms/Antonyms) from passage"], "questions": 10},
                    "Grammar & Structure": {"sub_topics": ["Error Detection (Spotting Errors)", "Sentence Improvement/Correction", "Phrase Replacement"], "questions": 9},
                    "Vocabulary & Usage": {"sub_topics": ["Cloze Test (Paragraph completion)", "Fillers (Single and Double)", "Word Swap", "Correct Usage of Words", "Para Jumbles (Sentence Rearrangement)"], "questions": 10}
                }
            }
        }
    },
    
    "IBPS_CLERK": {
        "name": "IBPS Clerk Prelims",
        "full_name": "Institute of Banking Personnel Selection Clerical Cadre - Preliminary Exam",
        "description": "Entrance exam for Clerk position in public sector banks",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/dgbp1l60_Gemini_Generated_Image_be1xs8be1xs8be1x_2-removebg-preview.png",
        "color": "from-indigo-600 to-blue-600",
        "total_questions": 100,
        "duration": "1 hour (20 min per section)",
        "category": "Banking Examinations",
        "syllabus_topics": {
            "Numerical Ability": {
                "subjects": {
                    "Speed & Calculation": {"sub_topics": ["Simplification", "Approximation", "Missing Number Series", "Wrong Number Series", "Quadratic Equations", "Quantity Comparison (Q1 & Q2)"], "questions": 18},
                    "Data Interpretation (DI)": {"sub_topics": ["Tabular DI", "Bar Graph", "Line Graph", "Pie Chart"], "questions": 8},
                    "Arithmetic (Word Problems)": {"sub_topics": ["Percentage", "Ratio and Proportion", "Average", "Age Problems", "Profit and Loss", "Simple Interest (SI)", "Compound Interest (CI)", "Time and Work", "Pipes and Cisterns", "Time Speed and Distance", "Boats & Streams", "Mixture and Allegations", "Partnership", "Mensuration"], "questions": 14}
                }
            },
            "Reasoning Ability": {
                "subjects": {
                    "Puzzles & Seating Arrangement": {"sub_topics": ["Floor/Flat Puzzles", "Box Puzzles", "Scheduling (Day/Month/Year)", "Comparison/Ranking", "Designation-based", "Circular Seating", "Linear Seating (Single Row)", "Linear Seating (Double Row)", "Square/Rectangular Arrangement"], "questions": 18},
                    "Logical Deductions": {"sub_topics": ["Syllogism (Including 'Only a Few')", "Inequalities (Direct)", "Inequalities (Coded)", "Data Sufficiency (Two statements)"], "questions": 8},
                    "Miscellaneous Logic": {"sub_topics": ["Direction Sense", "Blood Relations (Family Tree)", "Alphanumeric Series", "Symbolic Series", "Order & Ranking", "Coding-Decoding (Simple)", "Coding-Decoding (Fictitious)"], "questions": 7}
                }
            },
            "English Language": {
                "subjects": {
                    "Reading Comprehension (RC)": {"sub_topics": ["Passage comprehension", "Theme detection", "Vocabulary (Synonyms/Antonyms) from passage"], "questions": 9},
                    "Grammar & Structure": {"sub_topics": ["Error Detection (Spotting Errors)", "Sentence Improvement/Correction", "Phrase Replacement"], "questions": 9},
                    "Vocabulary & Usage": {"sub_topics": ["Cloze Test (Paragraph completion)", "Fillers (Single and Double)", "Word Swap/Usage", "Para Jumbles (Sentence Rearrangement)"], "questions": 12}
                }
            }
        }
    },
    
    "IBPS_SO": {
        "name": "IBPS SO Prelims",
        "full_name": "Institute of Banking Personnel Selection Specialist Officer - Preliminary Exam",
        "description": "Entrance exam for IT, Agricultural, Marketing and other specialist officers",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/dgbp1l60_Gemini_Generated_Image_be1xs8be1xs8be1x_2-removebg-preview.png",
        "color": "from-purple-600 to-indigo-600",
        "total_questions": 150,
        "duration": "2 hours",
        "category": "Banking Examinations",
        "syllabus_topics": {
            "Reasoning": {
                "subjects": {
                    "Puzzles & Seating": {
                        "sub_topics": ["Linear", "Circular", "Box", "Floor"],
                        "questions": 80
                    },
                    "Syllogism": {
                        "sub_topics": ["Basic", "Advanced"],
                        "questions": 10
                    },
                    "Inequality": {
                        "sub_topics": ["Direct", "Coded"],
                        "questions": 10
                    },
                    "Miscellaneous": {
                        "sub_topics": ["Blood Relations", "Direction", "Coding"],
                        "questions": 30
                    }
                }
            },
            "Quantitative Aptitude": {
                "subjects": {
                    "Arithmetic": {
                        "sub_topics": ["P&L", "SI/CI", "Time & Work", "Speed", "Ratio", "Percentage"],
                        "questions": 90
                    },
                    "Data Interpretation": {
                        "sub_topics": ["Table", "Bar", "Line", "Pie Chart"],
                        "questions": 40
                    },
                    "Simplification": {
                        "sub_topics": ["BODMAS", "Approximation"],
                        "questions": 16
                    },
                    "Number Series": {
                        "sub_topics": ["Missing", "Wrong"],
                        "questions": 8
                    },
                    "Quadratic Equations": {
                        "sub_topics": ["Roots"],
                        "questions": 3
                    }
                }
            },
            "English Language": {
                "subjects": {
                    "Vocabulary": {
                        "sub_topics": ["Synonyms", "Antonyms", "Fillers"],
                        "questions": 15
                    },
                    "Reading Comprehension": {
                        "sub_topics": ["Passage Based"],
                        "questions": 10
                    },
                    "Error Spotting": {
                        "sub_topics": ["Grammar"],
                        "questions": 6
                    },
                    "Cloze Test": {
                        "sub_topics": ["Fill Blanks"],
                        "questions": 5
                    },
                    "Para Jumbles": {
                        "sub_topics": ["Rearrangement"],
                        "questions": 4
                    }
                }
            },
            "General Awareness": {
                "subjects": {
                    "Banking Awareness": {
                        "sub_topics": ["RBI Policies", "Banking Terms"],
                        "questions": 30
                    },
                    "Current Affairs": {
                        "sub_topics": ["Last 6 months"],
                        "questions": 25
                    },
                    "Static GK": {
                        "sub_topics": ["Indian Geography", "History"],
                        "questions": 20
                    }
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
        "total_questions": 100,
        "duration": "1 hour",
        "category": "Banking Examinations",
        "syllabus_topics": {
            "Quantitative Aptitude": {
                "subjects": {
                    "Data Interpretation (DI)": {"sub_topics": ["Line Graph", "Bar Graph", "Pie Chart (Single & Double)", "Tabular DI", "Caselet DI (Paragraph based)", "Radar Graph"], "questions": 15},
                    "Calculation Speed": {"sub_topics": ["Simplification", "Approximation", "Missing Number Series", "Wrong Number Series", "Basic Arithmetic Operations"], "questions": 8},
                    "Equations & Relations": {"sub_topics": ["Quadratic Equations", "Quantity Comparison (Q1 & Q2)"], "questions": 5},
                    "Arithmetic (Word Problems)": {"sub_topics": ["Percentage", "Ratio and Proportion", "Average", "Age Problems", "Profit and Loss", "Simple Interest (SI)", "Compound Interest (CI)", "Time and Work", "Time Speed and Distance", "Pipes and Cisterns", "Mixture and Allegations", "Probability", "Permutation and Combination", "Mensuration (2D & 3D)"], "questions": 12}
                }
            },
            "Reasoning Ability": {
                "subjects": {
                    "Puzzles & Arrangements": {"sub_topics": ["Floor/Flat Puzzles", "Scheduling (Day Month Year)", "Box Puzzles", "Categorized Puzzles", "Circular Seating (Inward/Outward)", "Linear Seating (Single Row & Double Row)", "Square/Rectangular Arrangement"], "questions": 22},
                    "Verbal Logic": {"sub_topics": ["Syllogism (Includes 'Only a Few' concept)", "Statement and Assumption"], "questions": 4},
                    "Coded Relations": {"sub_topics": ["Coded Inequalities (Symbols)", "Coding-Decoding (New Pattern)"], "questions": 4},
                    "Non-Verbal/Basic Logic": {"sub_topics": ["Direction Sense", "Blood Relations (Family Tree)", "Order and Ranking", "Alphanumeric Series", "Three-digit/Three-letter based problems"], "questions": 3},
                    "Data Sufficiency": {"sub_topics": ["Two-statement questions"], "questions": 2}
                }
            },
            "English Language": {
                "subjects": {
                    "Reading & Comprehension": {"sub_topics": ["Reading Comprehension (RC) Passage", "Theme Detection", "Tone of the Passage", "Vocabulary-based questions (Synonyms/Antonyms) within RC"], "questions": 9},
                    "Vocabulary & Usage": {"sub_topics": ["Cloze Test (Paragraph completion)", "Fillers (Single and Double)", "Word Swap", "Correct Usage of Words", "Phrasal Verb Usage"], "questions": 7},
                    "Grammar & Errors": {"sub_topics": ["Error Detection (Spotting Errors)", "Sentence Improvement/Correction", "Phrase Replacement"], "questions": 9},
                    "Sentence Structure": {"sub_topics": ["Para Jumbles (Sentence Rearrangement)"], "questions": 5}
                }
            }
        }
    },
    
    "SBI_CLERK": {
        "name": "SBI Clerk Prelims",
        "full_name": "State Bank of India Junior Associate - Preliminary Exam",
        "description": "Entrance exam for Clerical position in SBI",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/dgbp1l60_Gemini_Generated_Image_be1xs8be1xs8be1x_2-removebg-preview.png",
        "color": "from-teal-500 to-cyan-600",
        "total_questions": 100,
        "duration": "1 hour (20 min per section)",
        "category": "Banking Examinations",
        "syllabus_topics": {
            "Numerical Ability": {
                "subjects": {
                    "Speed & Calculation": {"sub_topics": ["Simplification", "Approximation", "Missing Number Series", "Wrong Number Series", "Quadratic Equations", "Quantity Comparison (Q1 & Q2)"], "questions": 18},
                    "Data Interpretation (DI)": {"sub_topics": ["Tabular DI", "Bar Graph", "Line Graph", "Pie Chart"], "questions": 8},
                    "Arithmetic (Word Problems)": {"sub_topics": ["Percentage", "Ratio and Proportion", "Average", "Age Problems", "Profit and Loss", "Simple Interest (SI)", "Compound Interest (CI)", "Time and Work", "Pipes and Cisterns", "Time Speed and Distance", "Boats & Streams", "Mixture and Allegations", "Partnership", "Mensuration"], "questions": 14}
                }
            },
            "Reasoning Ability": {
                "subjects": {
                    "Puzzles & Seating Arrangement": {"sub_topics": ["Floor/Flat Puzzles", "Box Puzzles", "Scheduling (Day/Month/Year)", "Comparison/Ranking", "Designation-based", "Circular Seating", "Linear Seating (Single Row)", "Linear Seating (Double Row)", "Square/Rectangular Arrangement"], "questions": 18},
                    "Logical Deductions": {"sub_topics": ["Syllogism (Including 'Only a Few')", "Inequalities (Direct)", "Inequalities (Coded)", "Data Sufficiency (Two statements)"], "questions": 8},
                    "Miscellaneous Logic": {"sub_topics": ["Direction Sense", "Blood Relations (Family Tree)", "Alphanumeric Series", "Symbolic Series", "Order & Ranking", "Coding-Decoding (Simple)", "Coding-Decoding (Fictitious)"], "questions": 7}
                }
            },
            "English Language": {
                "subjects": {
                    "Reading Comprehension (RC)": {"sub_topics": ["Passage comprehension", "Theme detection", "Vocabulary (Synonyms/Antonyms) from passage"], "questions": 9},
                    "Grammar & Structure": {"sub_topics": ["Error Detection (Spotting Errors)", "Sentence Improvement/Correction", "Phrase Replacement"], "questions": 9},
                    "Vocabulary & Usage": {"sub_topics": ["Cloze Test (Paragraph completion)", "Fillers (Single and Double)", "Word Swap/Usage", "Para Jumbles (Sentence Rearrangement)"], "questions": 12}
                }
            }
        }
    },
    
    "RBI_GRADE_B": {
        "name": "RBI Grade B",
        "full_name": "Reserve Bank of India Grade B Officer",
        "description": "Entrance exam for Grade B Officer in RBI - Phase I",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/dgbp1l60_Gemini_Generated_Image_be1xs8be1xs8be1x_2-removebg-preview.png",
        "color": "from-red-600 to-orange-600",
        "total_questions": 200,
        "duration": "2 hours",
        "category": "Banking Examinations",
        "syllabus_topics": {
            "General Awareness": {
                "subjects": {
                    "Current Affairs": {
                        "sub_topics": ["Last 6-8 months", "RBI Circulars", "Monetary Policy"],
                        "questions": 99
                    },
                    "Static Knowledge": {
                        "sub_topics": ["Indian Financial System", "Banking Terms"],
                        "questions": 54
                    },
                    "Government Schemes": {
                        "sub_topics": ["Union Budget", "Economic Survey"],
                        "questions": 20
                    },
                    "Reports & Indices": {
                        "sub_topics": ["World Bank", "IMF Reports"],
                        "questions": 20
                    }
                }
            },
            "Reasoning Ability": {
                "subjects": {
                    "Puzzles & Seating": {
                        "sub_topics": ["Multi-variable", "Complex Arrangements"],
                        "questions": 46
                    },
                    "Logical Reasoning": {
                        "sub_topics": ["Statement/Argument"],
                        "questions": 13
                    },
                    "Inequality": {
                        "sub_topics": ["Complex Inequality"],
                        "questions": 9
                    },
                    "Machine Input-Output": {
                        "sub_topics": ["Complex Logic"],
                        "questions": 9
                    },
                    "Data Sufficiency": {
                        "sub_topics": ["3 Statements"],
                        "questions": 6
                    }
                }
            },
            "English Language": {
                "subjects": {
                    "Reading Comprehension": {
                        "sub_topics": ["Advanced RC", "Inference Based"],
                        "questions": 22
                    },
                    "Vocabulary": {
                        "sub_topics": ["Synonyms", "Antonyms"],
                        "questions": 8
                    },
                    "Error Spotting": {
                        "sub_topics": ["Advanced Grammar"],
                        "questions": 7
                    },
                    "Para Jumbles": {
                        "sub_topics": ["Complex Rearrangement"],
                        "questions": 5
                    },
                    "Sentence Completion": {
                        "sub_topics": ["Fill Blanks"],
                        "questions": 3
                    }
                }
            },
            "Quantitative Aptitude": {
                "subjects": {
                    "Data Interpretation": {
                        "sub_topics": ["Caselets", "Radar DI", "Missing DI"],
                        "questions": 33
                    },
                    "Arithmetic": {
                        "sub_topics": ["Time Speed Distance", "P&L", "Probability"],
                        "questions": 27
                    },
                    "Data Sufficiency": {
                        "sub_topics": ["Statement Based"],
                        "questions": 5
                    },
                    "Simplification": {
                        "sub_topics": ["Advanced BODMAS"],
                        "questions": 5
                    }
                }
            }
        }
    },
    
    "NABARD": {
        "name": "NABARD Grade B",
        "full_name": "National Bank for Agriculture and Rural Development - Grade B Officer",
        "description": "Entrance exam for Grade B Officers in NABARD focusing on Agriculture, Rural Development and Economic issues",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/dgbp1l60_Gemini_Generated_Image_be1xs8be1xs8be1x_2-removebg-preview.png",
        "color": "from-green-600 to-teal-700",
        "total_questions": 200,
        "duration": "2 hours",
        "category": "Banking Examinations",
        "syllabus_topics": {
            "Reasoning Ability": {
                "subjects": {
                    "Puzzles": {
                        "sub_topics": ["Linear", "Circular", "Box", "Floor"],
                        "questions": 40
                    },
                    "Syllogism": {
                        "sub_topics": ["Standard"],
                        "questions": 3
                    },
                    "Blood Relations": {
                        "sub_topics": ["Family Tree"],
                        "questions": 2
                    }
                }
            },
            "Quantitative Aptitude": {
                "subjects": {
                    "Data Interpretation": {
                        "sub_topics": ["Table", "Bar", "Line"],
                        "questions": 15
                    },
                    "Simplification": {
                        "sub_topics": ["BODMAS"],
                        "questions": 5
                    },
                    "Arithmetic": {
                        "sub_topics": ["P&L", "SI/CI", "Ratio", "Time & Work"],
                        "questions": 32
                    }
                }
            },
            "Economic & Social Issues": {
                "subjects": {
                    "Socio-Economic Topics": {
                        "sub_topics": ["Poverty Measurement", "Poverty Alleviation", "Population Trends", "Economic Reforms"],
                        "questions": 60
                    },
                    "Social Justice": {
                        "sub_topics": ["SC/ST/OBC Issues", "Human Development", "Social Movements", "Positive Discrimination"],
                        "questions": 48
                    }
                }
            },
            "Agriculture & Rural Development": {
                "subjects": {
                    "Agriculture": {
                        "sub_topics": ["Soil Science", "Crop Production", "Water Resources", "Farm Machinery", "Climate Change"],
                        "questions": 80
                    },
                    "Rural Development": {
                        "sub_topics": ["Panchayati Raj", "Rural Credit", "NABARD Role", "Government Schemes"],
                        "questions": 56
                    }
                }
            },
            "General Awareness": {
                "subjects": {
                    "Current Affairs": {
                        "sub_topics": ["Last 6-8 months", "RBI/NABARD Notifications"],
                        "questions": 30
                    },
                    "Financial Awareness": {
                        "sub_topics": ["RBI Updates", "NABARD Updates", "Banking Terms"],
                        "questions": 24
                    },
                    "Government Schemes": {
                        "sub_topics": ["ARD/ESI Related"],
                        "questions": 6
                    },
                    "Appointments": {
                        "sub_topics": ["Key Appointments"],
                        "questions": 4
                    }
                }
            }
        }
    },
    
    "IBPS_RRB_PO": {
        "name": "IBPS RRB PO Prelims",
        "full_name": "IBPS RRB Officer Scale I - Preliminary Exam",
        "description": "Entrance exam for Officer Scale I in Regional Rural Banks",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/dgbp1l60_Gemini_Generated_Image_be1xs8be1xs8be1x_2-removebg-preview.png",
        "color": "from-purple-500 to-indigo-600",
        "total_questions": 80,
        "duration": "45 minutes",
        "category": "Banking Examinations",
        "syllabus_topics": {
            "Reasoning Ability": {
                "subjects": {
                    "Puzzles & Seating Arrangement": {"sub_topics": ["Floor/Flat Puzzles", "Box Puzzles", "Scheduling (Day/Month/Year)", "Comparison/Ranking", "Designation-based", "Categorized Puzzles", "Circular Seating", "Linear Seating (Single Row)", "Linear Seating (Double Row)", "Square/Rectangular Arrangement", "Uncertain number of people"], "questions": 22},
                    "Logical Deductions": {"sub_topics": ["Syllogism (Includes 'Only a Few')", "Inequalities (Direct)", "Inequalities (Coded)", "Data Sufficiency (2 or 3 statements)"], "questions": 8},
                    "Miscellaneous Logic": {"sub_topics": ["Direction Sense", "Blood Relations (Family Tree)", "Blood Relations (Coded)", "Alphanumeric Series", "Number Series", "Symbol Series", "Order & Ranking", "Coding-Decoding (Simple)", "Coding-Decoding (Fictitious)"], "questions": 9},
                    "Alphanumeric Series": {"sub_topics": ["Number Series", "Symbol Series", "Alphabet Series"], "questions": 3}
                }
            },
            "Numerical Ability": {
                "subjects": {
                    "Data Interpretation (DI)": {"sub_topics": ["Line Graph", "Bar Graph", "Pie Chart", "Tabular DI", "Caselet DI (Paragraph based)", "Mixed Graphs"], "questions": 12},
                    "Speed & Calculation": {"sub_topics": ["Simplification", "Approximation", "Missing Number Series", "Wrong Number Series", "Quadratic Equations", "Quantity Comparison (Q1 & Q2)"], "questions": 18},
                    "Arithmetic (Word Problems)": {"sub_topics": ["Percentage", "Ratio and Proportion", "Average", "Age", "Profit and Loss", "Simple Interest (SI)", "Compound Interest (CI)", "Time and Work", "Time Speed and Distance (Trains)", "Time Speed and Distance (Boats & Streams)", "Mixture and Allegations", "Probability", "Permutation and Combination", "Mensuration (2D & 3D)"], "questions": 14}
                }
            }
        }
    },
    
    "LIC_AAO": {
        "name": "LIC AAO Prelims",
        "full_name": "LIC Assistant Administrative Officer (Generalist) - Preliminary Exam",
        "description": "Entrance exam for AAO position in Life Insurance Corporation",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/dgbp1l60_Gemini_Generated_Image_be1xs8be1xs8be1x_2-removebg-preview.png",
        "color": "from-yellow-500 to-orange-600",
        "total_questions": 100,
        "duration": "1 hour",
        "category": "Banking Examinations",
        "syllabus_topics": {
            "Reasoning Ability": {
                "subjects": {
                    "Puzzles & Seating": {
                        "sub_topics": ["Box/Floor", "Day/Month", "Linear", "Circular"],
                        "questions": 64
                    },
                    "Syllogism": {
                        "sub_topics": ["Standard", "Possibility"],
                        "questions": 8
                    },
                    "Inequality": {
                        "sub_topics": ["Coded Inequality"],
                        "questions": 4
                    },
                    "Blood Relations": {
                        "sub_topics": ["Family Tree"],
                        "questions": 3
                    },
                    "Direction Sense": {
                        "sub_topics": ["Direction"],
                        "questions": 3
                    },
                    "Coding-Decoding": {
                        "sub_topics": ["Letter Coding"],
                        "questions": 3
                    },
                    "Input-Output": {
                        "sub_topics": ["Machine Input"],
                        "questions": 2
                    }
                }
            },
            "Quantitative Aptitude": {
                "subjects": {
                    "Arithmetic": {
                        "sub_topics": ["P&L", "SI/CI", "Ratio", "Time & Work", "Speed", "Averages", "Mensuration"],
                        "questions": 112
                    },
                    "Data Interpretation": {
                        "sub_topics": ["Table", "Bar", "Line Chart"],
                        "questions": 15
                    },
                    "Simplification": {
                        "sub_topics": ["BODMAS"],
                        "questions": 7
                    },
                    "Number Series": {
                        "sub_topics": ["Missing Series"],
                        "questions": 4
                    },
                    "Quadratic Equations": {
                        "sub_topics": ["Roots"],
                        "questions": 3
                    }
                }
            },
            "English Language": {
                "subjects": {
                    "Vocabulary": {
                        "sub_topics": ["Synonyms", "Antonyms", "Fill in Blanks"],
                        "questions": 21
                    },
                    "Reading Comprehension": {
                        "sub_topics": ["Passage Analysis"],
                        "questions": 9
                    },
                    "Error Spotting": {
                        "sub_topics": ["Grammar Errors"],
                        "questions": 5
                    },
                    "Cloze Test": {
                        "sub_topics": ["Fill Blanks"],
                        "questions": 5
                    },
                    "Sentence Correction": {
                        "sub_topics": ["Grammar"],
                        "questions": 4
                    }
                }
            }
        }
    },
    
    "LIC_ADO": {
        "name": "LIC ADO Prelims",
        "full_name": "LIC Apprentice Development Officer - Preliminary Exam",
        "description": "Entrance exam for ADO position in Life Insurance Corporation",
        "icon": "https://customer-assets.emergentagent.com/job_prepchamp/artifacts/dgbp1l60_Gemini_Generated_Image_be1xs8be1xs8be1x_2-removebg-preview.png",
        "color": "from-pink-500 to-rose-600",
        "total_questions": 110,
        "duration": "1 hour 30 minutes",
        "category": "Banking Examinations",
        "syllabus_topics": {
            "Reasoning Ability": {
                "subjects": {
                    "Puzzles & Seating": {
                        "sub_topics": ["Linear", "Circular", "Box-Based", "Floor-Based", "Day/Month"],
                        "questions": 80
                    },
                    "Syllogism": {
                        "sub_topics": ["Basic", "Possibility"],
                        "questions": 8
                    },
                    "Inequality": {
                        "sub_topics": ["Direct", "Coded"],
                        "questions": 8
                    },
                    "Blood Relations": {
                        "sub_topics": ["Family Tree"],
                        "questions": 3
                    },
                    "Direction Sense": {
                        "sub_topics": ["Direction"],
                        "questions": 3
                    },
                    "Coding-Decoding": {
                        "sub_topics": ["Letter Coding"],
                        "questions": 3
                    },
                    "Input-Output": {
                        "sub_topics": ["Machine Input"],
                        "questions": 2
                    }
                }
            },
            "Numerical Ability": {
                "subjects": {
                    "Arithmetic": {
                        "sub_topics": ["P&L", "SI/CI", "Ratio", "Partnership", "Time & Work", "Speed", "Mensuration", "Mixture"],
                        "questions": 128
                    },
                    "Simplification": {
                        "sub_topics": ["BODMAS", "Calculation"],
                        "questions": 14
                    },
                    "Data Interpretation": {
                        "sub_topics": ["Table", "Bar Chart"],
                        "questions": 10
                    },
                    "Number Series": {
                        "sub_topics": ["Missing Number"],
                        "questions": 4
                    },
                    "Quadratic Equations": {
                        "sub_topics": ["Finding Roots"],
                        "questions": 3
                    }
                }
            },
            "English Language": {
                "subjects": {
                    "Vocabulary": {
                        "sub_topics": ["Synonyms", "Antonyms", "Idioms"],
                        "questions": 12
                    },
                    "Reading Comprehension": {
                        "sub_topics": ["Passage Based"],
                        "questions": 9
                    },
                    "Error Spotting": {
                        "sub_topics": ["Grammar Errors"],
                        "questions": 5
                    },
                    "Cloze Test": {
                        "sub_topics": ["Fill Blanks"],
                        "questions": 5
                    },
                    "Sentence Correction": {
                        "sub_topics": ["Grammar"],
                        "questions": 4
                    },
                    "Para Jumbles": {
                        "sub_topics": ["Rearrangement"],
                        "questions": 3
                    }
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
        "full_name": "Spanish Language Legends 🎮",
        "description": "Master Spanish with fun challenges! Earn gems, unlock achievements, and compete with friends",
        "icon": "https://customer-assets.emergentagent.com/job_examprep-hub-29/artifacts/49xouqbu_Gemini_Generated_Image_y4o4v7y4o4v7y4o4_2-removebg-preview.png",
        "color": "from-orange-400 via-red-500 to-pink-500",
        "total_questions": 100,
        "duration": "Quick Play",
        "category": "Language Games",
        "game_mode": True,
        "syllabus_topics": {
            "Game Challenges": {
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
        "full_name": "French Quest Challenge 🎯",
        "description": "Conquer French through exciting word battles! Level up your skills and become a language champion",
        "icon": "https://customer-assets.emergentagent.com/job_examprep-hub-29/artifacts/49xouqbu_Gemini_Generated_Image_y4o4v7y4o4v7y4o4_2-removebg-preview.png",
        "color": "from-blue-500 via-indigo-500 to-purple-600",
        "total_questions": 100,
        "duration": "5 Min Rounds",
        "category": "Language Games",
        "game_mode": True,
        "syllabus_topics": {
            "Game Challenges": {
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
        "full_name": "Tamil Trivia Blast 🚀",
        "description": "Show off your Tamil skills! Challenge friends, earn rewards, and climb the leaderboard",
        "icon": "https://customer-assets.emergentagent.com/job_examprep-hub-29/artifacts/49xouqbu_Gemini_Generated_Image_y4o4v7y4o4v7y4o4_2-removebg-preview.png",
        "color": "from-amber-400 via-orange-500 to-red-500",
        "total_questions": 100,
        "duration": "Quick Play",
        "category": "Language Games",
        "game_mode": True,
        "syllabus_topics": {
            "Game Challenges": {
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
        "full_name": "Telugu Word Warriors ⚔️",
        "description": "Battle through Telugu challenges! Unlock levels, collect gems, and prove your mastery",
        "icon": "https://customer-assets.emergentagent.com/job_examprep-hub-29/artifacts/49xouqbu_Gemini_Generated_Image_y4o4v7y4o4v7y4o4_2-removebg-preview.png",
        "color": "from-teal-400 via-cyan-500 to-blue-500",
        "total_questions": 100,
        "duration": "Quick Play",
        "category": "Language Games",
        "game_mode": True,
        "syllabus_topics": {
            "Game Challenges": {
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
        "full_name": "Kannada Champions League 🏆",
        "description": "Join the Kannada language arena! Compete, win badges, and become the ultimate word master",
        "icon": "https://customer-assets.emergentagent.com/job_examprep-hub-29/artifacts/49xouqbu_Gemini_Generated_Image_y4o4v7y4o4v7y4o4_2-removebg-preview.png",
        "color": "from-green-400 via-emerald-500 to-teal-500",
        "total_questions": 100,
        "duration": "5 Min Rounds",
        "category": "Language Games",
        "game_mode": True,
        "syllabus_topics": {
            "Game Challenges": {
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
        "full_name": "Chinese Mastery Quest 🐉",
        "description": "Embark on a Chinese adventure! Solve puzzles, earn power-ups, and dominate the rankings",
        "icon": "https://customer-assets.emergentagent.com/job_examprep-hub-29/artifacts/49xouqbu_Gemini_Generated_Image_y4o4v7y4o4v7y4o4_2-removebg-preview.png",
        "color": "from-red-500 via-rose-500 to-pink-500",
        "total_questions": 100,
        "duration": "Quick Play",
        "category": "Language Games",
        "game_mode": True,
        "syllabus_topics": {
            "Game Challenges": {
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
        "full_name": "Japanese Ninja Challenge 🥷",
        "description": "Train like a language ninja! Master Japanese through exciting missions and boss battles",
        "icon": "https://customer-assets.emergentagent.com/job_examprep-hub-29/artifacts/49xouqbu_Gemini_Generated_Image_y4o4v7y4o4v7y4o4_2-removebg-preview.png",
        "color": "from-pink-500 via-purple-500 to-indigo-600",
        "total_questions": 100,
        "duration": "5 Min Rounds",
        "category": "Language Games",
        "game_mode": True,
        "syllabus_topics": {
            "Game Challenges": {
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
        "full_name": "Korean K-Pop Challenge 🎤",
        "description": "Level up your Korean like a K-pop star! Play, compete, and shine on the global stage",
        "icon": "https://customer-assets.emergentagent.com/job_examprep-hub-29/artifacts/49xouqbu_Gemini_Generated_Image_y4o4v7y4o4v7y4o4_2-removebg-preview.png",
        "color": "from-purple-500 via-pink-500 to-rose-500",
        "total_questions": 100,
        "duration": "Quick Play",
        "category": "Language Games",
        "game_mode": True,
        "syllabus_topics": {
            "Game Challenges": {
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
    },

    # RSMSSB Examinations (Rajasthan State Exams)
    "RSMSSB_Patwari": {
        "name": "RSMSSB Patwari",
        "full_name": "RSMSSB Patwari Recruitment Exam",
        "description": "Rajasthan Subordinate and Ministerial Services Selection Board Patwari Examination",
        "icon": "https://customer-assets.emergentagent.com/job_quiz-translate/artifacts/wwy5znuf_Gemini_Generated_Image_uuhw1cuuhw1cuuhw-removebg-preview.png",
        "color": "from-amber-600 to-orange-700",
        "total_questions": 150,
        "duration": "3 hours",
        "category": "RSMSSB Examinations",
        "syllabus_topics": {
            "General Science & India GK": {
                "subjects": {
                    "General Science": {
                        "sub_topics": ["Physical and Chemical changes", "Human diseases", "Nutrition", "Everyday Science"],
                        "questions": 10
                    },
                    "Indian History": {
                        "sub_topics": ["Ancient & Medieval history", "Indian Freedom Movement", "19th-20th Century History"],
                        "questions": 10
                    },
                    "Indian Polity": {
                        "sub_topics": ["Constitution of India", "Public Policy", "Rights & Duties", "Fundamental Rights"],
                        "questions": 10
                    },
                    "Geography of India": {
                        "sub_topics": ["Physical Geography", "Environmental issues", "Ecology", "Natural Resources"],
                        "questions": 8
                    }
                }
            },
            "Rajasthan GK": {
                "subjects": {
                    "History & Culture": {
                        "sub_topics": ["Major Forts", "Monuments", "Fairs & Festivals", "Folk Arts", "Handicrafts"],
                        "questions": 10
                    },
                    "Geography of Rajasthan": {
                        "sub_topics": ["Physiographic divisions", "Climate", "Soil", "Population", "Crops", "Water Resources"],
                        "questions": 8
                    },
                    "Administration": {
                        "sub_topics": ["Governor", "State Assembly", "High Court", "District Administration", "Panchayati Raj"],
                        "questions": 7
                    },
                    "Key Movements": {
                        "sub_topics": ["Peasant Movements", "Tribal Movements", "Political Integration of Rajasthan"],
                        "questions": 5
                    }
                }
            },
            "General English & Hindi": {
                "subjects": {
                    "Hindi Grammar": {
                        "sub_topics": ["Sandhi", "Samas", "Upsarg", "Pratyay", "Sentence Correction", "Shuddhi"],
                        "questions": 12
                    },
                    "English Grammar": {
                        "sub_topics": ["Tenses", "Articles", "Determiners", "Sentence Correction", "Active Passive"],
                        "questions": 5
                    },
                    "Vocabulary": {
                        "sub_topics": ["Synonyms", "Antonyms", "Idioms & Phrases", "Technical Terms", "One Word Substitution"],
                        "questions": 5
                    }
                }
            },
            "Mental Ability & Reasoning": {
                "subjects": {
                    "Logical Reasoning": {
                        "sub_topics": ["Series Making", "Analogy", "Classification", "Coding-Decoding", "Direction Sense"],
                        "questions": 15
                    },
                    "Problem Solving": {
                        "sub_topics": ["Blood Relations", "Sitting Arrangements", "Syllogism", "Statement Conclusions"],
                        "questions": 10
                    },
                    "Mathematics": {
                        "sub_topics": ["Average", "Ratio & Proportion", "Area & Volume", "Simple Interest", "Compound Interest"],
                        "questions": 12
                    },
                    "Arithmetic": {
                        "sub_topics": ["Profit & Loss", "Percentage", "Unitary Method", "Time & Work", "Speed Distance"],
                        "questions": 8
                    }
                }
            },
            "Basic Computer": {
                "subjects": {
                    "Computer Fundamentals": {
                        "sub_topics": ["RAM", "ROM", "File System", "Input/Output Devices", "Computer Generations"],
                        "questions": 8
                    },
                    "Software": {
                        "sub_topics": ["Operating Systems", "MS Word", "MS Excel", "MS PowerPoint", "Internet Basics"],
                        "questions": 5
                    },
                    "Hardware & IT": {
                        "sub_topics": ["Computer Hardware", "Characteristics of Computers", "Recent trends in IT", "Networking Basics"],
                        "questions": 2
                    }
                }
            }
        }
    },

    # RSMSSB - Rajasthan Police Constable Recruitment 2025
    "Rajasthan_Police_Constable": {
        "name": "Rajasthan Police Constable",
        "full_name": "Rajasthan Police Constable Recruitment 2025",
        "description": "Rajasthan Police Department (RPD) Constable Recruitment Exam",
        "icon": "https://customer-assets.emergentagent.com/job_quiz-translate/artifacts/wwy5znuf_Gemini_Generated_Image_uuhw1cuuhw1cuuhw-removebg-preview.png",
        "color": "from-blue-700 to-indigo-800",
        "total_questions": 150,
        "duration": "2 hours",
        "category": "RSMSSB Examinations",
        "negative_marking": "0.25 marks (25%)",
        "syllabus_topics": {
            "Reasoning & Logic": {
                "subjects": {
                    "Logic": {
                        "sub_topics": ["Coding-Decoding", "Blood Relations", "Direction Sense", "Venn Diagrams"],
                        "questions": 15
                    },
                    "Analogy": {
                        "sub_topics": ["Word & Alphabet Analogy", "Odd One Out", "Classification"],
                        "questions": 10
                    },
                    "Data & Pattern": {
                        "sub_topics": ["Series Completion", "Missing Characters", "Dice & Cubes", "Number Series"],
                        "questions": 10
                    },
                    "Analytical": {
                        "sub_topics": ["Statement & Conclusion", "Clock & Calendar", "Syllogism", "Puzzles"],
                        "questions": 10
                    }
                }
            },
            "Basic Computer Knowledge": {
                "subjects": {
                    "Hardware": {
                        "sub_topics": ["RAM", "ROM", "Input/Output Devices", "CPU Components", "Storage Devices"],
                        "questions": 5
                    },
                    "Software": {
                        "sub_topics": ["Operating Systems (Windows)", "MS Word", "MS Excel", "MS PowerPoint"],
                        "questions": 5
                    },
                    "Internet": {
                        "sub_topics": ["Search Engines", "Networking (LAN/WAN)", "Email", "Web Browsers"],
                        "questions": 3
                    },
                    "Cyber Safety": {
                        "sub_topics": ["Cyber Crimes", "Virus/Malware", "Information Technology Act", "Online Security"],
                        "questions": 2
                    }
                }
            },
            "General Knowledge & Science": {
                "subjects": {
                    "General Science": {
                        "sub_topics": ["Everyday Physics", "Human Body & Diseases", "Chemical Changes", "Biology Basics"],
                        "questions": 10
                    },
                    "Indian Polity": {
                        "sub_topics": ["Constitution of India", "Parliament", "Rights & Duties", "Judiciary"],
                        "questions": 8
                    },
                    "Current Affairs": {
                        "sub_topics": ["Major National Awards", "Sports Events", "International Summits", "Government Schemes"],
                        "questions": 10
                    },
                    "History & Geography": {
                        "sub_topics": ["Indian Freedom Struggle (1857-1947)", "Physical Geography of India", "World Geography", "Ancient India"],
                        "questions": 7
                    }
                }
            },
            "Rajasthan GK": {
                "subjects": {
                    "Rajasthan History": {
                        "sub_topics": ["Major Dynasties (Mewar, Marwar)", "1857 Revolution in Rajasthan", "Freedom Fighters", "Historical Events"],
                        "questions": 12
                    },
                    "Art & Culture": {
                        "sub_topics": ["Forts & Palaces", "Fairs & Festivals", "Folk Dances", "Dialects & Literature"],
                        "questions": 12
                    },
                    "Rajasthan Geography": {
                        "sub_topics": ["Climate", "Rivers & Lakes", "Mines & Minerals", "Population (Census)"],
                        "questions": 11
                    },
                    "Rajasthan Polity": {
                        "sub_topics": ["Governor", "Chief Minister", "State Assembly", "RPSC", "Panchayati Raj"],
                        "questions": 10
                    }
                }
            },
            "Women & Children Laws": {
                "subjects": {
                    "Women's Safety": {
                        "sub_topics": ["Domestic Violence Act 2005", "Dowry Prohibition Act 1961", "Sexual Harassment at Workplace Act"],
                        "questions": 4
                    },
                    "Child Safety": {
                        "sub_topics": ["POCSO Act 2012", "Child Labour (Prohibition) Act", "Juvenile Justice Act"],
                        "questions": 3
                    },
                    "IPC Sections": {
                        "sub_topics": ["Sections related to Theft", "Assault", "Cyberstalking", "Kidnapping"],
                        "questions": 2
                    },
                    "Helplines & Procedures": {
                        "sub_topics": ["Police & Emergency Helplines", "FIR Procedures", "Women Helpline 181", "Child Helpline 1098"],
                        "questions": 1
                    }
                }
            }
        }
    },

    # RSMSSB - RPSC Statistical Officer (SO) Recruitment 2025
    "RPSC_Statistical_Officer": {
        "name": "RPSC Statistical Officer",
        "full_name": "RPSC Statistical Officer (SO) Recruitment 2025",
        "description": "Rajasthan Public Service Commission SO Exam - Statistics & GK",
        "icon": "https://customer-assets.emergentagent.com/job_quiz-translate/artifacts/wwy5znuf_Gemini_Generated_Image_uuhw1cuuhw1cuuhw-removebg-preview.png",
        "color": "from-purple-600 to-violet-700",
        "total_questions": 150,
        "duration": "2.5 hours",
        "category": "RSMSSB Examinations",
        "negative_marking": "1/3 Marks deducted",
        "exam_pattern": "Part A: 40 Qs (GK) | Part B: 110 Qs (Subject)",
        "syllabus_topics": {
            "Rajasthan General Knowledge": {
                "subjects": {
                    "Rajasthan Geography": {
                        "sub_topics": ["Physiographic Divisions", "Soil Types", "Mines & Minerals", "Livestock", "Population Distribution"],
                        "questions": 10
                    },
                    "Rajasthan History": {
                        "sub_topics": ["Major Dynasties (Mewar/Marwar)", "1857 Revolt in Rajasthan", "Prajamandal Movement", "Freedom Fighters"],
                        "questions": 10
                    },
                    "Art & Culture": {
                        "sub_topics": ["Forts & Temples", "Paintings (Miniature Art)", "Fairs & Festivals", "Folk Deities", "Handicrafts"],
                        "questions": 10
                    },
                    "Rajasthan Current Affairs": {
                        "sub_topics": ["Development Schemes", "Welfare Initiatives", "Recent Government Policies", "State Budget"],
                        "questions": 10
                    }
                }
            },
            "Core Statistics (Basics)": {
                "subjects": {
                    "Data Analysis": {
                        "sub_topics": ["Classification of Data", "Tabulation", "Diagrammatic Presentation", "Graphical Methods"],
                        "questions": 8
                    },
                    "Measures & Moments": {
                        "sub_topics": ["Central Tendency (Mean/Median/Mode)", "Dispersion (SD/Variance)", "Moments", "Skewness & Kurtosis"],
                        "questions": 10
                    },
                    "Correlation & Regression": {
                        "sub_topics": ["Karl Pearson Correlation", "Rank Correlation", "Multiple Correlation", "Partial Correlation", "Regression Analysis"],
                        "questions": 8
                    },
                    "Probability": {
                        "sub_topics": ["Classical/Axiomatic Approach", "Bayes' Theorem", "Random Variables", "Expectation & Variance"],
                        "questions": 8
                    },
                    "Probability Distributions": {
                        "sub_topics": ["Binomial Distribution", "Poisson Distribution", "Normal Distribution", "Beta & Gamma", "Exponential Distribution"],
                        "questions": 8
                    }
                }
            },
            "Advanced Statistics & Inference": {
                "subjects": {
                    "Estimation Theory": {
                        "sub_topics": ["Point Estimation", "Interval Estimation", "MLE (Maximum Likelihood)", "Method of Moments", "Properties of Estimators"],
                        "questions": 8
                    },
                    "Hypothesis Testing": {
                        "sub_topics": ["Type I/II Errors", "Critical Region", "Z-test", "t-test", "F-test", "Chi-square Test"],
                        "questions": 10
                    },
                    "Sampling Techniques": {
                        "sub_topics": ["Simple Random Sampling", "Stratified Sampling", "Cluster Sampling", "Systematic Sampling", "Multi-stage Sampling"],
                        "questions": 8
                    },
                    "Multivariate Analysis": {
                        "sub_topics": ["Multivariate Normal Distribution", "Hotelling's T²", "Wishart Distribution", "Principal Component Analysis"],
                        "questions": 6
                    },
                    "Design of Experiments": {
                        "sub_topics": ["ANOVA (One-way/Two-way)", "RBD", "LSD", "Factorial Experiments", "Latin Square Design"],
                        "questions": 6
                    }
                }
            },
            "Applied Statistics": {
                "subjects": {
                    "Time Series Analysis": {
                        "sub_topics": ["Trend Measurement", "Seasonal Variations", "Cyclical Variations", "Irregular Components", "Moving Averages"],
                        "questions": 6
                    },
                    "Index Numbers": {
                        "sub_topics": ["Construction Methods", "Time Reversal Test", "Factor Reversal Test", "Cost of Living Index", "Wholesale Price Index"],
                        "questions": 6
                    },
                    "Vital Statistics": {
                        "sub_topics": ["Mortality Rates (CDR/IMR)", "Fertility Rates (CBR/TFR)", "Life Tables", "Survivorship Functions"],
                        "questions": 5
                    },
                    "Population Studies": {
                        "sub_topics": ["GRR & NRR", "Population Projection Methods", "Demographic Transition", "Census Analysis"],
                        "questions": 5
                    }
                }
            },
            "Economics, Math & Computers": {
                "subjects": {
                    "Economics": {
                        "sub_topics": ["Law of Demand/Supply", "National Income", "Inflation", "Banking System", "Fiscal Policy"],
                        "questions": 5
                    },
                    "Econometrics": {
                        "sub_topics": ["Autocorrelation", "Multicollinearity", "Heteroscedasticity", "OLS Estimation"],
                        "questions": 4
                    },
                    "Economy of Rajasthan": {
                        "sub_topics": ["Agriculture", "Public Finance", "Infrastructure Projects", "Industrial Development"],
                        "questions": 4
                    },
                    "Elementary Mathematics": {
                        "sub_topics": ["Decimal & Fractions", "Percentage", "Ratio & Proportion", "Average", "Simple/Compound Interest"],
                        "questions": 4
                    },
                    "Computer Basics": {
                        "sub_topics": ["MS Word", "MS Excel", "MS PowerPoint", "Internet Basics", "Email"],
                        "questions": 3
                    }
                }
            }
        }
    },

    # ══════════════════════════════════════════════════════════════════════════════
    # UPPSC EXAMINATIONS (Uttar Pradesh Public Service Commission)
    # ══════════════════════════════════════════════════════════════════════════════
    
    "UP_Police_Constable": {
        "name": "UP Police Constable",
        "full_name": "UP Police Constable Recruitment 2025",
        "description": "UPPRPB Constable Exam - GK, Hindi, Maths & Reasoning",
        "icon": "https://customer-assets.emergentagent.com/job_quiz-translate/artifacts/8abwv0xk_IMG_2261.png",
        "color": "from-orange-600 to-red-700",
        "total_questions": 150,
        "total_marks": 300,
        "duration": "2 hours",
        "category": "UPPSC Examinations",
        "negative_marking": "0.50 marks (25%)",
        "marks_per_question": 2,
        "syllabus_topics": {
            "General Knowledge (GK)": {
                "subjects": {
                    "UP Specific GK": {
                        "sub_topics": ["Education in UP", "Culture & Social Practices", "Revenue System in UP", "Police System in UP", "UP Districts"],
                        "questions": 10
                    },
                    "India GK": {
                        "sub_topics": ["Indian History", "Constitution of India", "Indian Economy", "Agriculture", "National Symbols"],
                        "questions": 10
                    },
                    "General Science": {
                        "sub_topics": ["Everyday Science", "Inventions & Discoveries", "Health & Disease", "Physics Basics", "Chemistry Basics"],
                        "questions": 10
                    },
                    "Current Affairs": {
                        "sub_topics": ["National/International Awards", "Demonetization", "GST", "Cyber Crime", "Government Schemes"],
                        "questions": 8
                    }
                }
            },
            "General Hindi": {
                "subjects": {
                    "Grammar (Vyakaran)": {
                        "sub_topics": ["Sandhi", "Samas", "Alankar", "Karak", "Ling", "Vachan", "Kaal"],
                        "questions": 12
                    },
                    "Vocabulary (Shabd Gyan)": {
                        "sub_topics": ["Tatsam-Tadbhav", "Paryayvachi (Synonyms)", "Vilom (Antonyms)", "One-word Substitution", "Muhavare"],
                        "questions": 10
                    },
                    "Sentence Correction": {
                        "sub_topics": ["Ashuddh Vakya Shuddhi", "Spotting Errors", "Sentence Rearrangement"],
                        "questions": 8
                    },
                    "Literature (Sahitya)": {
                        "sub_topics": ["Famous Poets (Kavi)", "Authors (Lekhak)", "Famous Works (Rachnaye)", "Hindi Prose & Poetry"],
                        "questions": 7
                    }
                }
            },
            "Numerical Ability": {
                "subjects": {
                    "Number System": {
                        "sub_topics": ["Simplification", "Decimals & Fractions", "HCF & LCM", "Square Roots", "Cube Roots"],
                        "questions": 10
                    },
                    "Commercial Math": {
                        "sub_topics": ["Ratio & Proportion", "Percentage", "Profit & Loss", "Discount", "Simple/Compound Interest"],
                        "questions": 12
                    },
                    "Time & Work": {
                        "sub_topics": ["Partnership", "Time & Distance", "Pipes & Cisterns", "Tables & Graphs", "Average"],
                        "questions": 10
                    },
                    "Mensuration": {
                        "sub_topics": ["Area", "Volume", "Perimeter", "Surface Area", "Height & Distance"],
                        "questions": 6
                    }
                }
            },
            "Mental Aptitude (Police Specific)": {
                "subjects": {
                    "Public Safety": {
                        "sub_topics": ["Public Interest", "Law and Order", "Communal Harmony", "Crime Control", "Emergency Response"],
                        "questions": 8
                    },
                    "Police System Knowledge": {
                        "sub_topics": ["Rule of Law", "Ability of Adaptability", "Basic Law Knowledge", "Police Hierarchy", "FIR & Investigation"],
                        "questions": 8
                    },
                    "Professionalism": {
                        "sub_topics": ["Interest in Profession", "Mental Toughness", "Sensitivity towards Minorities", "Underprivileged Sections", "Ethics"],
                        "questions": 6
                    },
                    "Gender Sensitivity": {
                        "sub_topics": ["Women's Safety Issues", "Women's Rights", "Domestic Violence Awareness", "Eve Teasing Prevention", "POCSO Awareness"],
                        "questions": 5
                    }
                }
            },
            "IQ & Reasoning Ability": {
                "subjects": {
                    "IQ Test": {
                        "sub_topics": ["Direction Sense", "Blood Relations", "Coding-Decoding", "Venn Diagrams", "Puzzles"],
                        "questions": 10
                    },
                    "Visual Reasoning": {
                        "sub_topics": ["Space Visualization", "Visual Memory", "Series Completion", "Mirror Images", "Paper Folding"],
                        "questions": 10
                    },
                    "Analytical Reasoning": {
                        "sub_topics": ["Problem Solving", "Analysis & Judgment", "Decision Making", "Statement Conclusions"],
                        "questions": 10
                    },
                    "Analogies": {
                        "sub_topics": ["Word Analogies", "Alphabet Analogies", "Number Analogies", "Classification"],
                        "questions": 7
                    }
                }
            }
        }
    },

    # UPPSC - UPTET (Uttar Pradesh Teacher Eligibility Test) 2025
    "UPTET": {
        "name": "UPTET",
        "full_name": "UPTET Recruitment Exam 2025",
        "description": "UP Basic Education Board Teacher Eligibility Test - Paper 1",
        "icon": "https://customer-assets.emergentagent.com/job_prepninja-exams/artifacts/pv7esjzw_IMG_1360-removebg-preview.png",
        "color": "from-green-600 to-teal-700",
        "total_questions": 150,
        "duration": "2.5 hours",
        "category": "UPPSC Examinations",
        "passing_marks": "90 (General) / 82 (Reserved)",
        "paper_type": "Paper 1 - Primary Level (Class 1-5)",
        "syllabus_topics": {
            "Child Development (CDP)": {
                "subjects": {
                    "Child Development": {
                        "sub_topics": ["Growth vs Development", "Heredity & Environment", "Socialization Process", "Multi-Dimensional Development", "Language & Thought"],
                        "questions": 8
                    },
                    "Learning Theories": {
                        "sub_topics": ["Piaget's Cognitive Development", "Vygotsky's Zone of Proximal Development", "Kohlberg's Moral Development", "Thorndike's Laws of Learning", "Bruner's Discovery Learning"],
                        "questions": 8
                    },
                    "Inclusive Education": {
                        "sub_topics": ["Understanding CWSN", "Dyslexia & Dysgraphia", "Gifted & Talented Children", "Learning Disabilities", "Autism Spectrum"],
                        "questions": 7
                    },
                    "Pedagogy": {
                        "sub_topics": ["Teaching Methods", "Motivation & Learning", "Emotion & Cognition", "Individual Differences", "Assessment & Evaluation"],
                        "questions": 7
                    }
                }
            },
            "Language I (Hindi)": {
                "subjects": {
                    "Vyakaran (Grammar)": {
                        "sub_topics": ["Sandhi", "Samas", "Alankar", "Vilom Shabd", "Tatsam-Tadbhav", "Paryayvachi"],
                        "questions": 10
                    },
                    "Hindi Literature": {
                        "sub_topics": ["Famous Hindi Poets (Kavi)", "Compositions (Rachnaye)", "Prose & Poetry", "Chhayavaad Movement"],
                        "questions": 7
                    },
                    "Comprehension": {
                        "sub_topics": ["Unseen Passage (Apthit Gadyansh)", "Reading Comprehension", "Inference Questions"],
                        "questions": 6
                    },
                    "Hindi Pedagogy": {
                        "sub_topics": ["Language Acquisition", "Challenges in Teaching Hindi", "Listening & Speaking Skills", "Reading & Writing Development"],
                        "questions": 7
                    }
                }
            },
            "Language II (English/Sanskrit)": {
                "subjects": {
                    "English Grammar": {
                        "sub_topics": ["Parts of Speech", "Tenses", "Voice & Narration", "Prepositions", "Articles"],
                        "questions": 8
                    },
                    "Vocabulary": {
                        "sub_topics": ["Synonyms & Antonyms", "Idioms & Phrases", "Word Formation", "One Word Substitution"],
                        "questions": 7
                    },
                    "Sanskrit (Optional)": {
                        "sub_topics": ["Maheshwar Sutras", "Karak", "Dhatu Roop", "Sandhi", "Sanskrit Literature"],
                        "questions": 8
                    },
                    "Language Pedagogy": {
                        "sub_topics": ["Methods of Teaching Second Language", "Remedial Teaching", "Error Analysis", "Language Skills Development"],
                        "questions": 7
                    }
                }
            },
            "Mathematics": {
                "subjects": {
                    "Number System": {
                        "sub_topics": ["Place Value", "LCM & HCF", "Fractions", "Simplification", "Number Properties"],
                        "questions": 8
                    },
                    "Arithmetic": {
                        "sub_topics": ["Percentage", "Profit & Loss", "Simple Interest", "Time & Work", "Ratio & Proportion"],
                        "questions": 8
                    },
                    "Geometry & Mensuration": {
                        "sub_topics": ["Shapes & Properties", "Perimeter & Area", "Volume", "Calendar & Clock", "Lines & Angles"],
                        "questions": 7
                    },
                    "Math Pedagogy": {
                        "sub_topics": ["Nature of Mathematics", "Error Analysis", "Diagnostic Teaching", "Problem Solving Approach", "Concrete to Abstract"],
                        "questions": 7
                    }
                }
            },
            "Environmental Studies (EVS)": {
                "subjects": {
                    "EVS Themes": {
                        "sub_topics": ["Family & Friends", "Food & Nutrition", "Shelter & Housing", "Water Conservation", "Travel & Transport"],
                        "questions": 8
                    },
                    "UP General Knowledge": {
                        "sub_topics": ["Fairs & Festivals of UP", "Rivers of Uttar Pradesh", "Famous Personalities", "Historical Places", "Culture & Traditions"],
                        "questions": 7
                    },
                    "Indian Constitution & Civics": {
                        "sub_topics": ["Basic Constitutional Articles", "Parliament Structure", "Panchayat Raj System", "Fundamental Rights", "Fundamental Duties"],
                        "questions": 8
                    },
                    "Ecology & Environment": {
                        "sub_topics": ["Ecosystem", "Food Chain & Web", "Pollution Types", "Conservation", "Natural Resources"],
                        "questions": 7
                    }
                }
            }
        }
    },

    # ══════════════════════════════════════════════════════════════════════════════
    # CSBC EXAMINATIONS (Central Selection Board of Constable - Bihar)
    # ══════════════════════════════════════════════════════════════════════════════
    
    "Bihar_Police_Constable": {
        "name": "Bihar Police Constable",
        "full_name": "Bihar Police Constable Recruitment 2026",
        "description": "CSBC Bihar Police Exam - Matric Level (10th Standard)",
        "icon": "https://customer-assets.emergentagent.com/job_quiz-translate/artifacts/3fjjz67m_Gemini_Generated_Image_4usbdj4usbdj4usb-removebg-preview.png",
        "color": "from-red-600 to-pink-700",
        "total_questions": 100,
        "total_marks": 100,
        "duration": "2 hours",
        "category": "CSBC Examinations",
        "negative_marking": "NO (0 Marks deducted)",
        "level": "10th (Matric) Standard",
        "syllabus_topics": {
            "General Knowledge & Current Affairs": {
                "subjects": {
                    "Bihar GK": {
                        "sub_topics": ["History of Bihar", "State Rivers", "Chhath Festival", "Local Polity", "Bihar Districts", "Famous Personalities of Bihar"],
                        "questions": 12
                    },
                    "Current Affairs": {
                        "sub_topics": ["National Awards", "Sports (Olympics/CWG)", "Bihar Govt Schemes", "National Events", "International Events"],
                        "questions": 10
                    },
                    "Static GK": {
                        "sub_topics": ["Indian Monuments", "Capitals & Currencies", "First in India", "Important Dates", "National Symbols"],
                        "questions": 10
                    },
                    "Miscellaneous GK": {
                        "sub_topics": ["Books & Authors", "International Organizations", "UN & Its Agencies", "Inventions & Discoveries"],
                        "questions": 8
                    }
                }
            },
            "Languages (Hindi & English)": {
                "subjects": {
                    "Hindi Grammar": {
                        "sub_topics": ["Samas", "Sandhi", "Alankar", "Muhavare (Idioms)", "Paryayvachi (Synonyms)", "Vilom (Antonyms)"],
                        "questions": 8
                    },
                    "English Grammar": {
                        "sub_topics": ["Prepositions", "Articles", "Spelling Correction", "Narration (Direct/Indirect)", "Voice"],
                        "questions": 7
                    },
                    "Bihar Literature": {
                        "sub_topics": ["Phanishwar Nath Renu", "Ramdhari Singh Dinkar", "Vidyapati", "Famous Bihar Authors"],
                        "questions": 5
                    }
                }
            },
            "General Science": {
                "subjects": {
                    "Physics": {
                        "sub_topics": ["Light (Optics)", "Force & Motion", "Sound", "Energy", "Heat", "Electricity Basics"],
                        "questions": 10
                    },
                    "Chemistry": {
                        "sub_topics": ["Acids, Bases & Salts", "Metals & Non-Metals", "Carbon Compounds", "Chemical Reactions", "Periodic Table"],
                        "questions": 10
                    },
                    "Biology": {
                        "sub_topics": ["Human Diseases", "Nutrition (Vitamins)", "Cell Structure", "Plant Classification", "Human Body Systems"],
                        "questions": 10
                    }
                }
            },
            "Social Sciences": {
                "subjects": {
                    "History": {
                        "sub_topics": ["Revolt of 1857 (Kunwar Singh)", "Indian Freedom Movement", "Ancient Magadha", "Maurya Empire", "Medieval India"],
                        "questions": 8
                    },
                    "Polity": {
                        "sub_topics": ["Constitution Preamble", "Fundamental Rights", "Panchayat Raj System", "Parliament", "Judiciary"],
                        "questions": 8
                    },
                    "Geography": {
                        "sub_topics": ["Soil of India", "Agriculture", "Indian Monsoons", "Rivers of India", "Climate"],
                        "questions": 7
                    },
                    "Economics": {
                        "sub_topics": ["Poverty in India", "Inflation", "Rural Economy", "Banking Basics", "Five Year Plans"],
                        "questions": 7
                    }
                }
            },
            "Mathematics": {
                "subjects": {
                    "Arithmetic": {
                        "sub_topics": ["Percentage", "Profit & Loss", "Average", "Time & Work", "Ratio & Proportion"],
                        "questions": 4
                    },
                    "Number System": {
                        "sub_topics": ["HCF & LCM", "Divisibility Rules", "Simplification", "Square & Cube Roots"],
                        "questions": 3
                    },
                    "Mensuration": {
                        "sub_topics": ["Area of Circle/Triangle", "Volume of Cube/Cylinder", "Perimeter", "Surface Area"],
                        "questions": 2
                    },
                    "Algebra": {
                        "sub_topics": ["Basic Equations", "Linear Equations", "Quadratic Equations (10th level)"],
                        "questions": 1
                    }
                }
            }
        }
    },

    # ═══════════════════════════════════════════════════════════════════════════
    # UNIVERSITY & DEGREE EXAMS
    # ═══════════════════════════════════════════════════════════════════════════
    
    "LLB": {
        "name": "LLB (5 Year)",
        "full_name": "Bachelor of Legislative Law - 5 Year Integrated Program",
        "description": "Complete 5-year LLB integrated program covering all semesters from 1st Year to 5th Year with comprehensive law subjects",
        "icon": "⚖️",
        "color": "from-amber-600 to-yellow-600",
        "total_questions": 500,
        "duration": "5 Years",
        "category": "University & Degree Exams",
        "syllabus_topics": {
            "1st Year": {
                "subjects": {
                    "Semester I - Legal Method": {
                        "sub_topics": ["Introduction to Law", "Sources of Law", "Legal Systems", "Principles of Legal Reasoning", "Legal Research Methods"],
                        "questions": 15
                    },
                    "Semester I - Law of Contract I": {
                        "sub_topics": ["Formation of Contract", "Offer and Acceptance", "Consideration", "Capacity to Contract", "Free Consent"],
                        "questions": 15
                    },
                    "Semester I - English I": {
                        "sub_topics": ["Legal Terminology", "Language Skills", "Law and Literature", "Legal Writing", "Communication Skills"],
                        "questions": 10
                    },
                    "Semester I - History I": {
                        "sub_topics": ["Ancient India", "Medieval India", "Mughal Period", "Early Legal Systems", "Evolution of Indian Law"],
                        "questions": 10
                    },
                    "Semester I - Sociology I": {
                        "sub_topics": ["Introduction to Sociology", "Society and Culture", "Social Institutions", "Social Groups", "Social Stratification"],
                        "questions": 10
                    },
                    "Semester I - Political Science I": {
                        "sub_topics": ["Political Theory", "State and Sovereignty", "Democracy", "Political Ideologies", "Indian Political System"],
                        "questions": 10
                    },
                    "Semester I - Economics I": {
                        "sub_topics": ["Microeconomics", "Demand and Supply", "Market Structures", "Price Theory", "Consumer Behavior"],
                        "questions": 10
                    },
                    "Semester II - Law of Contract II": {
                        "sub_topics": ["Performance of Contract", "Breach of Contract", "Quasi Contracts", "Indemnity and Guarantee", "Bailment and Pledge"],
                        "questions": 15
                    },
                    "Semester II - Law of Torts": {
                        "sub_topics": ["Nature of Torts", "Negligence", "Defamation", "Nuisance", "Consumer Protection Act"],
                        "questions": 15
                    },
                    "Semester II - Constitutional Law I": {
                        "sub_topics": ["Preamble", "Fundamental Rights", "Directive Principles", "Fundamental Duties", "Constitutional Framework"],
                        "questions": 15
                    },
                    "Semester II - Legal History": {
                        "sub_topics": ["Evolution of Indian Legal System", "British Legal Reforms", "Personal Laws", "Codification of Laws", "Legal Landmarks"],
                        "questions": 10
                    },
                    "Semester II - Sociology II": {
                        "sub_topics": ["Indian Society", "Caste System", "Family and Marriage", "Religion in India", "Social Change"],
                        "questions": 10
                    },
                    "Semester II - English II": {
                        "sub_topics": ["Advanced Legal Writing", "Legal Drafting Basics", "Communication in Law", "Legal English", "Presentation Skills"],
                        "questions": 10
                    },
                    "Semester II - Legal Research & Moot Court": {
                        "sub_topics": ["Research Methodology", "Case Analysis", "Moot Court Procedure", "Legal Documentation", "Argumentation"],
                        "questions": 10
                    }
                }
            },
            "2nd Year": {
                "subjects": {
                    "Semester III - Family Law I": {
                        "sub_topics": ["Hindu Marriage Act", "Hindu Succession Act", "Guardianship", "Adoption", "Maintenance"],
                        "questions": 15
                    },
                    "Semester III - Law of Crimes I (IPC)": {
                        "sub_topics": ["General Principles of IPC", "Offences Against State", "Offences Against Human Body", "Kidnapping & Abduction", "Criminal Conspiracy"],
                        "questions": 15
                    },
                    "Semester III - Constitutional Law II": {
                        "sub_topics": ["Union Executive", "Parliament", "Judiciary", "Centre-State Relations", "Emergency Provisions"],
                        "questions": 15
                    },
                    "Semester III - History II": {
                        "sub_topics": ["Indian National Movement", "Freedom Struggle", "Constitutional Development", "Post-Independence India", "Modern Indian History"],
                        "questions": 10
                    },
                    "Semester III - Economics II": {
                        "sub_topics": ["Macroeconomics", "National Income", "Money and Banking", "Fiscal Policy", "Monetary Policy"],
                        "questions": 10
                    },
                    "Semester III - Political Science II": {
                        "sub_topics": ["Indian Constitution", "Federalism", "Electoral System", "Political Parties", "Pressure Groups"],
                        "questions": 10
                    },
                    "Semester IV - Family Law II": {
                        "sub_topics": ["Muslim Personal Law", "Christian Law", "Parsi Law", "Special Marriage Act", "Uniform Civil Code"],
                        "questions": 15
                    },
                    "Semester IV - Law of Crimes II": {
                        "sub_topics": ["Offences Against Property", "Cheating", "Forgery", "Criminal Breach of Trust", "Defences"],
                        "questions": 15
                    },
                    "Semester IV - Administrative Law": {
                        "sub_topics": ["Nature of Administrative Law", "Delegated Legislation", "Administrative Tribunals", "Judicial Review", "Natural Justice"],
                        "questions": 15
                    },
                    "Semester IV - History III": {
                        "sub_topics": ["Modern Europe", "World Wars", "International Relations", "UN and International Organizations", "Contemporary History"],
                        "questions": 10
                    },
                    "Semester IV - Economics III": {
                        "sub_topics": ["Economic Development", "Planning in India", "Industrial Policy", "Agricultural Economics", "International Trade"],
                        "questions": 10
                    },
                    "Semester IV - Political Science III": {
                        "sub_topics": ["International Relations", "Foreign Policy", "International Organizations", "Global Issues", "Diplomacy"],
                        "questions": 10
                    }
                }
            },
            "3rd Year": {
                "subjects": {
                    "Semester V - Environmental Laws": {
                        "sub_topics": ["Environmental Protection Act", "Wildlife Protection", "Water & Air Pollution Acts", "Forest Conservation", "Environmental Impact Assessment"],
                        "questions": 15
                    },
                    "Semester V - Code of Civil Procedure I": {
                        "sub_topics": ["Jurisdiction", "Res Judicata", "Place of Suing", "Parties to Suit", "Pleadings"],
                        "questions": 15
                    },
                    "Semester V - Code of Criminal Procedure I": {
                        "sub_topics": ["FIR and Investigation", "Arrest and Bail", "Search and Seizure", "Cognizable Offences", "Magistrate Powers"],
                        "questions": 15
                    },
                    "Semester V - Human Rights Law": {
                        "sub_topics": ["UDHR", "ICCPR", "ICESCR", "NHRC", "Human Rights Protection"],
                        "questions": 10
                    },
                    "Semester V - ADR": {
                        "sub_topics": ["Arbitration Act", "Conciliation", "Mediation", "Lok Adalat", "Alternative Dispute Resolution Mechanisms"],
                        "questions": 10
                    },
                    "Semester V - Sociology III": {
                        "sub_topics": ["Law and Deviance", "Crime and Society", "Social Control", "Juvenile Justice", "Criminology Basics"],
                        "questions": 10
                    },
                    "Semester VI - Jurisprudence": {
                        "sub_topics": ["Schools of Law", "Nature of Law", "Sources of Law", "Rights and Duties", "Legal Concepts"],
                        "questions": 15
                    },
                    "Semester VI - Law of Evidence": {
                        "sub_topics": ["Relevancy of Facts", "Burden of Proof", "Witnesses", "Documentary Evidence", "Examination of Witnesses"],
                        "questions": 15
                    },
                    "Semester VI - Code of Criminal Procedure II": {
                        "sub_topics": ["Trial Procedure", "Charge Framing", "Acquittal and Conviction", "Appeals and Revision", "Execution of Sentences"],
                        "questions": 15
                    },
                    "Semester VI - Property Law": {
                        "sub_topics": ["Transfer of Property Act", "Sale and Mortgage", "Lease and License", "Gift and Exchange", "Easements"],
                        "questions": 15
                    },
                    "Semester VI - Code of Civil Procedure II": {
                        "sub_topics": ["Suits", "Judgment and Decree", "Appeals", "Review and Revision", "Execution of Decrees"],
                        "questions": 15
                    },
                    "Semester VI - Public International Law": {
                        "sub_topics": ["Sources of International Law", "Treaties", "State Responsibility", "International Disputes", "Law of Sea"],
                        "questions": 10
                    }
                }
            },
            "4th Year": {
                "subjects": {
                    "Semester VII - Labour Law I": {
                        "sub_topics": ["Industrial Disputes Act", "Trade Unions Act", "Factories Act", "Minimum Wages Act", "Payment of Wages Act"],
                        "questions": 15
                    },
                    "Semester VII - Competition Law": {
                        "sub_topics": ["Competition Act 2002", "Anti-Competitive Agreements", "Abuse of Dominance", "Combinations", "Competition Commission"],
                        "questions": 15
                    },
                    "Semester VII - Company Law": {
                        "sub_topics": ["Incorporation", "Memorandum & Articles", "Directors", "Meetings", "Winding Up"],
                        "questions": 15
                    },
                    "Semester VII - Law & Emerging Technology": {
                        "sub_topics": ["IT Act 2000", "Cyber Crimes", "E-Commerce Law", "Data Protection", "Digital Signatures"],
                        "questions": 10
                    },
                    "Semester VII - Intellectual Property Rights I": {
                        "sub_topics": ["Patents Act", "Copyright Act", "Trade Marks Act", "Design Act", "IP Protection"],
                        "questions": 15
                    },
                    "Semester VII - Election Law": {
                        "sub_topics": ["Representation of People Act", "Electoral Process", "Election Commission", "Electoral Offences", "Election Petitions"],
                        "questions": 10
                    },
                    "Semester VIII - Intellectual Property Rights II": {
                        "sub_topics": ["International IP Treaties", "TRIPS Agreement", "IP Enforcement", "Geographical Indications", "Plant Varieties"],
                        "questions": 15
                    },
                    "Semester VIII - Interpretation of Statutes": {
                        "sub_topics": ["Rules of Interpretation", "Internal Aids", "External Aids", "Presumptions", "Maxims of Interpretation"],
                        "questions": 15
                    },
                    "Semester VIII - Labour Law II": {
                        "sub_topics": ["Employees Compensation Act", "ESI Act", "EPF Act", "Maternity Benefit Act", "Contract Labour Act"],
                        "questions": 15
                    },
                    "Semester VIII - International Trade Law": {
                        "sub_topics": ["WTO", "GATT", "Trade Remedies", "Customs Law", "Foreign Trade Policy"],
                        "questions": 10
                    },
                    "Semester VIII - Income Tax Law": {
                        "sub_topics": ["Residential Status", "Heads of Income", "Deductions", "Assessment", "Tax Planning"],
                        "questions": 15
                    },
                    "Semester VIII - Criminology": {
                        "sub_topics": ["Theories of Crime", "Types of Criminals", "Penology", "Victimology", "Prison Reforms"],
                        "questions": 10
                    }
                }
            },
            "5th Year": {
                "subjects": {
                    "Semester IX - Legal Ethics & Court Craft": {
                        "sub_topics": ["Professional Ethics", "Bar Council Rules", "Advocate's Duties", "Court Etiquette", "Client Relationship"],
                        "questions": 15
                    },
                    "Semester IX - Drafting, Pleading & Conveyancing": {
                        "sub_topics": ["Civil Drafting", "Criminal Drafting", "Conveyancing", "Legal Documents", "Petitions and Applications"],
                        "questions": 15
                    },
                    "Semester IX - Land and Real Estate Laws": {
                        "sub_topics": ["Land Acquisition Act", "RERA", "Stamp Act", "Registration Act", "Tenancy Laws"],
                        "questions": 15
                    },
                    "Semester IX - Banking and Insurance Law": {
                        "sub_topics": ["Banking Regulation Act", "Negotiable Instruments Act", "Insurance Act", "SARFAESI Act", "Banking Ombudsman"],
                        "questions": 10
                    },
                    "Semester IX - Media and Entertainment Law": {
                        "sub_topics": ["Press Laws", "Broadcasting Laws", "Cinematograph Act", "Censorship", "Media Ethics"],
                        "questions": 10
                    },
                    "Semester X - Dissertation": {
                        "sub_topics": ["Research Topic Selection", "Literature Review", "Research Methodology", "Data Analysis", "Thesis Writing"],
                        "questions": 10
                    },
                    "Semester X - Internship": {
                        "sub_topics": ["Law Firm Practice", "Court Experience", "Legal Aid", "Corporate Legal Department", "Practical Training"],
                        "questions": 10
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
