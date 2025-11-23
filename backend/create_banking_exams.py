"""
Script to create 10 Banking Examination entries in the database
Based on PDF analysis: SBI PO, IBPS PO, IBPS RRB PO, SBI Clerk, IBPS Clerk, 
LIC AAO, LIC ADO, NABARD Grade B, RBI Grade B, and IBPS SO
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone
import uuid

MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DATABASE_NAME = 'ceibaa'

# 10 Banking Exams Data Structure
BANKING_EXAMS = [
    {
        "id": str(uuid.uuid4()),
        "exam_name": "SBI PO",
        "exam_display_name": "SBI PO (Probationary Officer)",
        "category": "Banking Examinations",
        "exam_level": "Graduate",
        "total_marks": 250,
        "subjects": [
            {
                "subject_name": "Quantitative Aptitude",
                "topics": [
                    {"topic": "Data Interpretation", "sub_topics": ["Caselet DI", "Mixed/Radar Graphs", "Data Sufficiency"], "questions": 12, "marks": 12},
                    {"topic": "Arithmetic", "sub_topics": ["Probability", "Permutation & Combination", "Ratio & Proportion"], "questions": 14, "marks": 14},
                    {"topic": "Simplification", "sub_topics": ["BODMAS", "Approximation"], "questions": 5, "marks": 5},
                    {"topic": "Number Series", "sub_topics": ["Missing Series", "Wrong Term"], "questions": 4, "marks": 4}
                ]
            },
            {
                "subject_name": "Reasoning Ability",
                "topics": [
                    {"topic": "Puzzles & Seating", "sub_topics": ["Circular Seating", "Linear Seating", "Box & Floor Puzzles"], "questions": 22, "marks": 22},
                    {"topic": "Syllogism", "sub_topics": ["Standard Syllogism", "Reverse Syllogism"], "questions": 4, "marks": 4},
                    {"topic": "Inequality", "sub_topics": ["Direct Inequality", "Coded Inequality"], "questions": 4, "marks": 4},
                    {"topic": "Direction & Distance", "sub_topics": ["Direction Sense", "Distance Calculation"], "questions": 5, "marks": 5}
                ]
            },
            {
                "subject_name": "English Language",
                "topics": [
                    {"topic": "Reading Comprehension", "sub_topics": ["Passage Analysis", "Inference Questions"], "questions": 10, "marks": 10},
                    {"topic": "Cloze Test", "sub_topics": ["Fill in the Blanks"], "questions": 5, "marks": 5},
                    {"topic": "Error Spotting", "sub_topics": ["Grammar Errors", "Sentence Correction"], "questions": 5, "marks": 5},
                    {"topic": "Para Jumbles", "sub_topics": ["Sentence Rearrangement"], "questions": 5, "marks": 5},
                    {"topic": "Vocabulary", "sub_topics": ["Synonyms", "Antonyms"], "questions": 5, "marks": 5}
                ]
            }
        ]
    },
    {
        "id": str(uuid.uuid4()),
        "exam_name": "IBPS PO",
        "exam_display_name": "IBPS PO (Probationary Officer)",
        "category": "Banking Examinations",
        "exam_level": "Graduate",
        "total_marks": 250,
        "subjects": [
            {
                "subject_name": "Quantitative Aptitude",
                "topics": [
                    {"topic": "Simplification", "sub_topics": ["BODMAS", "Square Root", "Cube Root"], "questions": 8, "marks": 8},
                    {"topic": "Approximation", "sub_topics": ["Estimation", "Rounding"], "questions": 3, "marks": 3},
                    {"topic": "Number Series", "sub_topics": ["Missing Number", "Wrong Number"], "questions": 5, "marks": 5},
                    {"topic": "Quadratic Equations", "sub_topics": ["Standard Form", "Roots Comparison"], "questions": 4, "marks": 4},
                    {"topic": "Data Interpretation", "sub_topics": ["Table", "Bar Chart", "Line Chart"], "questions": 7, "marks": 7},
                    {"topic": "Arithmetic", "sub_topics": ["Ratio & Proportion", "Profit & Loss", "Time & Work", "SI/CI"], "questions": 8, "marks": 8}
                ]
            },
            {
                "subject_name": "Reasoning Ability",
                "topics": [
                    {"topic": "Puzzles & Seating", "sub_topics": ["Circular Seating", "Linear Seating", "Box & Floor Puzzles", "Multi-variable Puzzles"], "questions": 20, "marks": 20},
                    {"topic": "Syllogism", "sub_topics": ["Advanced Syllogism", "Reverse Syllogism"], "questions": 4, "marks": 4},
                    {"topic": "Inequality", "sub_topics": ["Coded Inequality"], "questions": 4, "marks": 4},
                    {"topic": "Blood Relations", "sub_topics": ["Family Tree", "Coded Relations"], "questions": 3, "marks": 3},
                    {"topic": "Direction Sense", "sub_topics": ["Direction Problems"], "questions": 2, "marks": 2},
                    {"topic": "Order & Ranking", "sub_topics": ["Ranking Problems"], "questions": 2, "marks": 2}
                ]
            },
            {
                "subject_name": "English Language",
                "topics": [
                    {"topic": "Reading Comprehension", "sub_topics": ["Passage Based"], "questions": 10, "marks": 10},
                    {"topic": "Error Spotting", "sub_topics": ["Grammar Errors"], "questions": 5, "marks": 5},
                    {"topic": "Phrase Replacement", "sub_topics": ["Sentence Improvement"], "questions": 4, "marks": 4},
                    {"topic": "Sentence Connectors", "sub_topics": ["Joining Sentences"], "questions": 3, "marks": 3},
                    {"topic": "Cloze Test", "sub_topics": ["Fill Blanks"], "questions": 4, "marks": 4},
                    {"topic": "Vocabulary", "sub_topics": ["Single Fillers", "Double Fillers"], "questions": 4, "marks": 4}
                ]
            }
        ]
    },
    {
        "id": str(uuid.uuid4()),
        "exam_name": "IBPS RRB PO",
        "exam_display_name": "IBPS RRB PO (Officer Scale I)",
        "category": "Banking Examinations",
        "exam_level": "Graduate",
        "total_marks": 200,
        "subjects": [
            {
                "subject_name": "Reasoning Ability",
                "topics": [
                    {"topic": "Puzzles & Seating", "sub_topics": ["Linear Seating", "Circular Seating", "Box/Floor Puzzles", "Day/Month Puzzles"], "questions": 20, "marks": 30},
                    {"topic": "Syllogism", "sub_topics": ["Basic Syllogism", "Possibility Cases"], "questions": 4, "marks": 6},
                    {"topic": "Inequality", "sub_topics": ["Direct", "Coded"], "questions": 4, "marks": 6},
                    {"topic": "Blood Relations", "sub_topics": ["Coded Relations"], "questions": 3, "marks": 4},
                    {"topic": "Direction Sense", "sub_topics": ["Distance & Direction"], "questions": 3, "marks": 4},
                    {"topic": "Coding-Decoding", "sub_topics": ["Letter Coding"], "questions": 3, "marks": 4},
                    {"topic": "Alphabet Series", "sub_topics": ["Missing Letters"], "questions": 3, "marks": 4}
                ]
            },
            {
                "subject_name": "Numerical Ability",
                "topics": [
                    {"topic": "Simplification", "sub_topics": ["BODMAS", "Square Root"], "questions": 12, "marks": 18},
                    {"topic": "Approximation", "sub_topics": ["Estimation"], "questions": 4, "marks": 6},
                    {"topic": "Number Series", "sub_topics": ["Missing Number", "Wrong Number"], "questions": 5, "marks": 7},
                    {"topic": "Quadratic Equations", "sub_topics": ["Finding Roots"], "questions": 3, "marks": 4},
                    {"topic": "Data Interpretation", "sub_topics": ["Table", "Bar Chart"], "questions": 7, "marks": 10},
                    {"topic": "Arithmetic", "sub_topics": ["P&L", "Ratio", "Ages", "Time & Work", "SI/CI"], "questions": 9, "marks": 13}
                ]
            },
            {
                "subject_name": "General Awareness",
                "topics": [
                    {"topic": "Current Affairs", "sub_topics": ["Last 6 Months", "Rural India Focus"], "questions": 20, "marks": 20},
                    {"topic": "Banking Awareness", "sub_topics": ["RBI Policies", "Financial Markets"], "questions": 12, "marks": 12},
                    {"topic": "Government Schemes", "sub_topics": ["Rural Development", "Financial Inclusion"], "questions": 5, "marks": 5},
                    {"topic": "Static GK", "sub_topics": ["Regional Banks HQ"], "questions": 3, "marks": 3}
                ]
            }
        ]
    },
    {
        "id": str(uuid.uuid4()),
        "exam_name": "SBI Clerk",
        "exam_display_name": "SBI Clerk (Junior Associate)",
        "category": "Banking Examinations",
        "exam_level": "Graduate",
        "total_marks": 200,
        "subjects": [
            {
                "subject_name": "Numerical Ability",
                "topics": [
                    {"topic": "Simplification", "sub_topics": ["BODMAS", "Approximation"], "questions": 12, "marks": 12},
                    {"topic": "Number Series", "sub_topics": ["Missing Series", "Wrong Term"], "questions": 5, "marks": 5},
                    {"topic": "Quadratic Equations", "sub_topics": ["Roots Finding"], "questions": 3, "marks": 3},
                    {"topic": "Data Interpretation", "sub_topics": ["Table", "Bar Chart"], "questions": 6, "marks": 6},
                    {"topic": "Arithmetic", "sub_topics": ["P&L", "Ratio", "Ages", "Time & Work", "Percentage", "SI/CI", "Mensuration"], "questions": 9, "marks": 9}
                ]
            },
            {
                "subject_name": "Reasoning Ability",
                "topics": [
                    {"topic": "Puzzles & Seating", "sub_topics": ["Linear Seating", "Circular Seating", "Box/Floor Puzzles"], "questions": 16, "marks": 16},
                    {"topic": "Syllogism", "sub_topics": ["Basic Syllogism"], "questions": 4, "marks": 4},
                    {"topic": "Inequality", "sub_topics": ["Direct Inequality"], "questions": 4, "marks": 4},
                    {"topic": "Blood Relations", "sub_topics": ["Family Tree"], "questions": 3, "marks": 3},
                    {"topic": "Direction Sense", "sub_topics": ["Direction Problems"], "questions": 3, "marks": 3},
                    {"topic": "Alphabet Series", "sub_topics": ["Missing Letters"], "questions": 3, "marks": 3},
                    {"topic": "Coding-Decoding", "sub_topics": ["Letter Substitution"], "questions": 2, "marks": 2}
                ]
            },
            {
                "subject_name": "English Language",
                "topics": [
                    {"topic": "Reading Comprehension", "sub_topics": ["Passage Analysis"], "questions": 8, "marks": 8},
                    {"topic": "Cloze Test", "sub_topics": ["Fill in Blanks"], "questions": 5, "marks": 5},
                    {"topic": "Error Spotting", "sub_topics": ["Grammar Errors"], "questions": 5, "marks": 5},
                    {"topic": "Para Jumbles", "sub_topics": ["Sentence Arrangement"], "questions": 4, "marks": 4},
                    {"topic": "Vocabulary", "sub_topics": ["Synonyms", "Antonyms", "Fill in Blanks"], "questions": 8, "marks": 8}
                ]
            }
        ]
    },
    {
        "id": str(uuid.uuid4()),
        "exam_name": "IBPS Clerk",
        "exam_display_name": "IBPS Clerk (Clerical Cadre)",
        "category": "Banking Examinations",
        "exam_level": "Graduate",
        "total_marks": 200,
        "subjects": [
            {
                "subject_name": "Numerical Ability",
                "topics": [
                    {"topic": "Simplification", "sub_topics": ["BODMAS", "Square Root", "Cube Root"], "questions": 10, "marks": 10},
                    {"topic": "Approximation", "sub_topics": ["Estimation"], "questions": 3, "marks": 3},
                    {"topic": "Number Series", "sub_topics": ["Missing Number", "Wrong Number"], "questions": 4, "marks": 4},
                    {"topic": "Quadratic Equations", "sub_topics": ["Finding Roots"], "questions": 3, "marks": 3},
                    {"topic": "Data Interpretation", "sub_topics": ["Table DI", "Bar Chart"], "questions": 5, "marks": 5},
                    {"topic": "Arithmetic", "sub_topics": ["P&L", "Ratio", "Partnership", "Time & Work", "SI/CI", "Speed & Distance"], "questions": 10, "marks": 10}
                ]
            },
            {
                "subject_name": "Reasoning Ability",
                "topics": [
                    {"topic": "Puzzles & Seating", "sub_topics": ["Linear Seating", "Circular Seating", "Box Puzzles", "Floor Puzzles"], "questions": 17, "marks": 17},
                    {"topic": "Syllogism", "sub_topics": ["Basic Syllogism"], "questions": 4, "marks": 4},
                    {"topic": "Inequality", "sub_topics": ["Direct Inequality"], "questions": 4, "marks": 4},
                    {"topic": "Blood Relations", "sub_topics": ["Family Tree"], "questions": 3, "marks": 3},
                    {"topic": "Direction Sense", "sub_topics": ["Direction"], "questions": 3, "marks": 3},
                    {"topic": "Coding-Decoding", "sub_topics": ["Letter Coding"], "questions": 2, "marks": 2},
                    {"topic": "Alphabet Series", "sub_topics": ["Missing Letters"], "questions": 2, "marks": 2}
                ]
            },
            {
                "subject_name": "English Language",
                "topics": [
                    {"topic": "Reading Comprehension", "sub_topics": ["Passage Based"], "questions": 8, "marks": 8},
                    {"topic": "Cloze Test", "sub_topics": ["Fill Blanks"], "questions": 5, "marks": 5},
                    {"topic": "Error Spotting", "sub_topics": ["Grammar"], "questions": 5, "marks": 5},
                    {"topic": "Para Jumbles", "sub_topics": ["Rearrangement"], "questions": 4, "marks": 4},
                    {"topic": "Vocabulary", "sub_topics": ["Synonyms", "Antonyms"], "questions": 4, "marks": 4},
                    {"topic": "Phrase Replacement", "sub_topics": ["Improvement"], "questions": 4, "marks": 4}
                ]
            }
        ]
    },
    {
        "id": str(uuid.uuid4()),
        "exam_name": "IBPS RRB Clerk",
        "exam_display_name": "IBPS RRB Office Assistant (Clerk)",
        "category": "Banking Examinations",
        "exam_level": "Graduate",
        "total_marks": 200,
        "subjects": [
            {
                "subject_name": "Reasoning Ability",
                "topics": [
                    {"topic": "Puzzles & Seating", "sub_topics": ["Linear Seating", "Circular Seating", "Box-Based", "Floor-Based", "Day/Month Based"], "questions": 16, "marks": 24},
                    {"topic": "Syllogism", "sub_topics": ["Basic Syllogism"], "questions": 4, "marks": 6},
                    {"topic": "Inequality", "sub_topics": ["Direct Inequality"], "questions": 4, "marks": 6},
                    {"topic": "Blood Relations", "sub_topics": ["Family Relations"], "questions": 3, "marks": 4},
                    {"topic": "Direction Sense", "sub_topics": ["Direction"], "questions": 3, "marks": 4},
                    {"topic": "Coding-Decoding", "sub_topics": ["Letter Coding"], "questions": 4, "marks": 6},
                    {"topic": "Alphabet Series", "sub_topics": ["Missing Letters"], "questions": 3, "marks": 4},
                    {"topic": "Input-Output", "sub_topics": ["Machine Input"], "questions": 3, "marks": 4}
                ]
            },
            {
                "subject_name": "Numerical Ability",
                "topics": [
                    {"topic": "Simplification", "sub_topics": ["BODMAS", "Calculation"], "questions": 12, "marks": 18},
                    {"topic": "Approximation", "sub_topics": ["Estimation"], "questions": 4, "marks": 6},
                    {"topic": "Number Series", "sub_topics": ["Missing Series"], "questions": 5, "marks": 7},
                    {"topic": "Quadratic Equations", "sub_topics": ["Roots"], "questions": 3, "marks": 4},
                    {"topic": "Data Interpretation", "sub_topics": ["Simple DI", "Tabular"], "questions": 7, "marks": 10},
                    {"topic": "Arithmetic", "sub_topics": ["P&L", "Ratio", "Ages", "Partnership", "Time & Work", "Percentage", "SI/CI"], "questions": 9, "marks": 13}
                ]
            },
            {
                "subject_name": "Computer Knowledge",
                "topics": [
                    {"topic": "Hardware/Software", "sub_topics": ["Basics", "Components"], "questions": 8, "marks": 8},
                    {"topic": "MS Office", "sub_topics": ["Word", "Excel", "PowerPoint"], "questions": 6, "marks": 6},
                    {"topic": "Networking", "sub_topics": ["LAN", "WAN", "Protocols"], "questions": 7, "marks": 7},
                    {"topic": "Internet", "sub_topics": ["Browsers", "Email"], "questions": 7, "marks": 7},
                    {"topic": "Security", "sub_topics": ["Virus", "Firewall"], "questions": 5, "marks": 5},
                    {"topic": "History of Computers", "sub_topics": ["Evolution"], "questions": 3, "marks": 3}
                ]
            }
        ]
    },
    {
        "id": str(uuid.uuid4()),
        "exam_name": "LIC AAO",
        "exam_display_name": "LIC AAO (Generalist)",
        "category": "Banking Examinations",
        "exam_level": "Graduate",
        "total_marks": 300,
        "subjects": [
            {
                "subject_name": "Reasoning Ability",
                "topics": [
                    {"topic": "Puzzles & Seating", "sub_topics": ["Box/Floor", "Day/Month", "Linear", "Circular"], "questions": 16, "marks": 16},
                    {"topic": "Syllogism", "sub_topics": ["Standard", "Possibility"], "questions": 4, "marks": 4},
                    {"topic": "Inequality", "sub_topics": ["Coded Inequality"], "questions": 4, "marks": 4},
                    {"topic": "Blood Relations", "sub_topics": ["Family Tree"], "questions": 3, "marks": 3},
                    {"topic": "Direction Sense", "sub_topics": ["Direction"], "questions": 3, "marks": 3},
                    {"topic": "Coding-Decoding", "sub_topics": ["Letter Coding"], "questions": 3, "marks": 3},
                    {"topic": "Input-Output", "sub_topics": ["Machine Input"], "questions": 2, "marks": 2}
                ]
            },
            {
                "subject_name": "Quantitative Aptitude",
                "topics": [
                    {"topic": "Simplification", "sub_topics": ["BODMAS"], "questions": 7, "marks": 7},
                    {"topic": "Data Interpretation", "sub_topics": ["Table", "Bar", "Line Chart"], "questions": 5, "marks": 5},
                    {"topic": "Number Series", "sub_topics": ["Missing Series"], "questions": 4, "marks": 4},
                    {"topic": "Quadratic Equations", "sub_topics": ["Roots"], "questions": 3, "marks": 3},
                    {"topic": "Arithmetic", "sub_topics": ["P&L", "SI/CI", "Ratio", "Time & Work", "Speed", "Averages", "Mensuration"], "questions": 16, "marks": 16}
                ]
            },
            {
                "subject_name": "English Language",
                "topics": [
                    {"topic": "Reading Comprehension", "sub_topics": ["Passage Analysis"], "questions": 9, "marks": 9},
                    {"topic": "Error Spotting", "sub_topics": ["Grammar Errors"], "questions": 5, "marks": 5},
                    {"topic": "Sentence Correction", "sub_topics": ["Grammar"], "questions": 4, "marks": 4},
                    {"topic": "Cloze Test", "sub_topics": ["Fill Blanks"], "questions": 5, "marks": 5},
                    {"topic": "Vocabulary", "sub_topics": ["Synonyms", "Antonyms", "Fill in Blanks"], "questions": 7, "marks": 7}
                ]
            }
        ]
    },
    {
        "id": str(uuid.uuid4()),
        "exam_name": "LIC ADO",
        "exam_display_name": "LIC ADO (Apprentice Development Officer)",
        "category": "Banking Examinations",
        "exam_level": "Graduate",
        "total_marks": 300,
        "subjects": [
            {
                "subject_name": "Reasoning Ability",
                "topics": [
                    {"topic": "Puzzles & Seating", "sub_topics": ["Linear", "Circular", "Box-Based", "Floor-Based", "Day/Month"], "questions": 16, "marks": 16},
                    {"topic": "Syllogism", "sub_topics": ["Basic", "Possibility"], "questions": 4, "marks": 4},
                    {"topic": "Inequality", "sub_topics": ["Direct", "Coded"], "questions": 4, "marks": 4},
                    {"topic": "Blood Relations", "sub_topics": ["Family Tree"], "questions": 3, "marks": 3},
                    {"topic": "Direction Sense", "sub_topics": ["Direction"], "questions": 3, "marks": 3},
                    {"topic": "Coding-Decoding", "sub_topics": ["Letter Coding"], "questions": 3, "marks": 3},
                    {"topic": "Input-Output", "sub_topics": ["Machine Input"], "questions": 2, "marks": 2}
                ]
            },
            {
                "subject_name": "Numerical Ability",
                "topics": [
                    {"topic": "Simplification", "sub_topics": ["BODMAS", "Calculation"], "questions": 7, "marks": 7},
                    {"topic": "Data Interpretation", "sub_topics": ["Table", "Bar Chart"], "questions": 5, "marks": 5},
                    {"topic": "Number Series", "sub_topics": ["Missing Number"], "questions": 4, "marks": 4},
                    {"topic": "Quadratic Equations", "sub_topics": ["Finding Roots"], "questions": 3, "marks": 3},
                    {"topic": "Arithmetic", "sub_topics": ["P&L", "SI/CI", "Ratio", "Partnership", "Time & Work", "Speed", "Mensuration", "Mixture"], "questions": 16, "marks": 16}
                ]
            },
            {
                "subject_name": "English Language",
                "topics": [
                    {"topic": "Reading Comprehension", "sub_topics": ["Passage Based"], "questions": 9, "marks": 9},
                    {"topic": "Error Spotting", "sub_topics": ["Grammar Errors"], "questions": 5, "marks": 5},
                    {"topic": "Sentence Correction", "sub_topics": ["Grammar"], "questions": 4, "marks": 4},
                    {"topic": "Cloze Test", "sub_topics": ["Fill Blanks"], "questions": 5, "marks": 5},
                    {"topic": "Para Jumbles", "sub_topics": ["Rearrangement"], "questions": 3, "marks": 3},
                    {"topic": "Vocabulary", "sub_topics": ["Synonyms", "Antonyms", "Idioms"], "questions": 4, "marks": 4}
                ]
            }
        ]
    },
    {
        "id": str(uuid.uuid4()),
        "exam_name": "NABARD Grade B",
        "exam_display_name": "NABARD Grade B",
        "category": "Banking Examinations",
        "exam_level": "Post Graduate",
        "total_marks": 200,
        "subjects": [
            {
                "subject_name": "Economic & Social Issues",
                "topics": [
                    {"topic": "Socio-Economic Topics", "sub_topics": ["Poverty Measurement", "Poverty Alleviation", "Population Trends", "Economic Reforms"], "questions": 15, "marks": 15},
                    {"topic": "Social Justice", "sub_topics": ["SC/ST/OBC Issues", "Human Development", "Social Movements", "Positive Discrimination"], "questions": 12, "marks": 12}
                ]
            },
            {
                "subject_name": "Agriculture & Rural Development",
                "topics": [
                    {"topic": "Agriculture", "sub_topics": ["Soil Science", "Crop Production", "Water Resources", "Farm Machinery", "Climate Change"], "questions": 16, "marks": 16},
                    {"topic": "Rural Development", "sub_topics": ["Panchayati Raj", "Rural Credit", "NABARD Role", "Government Schemes"], "questions": 14, "marks": 14}
                ]
            },
            {
                "subject_name": "General Awareness",
                "topics": [
                    {"topic": "Current Affairs", "sub_topics": ["Last 6-8 months", "RBI/NABARD Notifications"], "questions": 15, "marks": 15},
                    {"topic": "Financial Awareness", "sub_topics": ["RBI Updates", "NABARD Updates", "Banking Terms"], "questions": 8, "marks": 8},
                    {"topic": "Government Schemes", "sub_topics": ["ARD/ESI Related"], "questions": 6, "marks": 6},
                    {"topic": "Appointments", "sub_topics": ["Key Appointments"], "questions": 4, "marks": 4}
                ]
            },
            {
                "subject_name": "Reasoning Ability",
                "topics": [
                    {"topic": "Puzzles", "sub_topics": ["Linear", "Circular", "Box", "Floor"], "questions": 10, "marks": 10},
                    {"topic": "Syllogism", "sub_topics": ["Standard"], "questions": 3, "marks": 3},
                    {"topic": "Blood Relations", "sub_topics": ["Family Tree"], "questions": 2, "marks": 2}
                ]
            },
            {
                "subject_name": "Quantitative Aptitude",
                "topics": [
                    {"topic": "Simplification", "sub_topics": ["BODMAS"], "questions": 5, "marks": 5},
                    {"topic": "Data Interpretation", "sub_topics": ["Table", "Bar", "Line"], "questions": 5, "marks": 5},
                    {"topic": "Arithmetic", "sub_topics": ["P&L", "SI/CI", "Ratio", "Time & Work"], "questions": 8, "marks": 8}
                ]
            }
        ]
    },
    {
        "id": str(uuid.uuid4()),
        "exam_name": "RBI Grade B",
        "exam_display_name": "RBI Grade B (Officer)",
        "category": "Banking Examinations",
        "exam_level": "Post Graduate",
        "total_marks": 200,
        "subjects": [
            {
                "subject_name": "General Awareness",
                "topics": [
                    {"topic": "Current Affairs", "sub_topics": ["Last 6-8 months", "RBI Circulars", "Monetary Policy"], "questions": 33, "marks": 33},
                    {"topic": "Static Knowledge", "sub_topics": ["Indian Financial System", "Banking Terms"], "questions": 27, "marks": 27},
                    {"topic": "Reports & Indices", "sub_topics": ["World Bank", "IMF Reports"], "questions": 10, "marks": 10},
                    {"topic": "Government Schemes", "sub_topics": ["Union Budget", "Economic Survey"], "questions": 10, "marks": 10}
                ]
            },
            {
                "subject_name": "Reasoning Ability",
                "topics": [
                    {"topic": "Puzzles & Seating", "sub_topics": ["Multi-variable", "Complex Arrangements"], "questions": 23, "marks": 23},
                    {"topic": "Machine Input-Output", "sub_topics": ["Complex Logic"], "questions": 9, "marks": 9},
                    {"topic": "Data Sufficiency", "sub_topics": ["3 Statements"], "questions": 6, "marks": 6},
                    {"topic": "Logical Reasoning", "sub_topics": ["Statement/Argument"], "questions": 13, "marks": 13},
                    {"topic": "Inequality", "sub_topics": ["Complex Inequality"], "questions": 9, "marks": 9}
                ]
            },
            {
                "subject_name": "English Language",
                "topics": [
                    {"topic": "Reading Comprehension", "sub_topics": ["Advanced RC", "Inference Based"], "questions": 11, "marks": 11},
                    {"topic": "Error Spotting", "sub_topics": ["Advanced Grammar"], "questions": 7, "marks": 7},
                    {"topic": "Para Jumbles", "sub_topics": ["Complex Rearrangement"], "questions": 5, "marks": 5},
                    {"topic": "Vocabulary", "sub_topics": ["Synonyms", "Antonyms"], "questions": 4, "marks": 4},
                    {"topic": "Sentence Completion", "sub_topics": ["Fill Blanks"], "questions": 3, "marks": 3}
                ]
            },
            {
                "subject_name": "Quantitative Aptitude",
                "topics": [
                    {"topic": "Data Interpretation", "sub_topics": ["Caselets", "Radar DI", "Missing DI"], "questions": 11, "marks": 11},
                    {"topic": "Data Sufficiency", "sub_topics": ["Statement Based"], "questions": 5, "marks": 5},
                    {"topic": "Arithmetic", "sub_topics": ["Time Speed Distance", "P&L", "Probability"], "questions": 9, "marks": 9},
                    {"topic": "Simplification", "sub_topics": ["Advanced BODMAS"], "questions": 5, "marks": 5}
                ]
            }
        ]
    },
    {
        "id": str(uuid.uuid4()),
        "exam_name": "IBPS SO",
        "exam_display_name": "IBPS SO (Specialist Officer)",
        "category": "Banking Examinations",
        "exam_level": "Graduate/Post Graduate",
        "total_marks": 250,
        "subjects": [
            {
                "subject_name": "Reasoning",
                "topics": [
                    {"topic": "Puzzles & Seating", "sub_topics": ["Linear", "Circular", "Box", "Floor"], "questions": 20, "marks": 20},
                    {"topic": "Syllogism", "sub_topics": ["Basic", "Advanced"], "questions": 5, "marks": 5},
                    {"topic": "Inequality", "sub_topics": ["Direct", "Coded"], "questions": 5, "marks": 5},
                    {"topic": "Miscellaneous", "sub_topics": ["Blood Relations", "Direction", "Coding"], "questions": 10, "marks": 10}
                ]
            },
            {
                "subject_name": "Quantitative Aptitude",
                "topics": [
                    {"topic": "Data Interpretation", "sub_topics": ["Table", "Bar", "Line", "Pie Chart"], "questions": 10, "marks": 10},
                    {"topic": "Arithmetic", "sub_topics": ["P&L", "SI/CI", "Time & Work", "Speed", "Ratio", "Percentage"], "questions": 15, "marks": 15},
                    {"topic": "Simplification", "sub_topics": ["BODMAS", "Approximation"], "questions": 8, "marks": 8},
                    {"topic": "Number Series", "sub_topics": ["Missing", "Wrong"], "questions": 4, "marks": 4},
                    {"topic": "Quadratic Equations", "sub_topics": ["Roots"], "questions": 3, "marks": 3}
                ]
            },
            {
                "subject_name": "English Language",
                "topics": [
                    {"topic": "Reading Comprehension", "sub_topics": ["Passage Based"], "questions": 10, "marks": 10},
                    {"topic": "Error Spotting", "sub_topics": ["Grammar"], "questions": 6, "marks": 6},
                    {"topic": "Cloze Test", "sub_topics": ["Fill Blanks"], "questions": 5, "marks": 5},
                    {"topic": "Para Jumbles", "sub_topics": ["Rearrangement"], "questions": 4, "marks": 4},
                    {"topic": "Vocabulary", "sub_topics": ["Synonyms", "Antonyms", "Fillers"], "questions": 5, "marks": 5}
                ]
            },
            {
                "subject_name": "General Awareness",
                "topics": [
                    {"topic": "Current Affairs", "sub_topics": ["Last 6 months"], "questions": 25, "marks": 25},
                    {"topic": "Banking Awareness", "sub_topics": ["RBI Policies", "Banking Terms"], "questions": 15, "marks": 15},
                    {"topic": "Static GK", "sub_topics": ["Indian Geography", "History"], "questions": 10, "marks": 10}
                ]
            }
        ]
    },
    {
        "id": str(uuid.uuid4()),
        "exam_name": "RRB NTPC",
        "exam_display_name": "RRB NTPC (Non-Technical Popular Categories)",
        "category": "Banking Examinations",
        "exam_level": "Graduate",
        "total_marks": 120,
        "subjects": [
            {
                "subject_name": "General Awareness",
                "topics": [
                    {"topic": "Current Affairs", "sub_topics": ["National", "International", "Sports"], "questions": 20, "marks": 20},
                    {"topic": "Static GK", "sub_topics": ["Indian Geography", "History", "Polity"], "questions": 10, "marks": 10},
                    {"topic": "Science & Technology", "sub_topics": ["Physics", "Chemistry", "Biology"], "questions": 10, "marks": 10}
                ]
            },
            {
                "subject_name": "Mathematics",
                "topics": [
                    {"topic": "Arithmetic", "sub_topics": ["Percentage", "Ratio", "Average", "P&L", "SI/CI", "Time & Work"], "questions": 20, "marks": 20},
                    {"topic": "Algebra", "sub_topics": ["Linear Equations", "Quadratic Equations"], "questions": 5, "marks": 5},
                    {"topic": "Geometry", "sub_topics": ["Mensuration", "Trigonometry"], "questions": 5, "marks": 5}
                ]
            },
            {
                "subject_name": "General Intelligence",
                "topics": [
                    {"topic": "Logical Reasoning", "sub_topics": ["Syllogism", "Statement & Conclusion"], "questions": 10, "marks": 10},
                    {"topic": "Puzzles", "sub_topics": ["Seating Arrangement", "Blood Relations"], "questions": 10, "marks": 10},
                    {"topic": "Coding-Decoding", "sub_topics": ["Letter Coding", "Number Coding"], "questions": 5, "marks": 5},
                    {"topic": "Series", "sub_topics": ["Number Series", "Letter Series"], "questions": 5, "marks": 5}
                ]
            }
        ]
    },
    {
        "id": str(uuid.uuid4()),
        "exam_name": "SIDBI Grade A",
        "exam_display_name": "SIDBI Grade A (Assistant Manager)",
        "category": "Banking Examinations",
        "exam_level": "Post Graduate",
        "total_marks": 200,
        "subjects": [
            {
                "subject_name": "Reasoning & Computer",
                "topics": [
                    {"topic": "Puzzles & Seating", "sub_topics": ["Complex Puzzles", "Multi-layer Seating"], "questions": 18, "marks": 18},
                    {"topic": "Data Sufficiency", "sub_topics": ["3 Statements"], "questions": 5, "marks": 5},
                    {"topic": "Logical Reasoning", "sub_topics": ["Syllogism", "Statement/Argument"], "questions": 10, "marks": 10},
                    {"topic": "Computer Knowledge", "sub_topics": ["Hardware", "Software", "Networking", "MS Office"], "questions": 7, "marks": 7}
                ]
            },
            {
                "subject_name": "Quantitative Aptitude",
                "topics": [
                    {"topic": "Data Interpretation", "sub_topics": ["Caselet", "Mixed Graphs", "Table DI"], "questions": 20, "marks": 20},
                    {"topic": "Arithmetic", "sub_topics": ["P&L", "SI/CI", "Time & Work", "Speed", "Ratio", "Probability"], "questions": 15, "marks": 15},
                    {"topic": "Simplification", "sub_topics": ["Advanced BODMAS"], "questions": 5, "marks": 5}
                ]
            },
            {
                "subject_name": "English Language",
                "topics": [
                    {"topic": "Reading Comprehension", "sub_topics": ["Advanced RC", "Inference"], "questions": 12, "marks": 12},
                    {"topic": "Grammar", "sub_topics": ["Error Spotting", "Phrase Replacement"], "questions": 10, "marks": 10},
                    {"topic": "Vocabulary", "sub_topics": ["Cloze Test", "Fillers"], "questions": 8, "marks": 8}
                ]
            },
            {
                "subject_name": "General Awareness",
                "topics": [
                    {"topic": "Current Affairs", "sub_topics": ["Last 6 months", "MSME Focus"], "questions": 20, "marks": 20},
                    {"topic": "Banking Awareness", "sub_topics": ["SIDBI", "RBI Policies"], "questions": 10, "marks": 10},
                    {"topic": "Economic Survey", "sub_topics": ["MSME Sector", "Financial Inclusion"], "questions": 10, "marks": 10}
                ]
            }
        ]
    },
    {
        "id": str(uuid.uuid4()),
        "exam_name": "SEBI Grade A",
        "exam_display_name": "SEBI Grade A (Assistant Manager)",
        "category": "Banking Examinations",
        "exam_level": "Post Graduate",
        "total_marks": 200,
        "subjects": [
            {
                "subject_name": "General Awareness",
                "topics": [
                    {"topic": "Current Affairs", "sub_topics": ["Securities Market", "SEBI Regulations"], "questions": 25, "marks": 25},
                    {"topic": "Capital Markets", "sub_topics": ["Stock Exchange", "Derivatives", "Mutual Funds"], "questions": 20, "marks": 20},
                    {"topic": "Economic Affairs", "sub_topics": ["Budget", "Economic Survey", "Financial Policies"], "questions": 15, "marks": 15}
                ]
            },
            {
                "subject_name": "Quantitative Aptitude",
                "topics": [
                    {"topic": "Data Interpretation", "sub_topics": ["Advanced DI", "Caselet", "Mixed Charts"], "questions": 15, "marks": 15},
                    {"topic": "Arithmetic", "sub_topics": ["P&L", "SI/CI", "Time & Work", "Ratio", "Percentage"], "questions": 12, "marks": 12},
                    {"topic": "Algebra", "sub_topics": ["Linear Equations", "Quadratic Equations"], "questions": 5, "marks": 5},
                    {"topic": "Statistics", "sub_topics": ["Mean", "Median", "Mode", "Standard Deviation"], "questions": 3, "marks": 3}
                ]
            },
            {
                "subject_name": "English Language",
                "topics": [
                    {"topic": "Reading Comprehension", "sub_topics": ["Financial Passages", "Inference Questions"], "questions": 12, "marks": 12},
                    {"topic": "Grammar", "sub_topics": ["Error Detection", "Sentence Improvement"], "questions": 10, "marks": 10},
                    {"topic": "Vocabulary", "sub_topics": ["Synonyms", "Antonyms", "Cloze Test"], "questions": 8, "marks": 8}
                ]
            },
            {
                "subject_name": "Reasoning Ability",
                "topics": [
                    {"topic": "Puzzles", "sub_topics": ["Complex Puzzles", "Multi-variable"], "questions": 20, "marks": 20},
                    {"topic": "Data Sufficiency", "sub_topics": ["Statement Based"], "questions": 5, "marks": 5},
                    {"topic": "Logical Reasoning", "sub_topics": ["Syllogism", "Statement/Argument"], "questions": 10, "marks": 10}
                ]
            }
        ]
    },
    {
        "id": str(uuid.uuid4()),
        "exam_name": "NABARD Grade A",
        "exam_display_name": "NABARD Grade A (Assistant Manager)",
        "category": "Banking Examinations",
        "exam_level": "Post Graduate",
        "total_marks": 200,
        "subjects": [
            {
                "subject_name": "Economic & Social Issues",
                "topics": [
                    {"topic": "Indian Economy", "sub_topics": ["Economic Growth", "Inflation", "Fiscal Policy"], "questions": 15, "marks": 15},
                    {"topic": "Social Development", "sub_topics": ["Education", "Health", "Employment"], "questions": 10, "marks": 10},
                    {"topic": "Rural Economy", "sub_topics": ["Agricultural Credit", "Rural Banking"], "questions": 10, "marks": 10}
                ]
            },
            {
                "subject_name": "Agriculture & Rural Development",
                "topics": [
                    {"topic": "Agriculture", "sub_topics": ["Crop Production", "Irrigation", "Farm Credit"], "questions": 20, "marks": 20},
                    {"topic": "Rural Development", "sub_topics": ["MGNREGA", "Rural Infrastructure", "SHGs"], "questions": 15, "marks": 15}
                ]
            },
            {
                "subject_name": "Reasoning & Computer",
                "topics": [
                    {"topic": "Reasoning", "sub_topics": ["Puzzles", "Syllogism", "Data Sufficiency"], "questions": 30, "marks": 30},
                    {"topic": "Computer Knowledge", "sub_topics": ["Hardware", "Software", "Internet"], "questions": 10, "marks": 10}
                ]
            },
            {
                "subject_name": "English Language",
                "topics": [
                    {"topic": "Reading Comprehension", "sub_topics": ["Passage Based"], "questions": 15, "marks": 15},
                    {"topic": "Grammar", "sub_topics": ["Error Spotting", "Sentence Improvement"], "questions": 10, "marks": 10},
                    {"topic": "Vocabulary", "sub_topics": ["Synonyms", "Antonyms", "Cloze Test"], "questions": 10, "marks": 10}
                ]
            },
            {
                "subject_name": "Quantitative Aptitude",
                "topics": [
                    {"topic": "Data Interpretation", "sub_topics": ["Table", "Bar", "Line", "Pie"], "questions": 15, "marks": 15},
                    {"topic": "Arithmetic", "sub_topics": ["P&L", "SI/CI", "Time & Work", "Ratio"], "questions": 20, "marks": 20},
                    {"topic": "Simplification", "sub_topics": ["BODMAS"], "questions": 5, "marks": 5}
                ]
            }
        ]
    }
]

async def create_banking_exams():
    """Create 10 banking exams in the database"""
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DATABASE_NAME]
        
        print("=" * 80)
        print("CREATING 10 BANKING EXAMINATIONS")
        print("=" * 80)
        
        # Check if exams already exist
        existing_exams = await db.exam_sheets.count_documents({"category": "Banking Examinations"})
        print(f"\nExisting banking exams in database: {existing_exams}")
        
        created_count = 0
        updated_count = 0
        
        for exam_data in BANKING_EXAMS:
            exam_name = exam_data["exam_name"]
            
            # Check if this specific exam already exists
            existing = await db.exam_sheets.find_one({"exam_name": exam_name})
            
            # Create sheet entries for each subject -> topic -> sub-topic
            for subject in exam_data["subjects"]:
                for topic in subject["topics"]:
                    for sub_topic in topic.get("sub_topics", []):
                        sheet_doc = {
                            "id": str(uuid.uuid4()),
                            "exam_name": exam_name,
                            "exam_display_name": exam_data["exam_display_name"],
                            "category": exam_data["category"],
                            "exam_level": exam_data["exam_level"],
                            "subject": subject["subject_name"],
                            "topic": topic["topic"],
                            "sub_topic": sub_topic,
                            "questions_count": topic.get("questions", 0),
                            "marks": topic.get("marks", 0),
                            "questions_imported": False,
                            "created_at": datetime.now(timezone.utc).isoformat(),
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                        
                        # Insert or update
                        result = await db.exam_sheets.update_one(
                            {
                                "exam_name": exam_name,
                                "subject": subject["subject_name"],
                                "topic": topic["topic"],
                                "sub_topic": sub_topic
                            },
                            {"$set": sheet_doc},
                            upsert=True
                        )
                        
                        if result.upserted_id:
                            created_count += 1
                        else:
                            updated_count += 1
            
            print(f"✅ {exam_name} - Subjects: {len(exam_data['subjects'])}, Total Marks: {exam_data['total_marks']}")
        
        print(f"\n{'=' * 80}")
        print(f"SUMMARY:")
        print(f"{'=' * 80}")
        print(f"✅ Created {created_count} new sheet entries")
        print(f"🔄 Updated {updated_count} existing sheet entries")
        print(f"✅ Total Banking Exams: 10")
        print(f"📊 Categories: SBI, IBPS, LIC, NABARD, RBI, SEBI, SIDBI, RRB")
        print(f"{'=' * 80}\n")
        
        # Close connection
        client.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating banking exams: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    asyncio.run(create_banking_exams())
