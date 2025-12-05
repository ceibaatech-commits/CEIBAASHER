import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
import uuid

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "test_database")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

nda_trig_mcqs = [
    # BASIC RATIOS - Easy
    {
        "question_number": 1,
        "question": "If sin θ = 3/5, what is the value of cos θ? (θ is acute)",
        "options": {"A": "3/5", "B": "4/5", "C": "5/3", "D": "5/4"},
        "correct_answer": "B",
        "explanation": "Using Pythagorean identity: cos²θ = 1 - sin²θ = 1 - 9/25 = 16/25, so cos θ = 4/5",
        "difficulty": "Easy",
        "subject": "Mathematics",
        "topic": "Trigonometry",
        "subtopic": "Trigonometric Ratios & Identities"
    },
    {
        "question_number": 2,
        "question": "The value of sin 30° + cos 60° is:",
        "options": {"A": "0", "B": "1", "C": "1/2", "D": "√3/2"},
        "correct_answer": "B",
        "explanation": "sin 30° = 1/2 and cos 60° = 1/2, so sum = 1/2 + 1/2 = 1",
        "difficulty": "Easy",
        "subject": "Mathematics",
        "topic": "Trigonometry",
        "subtopic": "Trigonometric Ratios & Identities"
    },
    {
        "question_number": 3,
        "question": "If tan θ = 1, then θ equals:",
        "options": {"A": "30°", "B": "45°", "C": "60°", "D": "90°"},
        "correct_answer": "B",
        "explanation": "tan 45° = 1, as sin 45° = cos 45° = 1/√2",
        "difficulty": "Easy",
        "subject": "Mathematics",
        "topic": "Trigonometry",
        "subtopic": "Trigonometric Ratios & Identities"
    },
    
    # PYTHAGOREAN IDENTITIES - Easy
    {
        "question_number": 4,
        "question": "The value of sin²θ + cos²θ is:",
        "options": {"A": "0", "B": "1", "C": "2", "D": "tan²θ"},
        "correct_answer": "B",
        "explanation": "This is the fundamental Pythagorean identity: sin²θ + cos²θ = 1",
        "difficulty": "Easy",
        "subject": "Mathematics",
        "topic": "Trigonometry",
        "subtopic": "Trigonometric Ratios & Identities"
    },
    {
        "question_number": 5,
        "question": "If sec²θ = 1 + tan²θ, then what is 1 + cot²θ equal to?",
        "options": {"A": "sin²θ", "B": "cos²θ", "C": "cosec²θ", "D": "sec²θ"},
        "correct_answer": "C",
        "explanation": "From Pythagorean identity: 1 + cot²θ = cosec²θ",
        "difficulty": "Easy",
        "subject": "Mathematics",
        "topic": "Trigonometry",
        "subtopic": "Trigonometric Ratios & Identities"
    },
    
    # RECIPROCAL IDENTITIES - Easy
    {
        "question_number": 6,
        "question": "The value of cosec 90° is:",
        "options": {"A": "0", "B": "1", "C": "∞", "D": "Undefined"},
        "correct_answer": "B",
        "explanation": "cosec 90° = 1/sin 90° = 1/1 = 1",
        "difficulty": "Easy",
        "subject": "Mathematics",
        "topic": "Trigonometry",
        "subtopic": "Trigonometric Ratios & Identities"
    },
    {
        "question_number": 7,
        "question": "If sin θ = x, then cosec θ equals:",
        "options": {"A": "x", "B": "1/x", "C": "1 - x", "D": "√(1-x²)"},
        "correct_answer": "B",
        "explanation": "cosec θ is reciprocal of sin θ, so cosec θ = 1/sin θ = 1/x",
        "difficulty": "Easy",
        "subject": "Mathematics",
        "topic": "Trigonometry",
        "subtopic": "Trigonometric Ratios & Identities"
    },
    
    # COMPLEMENTARY ANGLES - Medium
    {
        "question_number": 8,
        "question": "The value of sin 25° cos 65° + cos 25° sin 65° is:",
        "options": {"A": "0", "B": "1", "C": "1/2", "D": "√3/2"},
        "correct_answer": "B",
        "explanation": "Using sin(A+B) formula: sin 25° cos 65° + cos 25° sin 65° = sin(25°+65°) = sin 90° = 1",
        "difficulty": "Medium",
        "subject": "Mathematics",
        "topic": "Trigonometry",
        "subtopic": "Trigonometric Ratios & Identities"
    },
    {
        "question_number": 9,
        "question": "If sin(90° - θ) = 3/5, then cos θ is:",
        "options": {"A": "2/5", "B": "3/5", "C": "4/5", "D": "5/3"},
        "correct_answer": "B",
        "explanation": "sin(90° - θ) = cos θ, therefore cos θ = 3/5",
        "difficulty": "Medium",
        "subject": "Mathematics",
        "topic": "Trigonometry",
        "subtopic": "Trigonometric Ratios & Identities"
    },
    {
        "question_number": 10,
        "question": "The value of tan 1° tan 2° tan 3° ... tan 89° is:",
        "options": {"A": "0", "B": "1", "C": "89", "D": "∞"},
        "correct_answer": "B",
        "explanation": "tan θ × tan(90° - θ) = tan θ × cot θ = 1. When multiplied in pairs, product = 1",
        "difficulty": "Medium",
        "subject": "Mathematics",
        "topic": "Trigonometry",
        "subtopic": "Trigonometric Ratios & Identities"
    },
    
    # COMPOUND ANGLES - Medium
    {
        "question_number": 11,
        "question": "sin(A + B) equals:",
        "options": {"A": "sin A + sin B", "B": "sin A cos B + cos A sin B", "C": "cos A cos B - sin A sin B", "D": "sin A cos B - cos A sin B"},
        "correct_answer": "B",
        "explanation": "Compound angle formula: sin(A + B) = sin A cos B + cos A sin B",
        "difficulty": "Medium",
        "subject": "Mathematics",
        "topic": "Trigonometry",
        "subtopic": "Trigonometric Ratios & Identities"
    },
    {
        "question_number": 12,
        "question": "The value of cos 15° is:",
        "options": {"A": "(√3 + 1)/(2√2)", "B": "(√3 - 1)/(2√2)", "C": "(√6 + √2)/4", "D": "(√6 - √2)/4"},
        "correct_answer": "C",
        "explanation": "cos 15° = cos(45° - 30°) = cos 45° cos 30° + sin 45° sin 30° = (1/√2)(√3/2) + (1/√2)(1/2) = (√6 + √2)/4",
        "difficulty": "Medium",
        "subject": "Mathematics",
        "topic": "Trigonometry",
        "subtopic": "Trigonometric Ratios & Identities"
    },
    {
        "question_number": 13,
        "question": "If tan A = 1/2 and tan B = 1/3, then tan(A + B) equals:",
        "options": {"A": "1", "B": "5/6", "C": "6/5", "D": "5/7"},
        "correct_answer": "A",
        "explanation": "tan(A+B) = (tan A + tan B)/(1 - tan A tan B) = (1/2 + 1/3)/(1 - 1/6) = (5/6)/(5/6) = 1",
        "difficulty": "Medium",
        "subject": "Mathematics",
        "topic": "Trigonometry",
        "subtopic": "Trigonometric Ratios & Identities"
    },
    
    # DOUBLE ANGLES - Medium
    {
        "question_number": 14,
        "question": "The value of sin 2θ in terms of tan θ is:",
        "options": {"A": "2tan θ/(1 + tan²θ)", "B": "2tan θ/(1 - tan²θ)", "C": "(1 - tan²θ)/(1 + tan²θ)", "D": "tan θ/(1 + tan²θ)"},
        "correct_answer": "A",
        "explanation": "sin 2θ = 2sin θ cos θ = 2tan θ/(1 + tan²θ) when expressed in terms of tan θ",
        "difficulty": "Medium",
        "subject": "Mathematics",
        "topic": "Trigonometry",
        "subtopic": "Trigonometric Ratios & Identities"
    },
    {
        "question_number": 15,
        "question": "If sin θ = 1/2, then cos 2θ equals:",
        "options": {"A": "1/4", "B": "1/2", "C": "3/4", "D": "√3/2"},
        "correct_answer": "B",
        "explanation": "cos 2θ = 1 - 2sin²θ = 1 - 2(1/4) = 1 - 1/2 = 1/2",
        "difficulty": "Medium",
        "subject": "Mathematics",
        "topic": "Trigonometry",
        "subtopic": "Trigonometric Ratios & Identities"
    },
    
    # TRANSFORMATION FORMULAS - Hard
    {
        "question_number": 16,
        "question": "sin C + sin D equals:",
        "options": {"A": "2sin((C+D)/2)cos((C-D)/2)", "B": "2cos((C+D)/2)sin((C-D)/2)", "C": "2sin((C+D)/2)sin((C-D)/2)", "D": "2cos((C+D)/2)cos((C-D)/2)"},
        "correct_answer": "A",
        "explanation": "Transformation formula: sin C + sin D = 2sin((C+D)/2)cos((C-D)/2)",
        "difficulty": "Hard",
        "subject": "Mathematics",
        "topic": "Trigonometry",
        "subtopic": "Trigonometric Ratios & Identities"
    },
    {
        "question_number": 17,
        "question": "The value of sin 75° + sin 15° is:",
        "options": {"A": "√2", "B": "√3", "C": "√6/2", "D": "1"},
        "correct_answer": "B",
        "explanation": "sin 75° + sin 15° = 2sin((75°+15°)/2)cos((75°-15°)/2) = 2sin 45° cos 30° = 2(1/√2)(√3/2) = √3/2 × 2 = √3",
        "difficulty": "Hard",
        "subject": "Mathematics",
        "topic": "Trigonometry",
        "subtopic": "Trigonometric Ratios & Identities"
    },
    
    # TRIPLE ANGLES - Hard
    {
        "question_number": 18,
        "question": "sin 3θ in terms of sin θ is:",
        "options": {"A": "3sin θ - 4sin³θ", "B": "4sin³θ - 3sin θ", "C": "3sin θ + 4sin³θ", "D": "sin³θ"},
        "correct_answer": "A",
        "explanation": "Triple angle formula: sin 3θ = 3sin θ - 4sin³θ",
        "difficulty": "Hard",
        "subject": "Mathematics",
        "topic": "Trigonometry",
        "subtopic": "Trigonometric Ratios & Identities"
    },
    
    # QUOTIENT IDENTITIES - Easy
    {
        "question_number": 19,
        "question": "tan θ can be expressed as:",
        "options": {"A": "cos θ/sin θ", "B": "sin θ/cos θ", "C": "sin θ × cos θ", "D": "1/(sin θ cos θ)"},
        "correct_answer": "B",
        "explanation": "Quotient identity: tan θ = sin θ/cos θ",
        "difficulty": "Easy",
        "subject": "Mathematics",
        "topic": "Trigonometry",
        "subtopic": "Trigonometric Ratios & Identities"
    },
    {
        "question_number": 20,
        "question": "If sin θ = 0.6 and cos θ = 0.8, then tan θ equals:",
        "options": {"A": "0.48", "B": "0.75", "C": "1.33", "D": "1.67"},
        "correct_answer": "B",
        "explanation": "tan θ = sin θ/cos θ = 0.6/0.8 = 3/4 = 0.75",
        "difficulty": "Easy",
        "subject": "Mathematics",
        "topic": "Trigonometry",
        "subtopic": "Trigonometric Ratios & Identities"
    },
    
    # ALLIED ANGLES - Medium
    {
        "question_number": 21,
        "question": "The value of sin(180° - θ) is:",
        "options": {"A": "sin θ", "B": "-sin θ", "C": "cos θ", "D": "-cos θ"},
        "correct_answer": "A",
        "explanation": "Allied angle formula: sin(180° - θ) = sin θ",
        "difficulty": "Medium",
        "subject": "Mathematics",
        "topic": "Trigonometry",
        "subtopic": "Trigonometric Ratios & Identities"
    },
    {
        "question_number": 22,
        "question": "cos(360° + θ) equals:",
        "options": {"A": "sin θ", "B": "cos θ", "C": "-cos θ", "D": "tan θ"},
        "correct_answer": "B",
        "explanation": "cos(360° + θ) = cos θ (periodicity of cosine function)",
        "difficulty": "Medium",
        "subject": "Mathematics",
        "topic": "Trigonometry",
        "subtopic": "Trigonometric Ratios & Identities"
    },
    
    # MAXIMUM/MINIMUM VALUES - Easy
    {
        "question_number": 23,
        "question": "The maximum value of sin θ is:",
        "options": {"A": "0", "B": "1", "C": "2", "D": "∞"},
        "correct_answer": "B",
        "explanation": "The range of sine function is [-1, 1], so maximum value is 1",
        "difficulty": "Easy",
        "subject": "Mathematics",
        "topic": "Trigonometry",
        "subtopic": "Trigonometric Ratios & Identities"
    },
    {
        "question_number": 24,
        "question": "The minimum value of 3 + 2sin θ is:",
        "options": {"A": "1", "B": "2", "C": "3", "D": "5"},
        "correct_answer": "A",
        "explanation": "Minimum value of sin θ = -1, so minimum of 3 + 2sin θ = 3 + 2(-1) = 1",
        "difficulty": "Easy",
        "subject": "Mathematics",
        "topic": "Trigonometry",
        "subtopic": "Trigonometric Ratios & Identities"
    },
    
    # COMPLEX IDENTITY - Hard
    {
        "question_number": 25,
        "question": "If sin θ + cos θ = √2, then sin θ cos θ equals:",
        "options": {"A": "0", "B": "1/4", "C": "1/2", "D": "1"},
        "correct_answer": "C",
        "explanation": "Squaring: sin²θ + cos²θ + 2sin θ cos θ = 2. Since sin²θ + cos²θ = 1, we get 1 + 2sin θ cos θ = 2, so sin θ cos θ = 1/2",
        "difficulty": "Hard",
        "subject": "Mathematics",
        "topic": "Trigonometry",
        "subtopic": "Trigonometric Ratios & Identities"
    }
]

async def insert_nda_mcqs():
    """Insert NDA Trigonometry MCQs into the database"""
    try:
        for mcq in nda_trig_mcqs:
            mcq['id'] = str(uuid.uuid4())
            mcq['exam_id'] = 'NDA'
            mcq['exam_name'] = 'NDA & NA'
            mcq['created_at'] = datetime.utcnow().isoformat()
            mcq['question_type'] = 'MCQ'
            mcq['marks'] = 2.5
            mcq['negative_marks'] = -0.83
            mcq['time_limit'] = 150
            mcq['status'] = 'active'
        
        result = await db.questions.insert_many(nda_trig_mcqs)
        print(f"✅ Successfully inserted {len(result.inserted_ids)} NDA Trigonometry MCQs")
        
        print("\n📊 SUMMARY:")
        print(f"Total Questions: {len(nda_trig_mcqs)}")
        
        difficulties = {}
        for q in nda_trig_mcqs:
            diff = q['difficulty']
            difficulties[diff] = difficulties.get(diff, 0) + 1
        
        print("\nBy Difficulty:")
        for diff, count in difficulties.items():
            print(f"  {diff}: {count} ({count/len(nda_trig_mcqs)*100:.0f}%)")
        
        print(f"\nSubject: Mathematics")
        print(f"Topic: Trigonometry")
        print(f"Subtopic: Trigonometric Ratios & Identities")
        
        return True
    except Exception as e:
        print(f"❌ Error inserting MCQs: {str(e)}")
        return False

if __name__ == "__main__":
    asyncio.run(insert_nda_mcqs())
