"""
Script to import Class 7 English Poorvi chapters and questions
"""
import os
import requests
import csv
import uuid
from datetime import datetime, timezone
import pymongo
from io import StringIO

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

# Chapter list for Class 7 English Poorvi
CHAPTERS = [
    {"number": 1, "name": "The Day the River Spoke", "sheet_id": "1JtcHywYUm6VuifImAmlFuXuOwKh3t1wXIB9d69N7Y5I"},
    {"number": 2, "name": "Try Again", "sheet_id": "1Mr2NucsncNLoJbydzJ6ia_NaQ_NKG9fNOV8tj_QlmMM"},
    {"number": 3, "name": "Three Days to See", "sheet_id": "1B9uii-nzNTbFZpXDHBQE5nrBi2eGrV9kYsjbvafDMwI"},
    {"number": 4, "name": "Animals, Birds, and Dr. Dolittle", "sheet_id": "19lWhUgv2tdF8HLsIC3WFtNhObzMemQX4-YVui_ceCWI"},
    {"number": 5, "name": "A Funny Man", "sheet_id": "1Qcl4K27sRwQUA5Y_zQKsDoHOtWacNQf1ENKMp3IG78U"},
    {"number": 6, "name": "Say the Right Thing", "sheet_id": "1NVwv7SVYoa5OqQ1-XQEP85GtziktdHvrBb6e_JyHkmM"},
    {"number": 7, "name": "My Brother's Great Invention", "sheet_id": "1hux8E-wIi3Sic1yPugpFyfq2vFnzuALKl5pqrV5_Dko"},
    {"number": 8, "name": "Paper Boats", "sheet_id": "1aB3kgiVngi-8NG-7l6Os1T7ja0t5J90-BS7Wu2fVBf4"},
    {"number": 9, "name": "North, South, East, West", "sheet_id": "1hiEnwJs19aVtI-R06aSSeIvJdZ7GA50E-k5w7i_wEEc"},
    {"number": 10, "name": "The Tunnel", "sheet_id": "1GwQooDb1INb4PkIYLNPm6SLthhRBxD2e-Zvce7J30RY"},
    {"number": 11, "name": "Travel", "sheet_id": "1xcwy5S3KekAtTFpRi2uqufkoJ3PFPvRiH_veq0ZkNnY"},
    {"number": 12, "name": "Conquering the Summit", "sheet_id": "12Y8uJQA51mrBzHgYVNp8TVk2hmq5vKs_fXvKoK5gCCk"},
    {"number": 13, "name": "A Homage to Our Brave Soldiers", "sheet_id": "1lf_pTOcRqOHsdRIF3yrDbk__j-Rs2E5pvjv-A7J57bY"},
    {"number": 14, "name": "My Dear Soldiers", "sheet_id": "17fA3vAjH7QX7Ru2erh1GQbtTY3C_uYjcaC8RR1715kM"},
    {"number": 15, "name": "Rani Abbakka", "sheet_id": "1UfyeXtVUh9Y9jeeuAgbckryi2i5X_WdmVvV7F0xv7cg"},
]

def fetch_sheet_csv(sheet_id):
    """Fetch CSV data from Google Sheet"""
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"Error fetching sheet {sheet_id}: {e}")
        return None

def parse_questions(csv_text, chapter_info):
    """Parse CSV text into question documents"""
    questions = []
    reader = csv.DictReader(StringIO(csv_text))
    
    for row in reader:
        try:
            # Skip header or empty rows
            q_num = row.get('QUESTION NUMBER', '').strip()
            if not q_num or not q_num.isdigit():
                continue
            
            question_text = row.get('Question', '').strip()
            if not question_text:
                continue
            
            # Get options
            options = [
                row.get('A', '').strip(),
                row.get('B', '').strip(),
                row.get('C', '').strip(),
                row.get('D', '').strip()
            ]
            
            # Filter out empty options
            options = [opt for opt in options if opt]
            
            # Get answer (convert A/B/C/D to index)
            answer = row.get('Answer', '').strip().upper()
            
            # Handle multiple answers like "A/C"
            if '/' in answer:
                answer = answer.split('/')[0]  # Take first answer
            
            explanation = row.get('Explanation', '').strip()
            
            question_doc = {
                "id": str(uuid.uuid4()),
                "sheet_id": f"poorvi-class7-ch{chapter_info['number']}",
                "type": "class",
                "question_number": int(q_num),
                "question": question_text,
                "options": options,
                "correctAnswer": answer,
                "explanation": explanation,
                "class_name": "Class 7",
                "subject": "English - Poorvi",
                "chapter": f"Chapter {chapter_info['number']}. {chapter_info['name']}",
                "chapter_number": chapter_info['number'],
                "book": "Poorvi",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            questions.append(question_doc)
            
        except Exception as e:
            print(f"Error parsing row: {e}")
            continue
    
    return questions

def main():
    client = pymongo.MongoClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Delete existing Class 7 Poorvi questions
    delete_result = db.questions.delete_many({
        "class_name": "Class 7",
        "subject": {"$regex": "poorvi", "$options": "i"}
    })
    print(f"Deleted {delete_result.deleted_count} existing Poorvi questions")
    
    # Also update/create chapters metadata
    chapters_metadata = {
        "class": "7",
        "subject": "English - Poorvi",
        "book": "Poorvi",
        "chapters": []
    }
    
    total_questions = 0
    
    for chapter in CHAPTERS:
        print(f"\nProcessing Chapter {chapter['number']}: {chapter['name']}...")
        
        csv_text = fetch_sheet_csv(chapter['sheet_id'])
        if not csv_text:
            print(f"  Failed to fetch data for chapter {chapter['number']}")
            continue
        
        questions = parse_questions(csv_text, chapter)
        
        if questions:
            db.questions.insert_many(questions)
            print(f"  Imported {len(questions)} questions")
            total_questions += len(questions)
            
            chapters_metadata['chapters'].append({
                "number": chapter['number'],
                "name": chapter['name'],
                "full_name": f"Chapter {chapter['number']}. {chapter['name']}",
                "question_count": len(questions)
            })
        else:
            print(f"  No questions found")
    
    # Save chapters metadata
    db.chapters.delete_many({"class": "7", "subject": {"$regex": "poorvi", "$options": "i"}})
    db.chapters.insert_one(chapters_metadata)
    
    print(f"\n{'='*50}")
    print(f"Import Complete!")
    print(f"Total questions imported: {total_questions}")
    print(f"Total chapters: {len(chapters_metadata['chapters'])}")
    
    # Verify
    count = db.questions.count_documents({
        "class_name": "Class 7",
        "subject": "English - Poorvi"
    })
    print(f"Verified questions in database: {count}")

if __name__ == "__main__":
    main()
