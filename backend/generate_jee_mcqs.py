import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
import uuid

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "test_database")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# JEE Main MCQs - 25 questions covering all subtopics
jee_mcqs = [
    # PHYSICS - Mechanics (Easy)
    {
        "question_number": 1,
        "question": "A body of mass 2 kg is moving with a velocity of 10 m/s. What is its kinetic energy?",
        "options": {
            "A": "50 J",
            "B": "100 J",
            "C": "200 J",
            "D": "400 J"
        },
        "correct_answer": "B",
        "explanation": "Kinetic Energy = (1/2)mv² = (1/2)(2)(10)² = 100 J",
        "difficulty": "Easy",
        "subject": "Physics",
        "topic": "Mechanics",
        "subtopic": "Work/Energy/Power"
    },
    # PHYSICS - Thermodynamics (Easy)
    {
        "question_number": 2,
        "question": "In an isothermal process for an ideal gas, which quantity remains constant?",
        "options": {
            "A": "Pressure",
            "B": "Volume",
            "C": "Temperature",
            "D": "Internal Energy"
        },
        "correct_answer": "C",
        "explanation": "Isothermal means constant temperature. For ideal gas, internal energy depends only on temperature, so both T and U remain constant.",
        "difficulty": "Easy",
        "subject": "Physics",
        "topic": "Thermodynamics & Waves",
        "subtopic": "Thermodynamics"
    },
    # PHYSICS - E&M (Medium)
    {
        "question_number": 3,
        "question": "Two point charges +Q and -Q are separated by distance d. At what point on the line joining them is the electric field zero?",
        "options": {
            "A": "At the midpoint",
            "B": "Closer to +Q",
            "C": "Closer to -Q",
            "D": "Electric field is never zero"
        },
        "correct_answer": "A",
        "explanation": "For equal and opposite charges, electric field is zero at the midpoint where fields from both charges cancel each other.",
        "difficulty": "Medium",
        "subject": "Physics",
        "topic": "E&M & Optics",
        "subtopic": "Electrostatics"
    },
    # PHYSICS - Modern Physics (Medium)
    {
        "question_number": 4,
        "question": "The de Broglie wavelength of an electron accelerated through potential V is λ. If the potential is increased to 4V, the new wavelength will be:",
        "options": {
            "A": "4λ",
            "B": "2λ",
            "C": "λ/2",
            "D": "λ/4"
        },
        "correct_answer": "C",
        "explanation": "λ = h/√(2meV). When V → 4V, λ → λ/√4 = λ/2",
        "difficulty": "Medium",
        "subject": "Physics",
        "topic": "Modern Physics",
        "subtopic": "Dual Nature of Radiation/Matter"
    },
    # CHEMISTRY - Physical Chemistry (Easy)
    {
        "question_number": 5,
        "question": "Which quantum number determines the shape of an orbital?",
        "options": {
            "A": "Principal quantum number (n)",
            "B": "Azimuthal quantum number (l)",
            "C": "Magnetic quantum number (m)",
            "D": "Spin quantum number (s)"
        },
        "correct_answer": "B",
        "explanation": "The azimuthal quantum number (l) determines the shape of the orbital (s, p, d, f).",
        "difficulty": "Easy",
        "subject": "Chemistry",
        "topic": "Physical Chemistry",
        "subtopic": "Atomic Structure"
    },
    # CHEMISTRY - Inorganic (Easy)
    {
        "question_number": 6,
        "question": "The element with electronic configuration [Ar]3d¹⁰4s¹ belongs to which group?",
        "options": {
            "A": "Group 1",
            "B": "Group 11",
            "C": "Group 10",
            "D": "Group 12"
        },
        "correct_answer": "B",
        "explanation": "Configuration [Ar]3d¹⁰4s¹ represents copper (Cu) which belongs to Group 11.",
        "difficulty": "Easy",
        "subject": "Chemistry",
        "topic": "Inorganic Chemistry",
        "subtopic": "Classification of Elements (Periodicity)"
    },
    # CHEMISTRY - Organic (Medium)
    {
        "question_number": 7,
        "question": "In SN2 reaction mechanism, the rate of reaction depends on:",
        "options": {
            "A": "Concentration of substrate only",
            "B": "Concentration of nucleophile only",
            "C": "Both substrate and nucleophile",
            "D": "Neither substrate nor nucleophile"
        },
        "correct_answer": "C",
        "explanation": "SN2 is a bimolecular reaction, so rate = k[substrate][nucleophile]. Rate depends on both concentrations.",
        "difficulty": "Medium",
        "subject": "Chemistry",
        "topic": "Organic Chemistry",
        "subtopic": "Haloalkanes/Haloarenes"
    },
    # CHEMISTRY - Thermodynamics (Hard)
    {
        "question_number": 8,
        "question": "For a spontaneous process, which of the following is always true?",
        "options": {
            "A": "ΔH < 0",
            "B": "ΔS > 0",
            "C": "ΔG < 0",
            "D": "ΔH - TΔS > 0"
        },
        "correct_answer": "C",
        "explanation": "For spontaneous processes, Gibbs free energy change must be negative: ΔG = ΔH - TΔS < 0",
        "difficulty": "Hard",
        "subject": "Chemistry",
        "topic": "Physical Chemistry",
        "subtopic": "Thermodynamics"
    },
    # MATHEMATICS - Algebra (Easy)
    {
        "question_number": 9,
        "question": "If |z| = 5 where z is a complex number, then |z²| equals:",
        "options": {
            "A": "5",
            "B": "10",
            "C": "25",
            "D": "50"
        },
        "correct_answer": "C",
        "explanation": "|z²| = |z|² = 5² = 25",
        "difficulty": "Easy",
        "subject": "Mathematics",
        "topic": "Algebra",
        "subtopic": "Complex Numbers"
    },
    # MATHEMATICS - Calculus (Easy)
    {
        "question_number": 10,
        "question": "The value of lim(x→0) (sin x)/x is:",
        "options": {
            "A": "0",
            "B": "1",
            "C": "∞",
            "D": "Does not exist"
        },
        "correct_answer": "B",
        "explanation": "This is a standard limit: lim(x→0) (sin x)/x = 1",
        "difficulty": "Easy",
        "subject": "Mathematics",
        "topic": "Calculus",
        "subtopic": "Limits"
    },
    # MATHEMATICS - Coordinate Geometry (Medium)
    {
        "question_number": 11,
        "question": "The equation of the circle with center (3, -4) and radius 5 is:",
        "options": {
            "A": "(x-3)² + (y+4)² = 25",
            "B": "(x+3)² + (y-4)² = 25",
            "C": "(x-3)² + (y-4)² = 5",
            "D": "(x+3)² + (y+4)² = 5"
        },
        "correct_answer": "A",
        "explanation": "Circle equation: (x-h)² + (y-k)² = r² where (h,k) is center. So (x-3)² + (y+4)² = 25",
        "difficulty": "Medium",
        "subject": "Mathematics",
        "topic": "Coordinate Geometry",
        "subtopic": "Circles"
    },
    # MATHEMATICS - Probability (Medium)
    {
        "question_number": 12,
        "question": "A coin is tossed 3 times. What is the probability of getting at least 2 heads?",
        "options": {
            "A": "1/8",
            "B": "1/4",
            "C": "3/8",
            "D": "1/2"
        },
        "correct_answer": "D",
        "explanation": "At least 2 heads means 2 heads or 3 heads. P(2H) = 3C2/8 = 3/8, P(3H) = 1/8. Total = 4/8 = 1/2",
        "difficulty": "Medium",
        "subject": "Mathematics",
        "topic": "Statistics & Probability",
        "subtopic": "Probability"
    },
    # PHYSICS - Rotational Motion (Easy)
    {
        "question_number": 13,
        "question": "The SI unit of angular momentum is:",
        "options": {
            "A": "kg m/s",
            "B": "kg m²/s",
            "C": "kg m/s²",
            "D": "kg m²/s²"
        },
        "correct_answer": "B",
        "explanation": "Angular momentum L = Iω, where I has unit kg⋅m² and ω has unit rad/s, so L has unit kg⋅m²/s",
        "difficulty": "Easy",
        "subject": "Physics",
        "topic": "Mechanics",
        "subtopic": "Rotational Motion"
    },
    # PHYSICS - Optics (Medium)
    {
        "question_number": 14,
        "question": "In Young's double slit experiment, if the distance between slits is doubled, the fringe width:",
        "options": {
            "A": "Doubles",
            "B": "Becomes half",
            "C": "Remains same",
            "D": "Becomes four times"
        },
        "correct_answer": "B",
        "explanation": "Fringe width β = λD/d. If d is doubled, β becomes half.",
        "difficulty": "Medium",
        "subject": "Physics",
        "topic": "E&M & Optics",
        "subtopic": "Wave Optics"
    },
    # CHEMISTRY - Electrochemistry (Medium)
    {
        "question_number": 15,
        "question": "The standard electrode potential of Zn²⁺/Zn is -0.76V. This indicates:",
        "options": {
            "A": "Zn can displace H₂ from acids",
            "B": "Zn cannot displace H₂ from acids",
            "C": "Zn is a strong oxidizing agent",
            "D": "Zn²⁺ is easily reduced"
        },
        "correct_answer": "A",
        "explanation": "Negative E° means Zn is more reactive than H₂, so it can displace hydrogen from acids.",
        "difficulty": "Medium",
        "subject": "Chemistry",
        "topic": "Physical Chemistry",
        "subtopic": "Electrochemistry"
    },
    # CHEMISTRY - Coordination Compounds (Hard)
    {
        "question_number": 16,
        "question": "The hybridization of central metal atom in [Fe(CN)₆]³⁻ is:",
        "options": {
            "A": "sp³",
            "B": "sp³d²",
            "C": "d²sp³",
            "D": "dsp²"
        },
        "correct_answer": "C",
        "explanation": "CN⁻ is a strong field ligand causing inner orbital complex. For octahedral geometry with 6 ligands: d²sp³ hybridization.",
        "difficulty": "Hard",
        "subject": "Chemistry",
        "topic": "Inorganic Chemistry",
        "subtopic": "Coordination Compounds"
    },
    # CHEMISTRY - Organic Mechanisms (Medium)
    {
        "question_number": 17,
        "question": "Lucas test is used to distinguish between:",
        "options": {
            "A": "Primary, secondary and tertiary alcohols",
            "B": "Aldehydes and ketones",
            "C": "Carboxylic acids and esters",
            "D": "Alkanes and alkenes"
        },
        "correct_answer": "A",
        "explanation": "Lucas test uses ZnCl₂/HCl to distinguish 1°, 2°, 3° alcohols based on rate of turbidity formation.",
        "difficulty": "Medium",
        "subject": "Chemistry",
        "topic": "Organic Chemistry",
        "subtopic": "Alcohols/Phenols/Ethers"
    },
    # MATHEMATICS - Matrices (Easy)
    {
        "question_number": 18,
        "question": "If A is a 3×3 matrix and |A| = 5, then |2A| equals:",
        "options": {
            "A": "10",
            "B": "25",
            "C": "40",
            "D": "125"
        },
        "correct_answer": "C",
        "explanation": "For n×n matrix, |kA| = kⁿ|A|. Here |2A| = 2³|A| = 8×5 = 40",
        "difficulty": "Easy",
        "subject": "Mathematics",
        "topic": "Algebra",
        "subtopic": "Matrices & Determinants"
    },
    # MATHEMATICS - Integration (Hard)
    {
        "question_number": 19,
        "question": "The value of ∫₀^(π/2) sin³x dx is:",
        "options": {
            "A": "1/3",
            "B": "2/3",
            "C": "3/4",
            "D": "1"
        },
        "correct_answer": "B",
        "explanation": "∫sin³x dx = ∫sinx(1-cos²x)dx. Let u=cosx, then integral = 2/3",
        "difficulty": "Hard",
        "subject": "Mathematics",
        "topic": "Calculus",
        "subtopic": "Definite Integration"
    },
    # MATHEMATICS - 3D Geometry (Medium)
    {
        "question_number": 20,
        "question": "The distance of point (3,4,5) from the origin is:",
        "options": {
            "A": "5√2",
            "B": "5√3",
            "C": "7",
            "D": "12"
        },
        "correct_answer": "A",
        "explanation": "Distance = √(3²+4²+5²) = √(9+16+25) = √50 = 5√2",
        "difficulty": "Medium",
        "subject": "Mathematics",
        "topic": "Coordinate Geometry",
        "subtopic": "3D Geometry"
    },
    # PHYSICS - Gravitation (Easy)
    {
        "question_number": 21,
        "question": "The acceleration due to gravity on moon is approximately:",
        "options": {
            "A": "1.6 m/s²",
            "B": "3.2 m/s²",
            "C": "6.4 m/s²",
            "D": "9.8 m/s²"
        },
        "correct_answer": "A",
        "explanation": "Moon's gravity is about 1/6th of Earth's gravity: g_moon ≈ 9.8/6 ≈ 1.6 m/s²",
        "difficulty": "Easy",
        "subject": "Physics",
        "topic": "Mechanics",
        "subtopic": "Gravitation"
    },
    # CHEMISTRY - Chemical Bonding (Easy)
    {
        "question_number": 22,
        "question": "The bond angle in NH₃ molecule is approximately:",
        "options": {
            "A": "90°",
            "B": "107°",
            "C": "109.5°",
            "D": "120°"
        },
        "correct_answer": "B",
        "explanation": "NH₃ has sp³ hybridization with one lone pair. Bond angle is compressed from 109.5° to ~107° due to lone pair repulsion.",
        "difficulty": "Easy",
        "subject": "Chemistry",
        "topic": "Physical Chemistry",
        "subtopic": "Chemical Bonding"
    },
    # MATHEMATICS - Permutations (Medium)
    {
        "question_number": 23,
        "question": "The number of ways to arrange the letters of the word 'MISSISSIPPI' is:",
        "options": {
            "A": "34650",
            "B": "39916800",
            "C": "11!/4!4!2!",
            "D": "Both A and C"
        },
        "correct_answer": "D",
        "explanation": "11 letters with I(4), S(4), P(2), M(1). Arrangements = 11!/(4!×4!×2!) = 34650",
        "difficulty": "Medium",
        "subject": "Mathematics",
        "topic": "Algebra",
        "subtopic": "Permutations & Combinations"
    },
    # PHYSICS - AC Circuits (Hard)
    {
        "question_number": 24,
        "question": "In an LCR series circuit at resonance, the power factor is:",
        "options": {
            "A": "0",
            "B": "0.5",
            "C": "0.707",
            "D": "1"
        },
        "correct_answer": "D",
        "explanation": "At resonance, XL = XC, so impedance Z = R (purely resistive). Power factor = cosφ = R/Z = 1",
        "difficulty": "Hard",
        "subject": "Physics",
        "topic": "E&M & Optics",
        "subtopic": "AC"
    },
    # CHEMISTRY - Chemical Kinetics (Hard)
    {
        "question_number": 25,
        "question": "For a first-order reaction, if 75% of the reactant decomposes in time t, what percentage decomposes in time 2t?",
        "options": {
            "A": "87.5%",
            "B": "93.75%",
            "C": "96.875%",
            "D": "100%"
        },
        "correct_answer": "B",
        "explanation": "For first-order: ln(N/N₀) = -kt. If 75% decomposes in t (25% remains), in 2t: (0.25)² = 0.0625 remains, so 93.75% decomposes.",
        "difficulty": "Hard",
        "subject": "Chemistry",
        "topic": "Physical Chemistry",
        "subtopic": "Chemical Kinetics"
    }
]

async def insert_jee_mcqs():
    """Insert JEE MCQs into the database"""
    try:
        # Add metadata to each question
        for mcq in jee_mcqs:
            mcq['id'] = str(uuid.uuid4())
            mcq['exam_id'] = 'JEE'
            mcq['exam_name'] = 'JEE Main'
            mcq['created_at'] = datetime.utcnow().isoformat()
            mcq['question_type'] = 'MCQ'
            mcq['marks'] = 4
            mcq['negative_marks'] = -1
            mcq['time_limit'] = 180  # 3 minutes per question
            mcq['status'] = 'active'
        
        # Insert into questions collection
        result = await db.questions.insert_many(jee_mcqs)
        print(f"✅ Successfully inserted {len(result.inserted_ids)} JEE MCQs")
        
        # Show summary
        print("\n📊 SUMMARY:")
        print(f"Total Questions: {len(jee_mcqs)}")
        
        # Count by difficulty
        difficulties = {}
        subjects = {}
        for q in jee_mcqs:
            diff = q['difficulty']
            subj = q['subject']
            difficulties[diff] = difficulties.get(diff, 0) + 1
            subjects[subj] = subjects.get(subj, 0) + 1
        
        print("\nBy Difficulty:")
        for diff, count in difficulties.items():
            print(f"  {diff}: {count} ({count/len(jee_mcqs)*100:.0f}%)")
        
        print("\nBy Subject:")
        for subj, count in subjects.items():
            print(f"  {subj}: {count}")
        
        return True
    except Exception as e:
        print(f"❌ Error inserting MCQs: {str(e)}")
        return False

if __name__ == "__main__":
    asyncio.run(insert_jee_mcqs())
