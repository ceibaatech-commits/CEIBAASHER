#!/usr/bin/env python3
"""
Validate that frontend ExamSheetManager.js matches backend exam_data.py
Run this script to ensure they're in sync!
"""

import re
import sys
sys.path.insert(0, '/app/backend')

from exam_data import EXAM_DATA

def extract_frontend_data():
    """Extract mappings from frontend file"""
    frontend_path = '/app/frontend/src/components/admin/ExamSheetManager.js'
    
    with open(frontend_path, 'r') as f:
        content = f.read()
    
    # Extract examNames
    exam_names_match = re.search(r'const examNames = \[(.*?)\];', content, re.DOTALL)
    if exam_names_match:
        exam_names_str = exam_names_match.group(1)
        exam_names = re.findall(r"'([^']+)'", exam_names_str)
    else:
        exam_names = []
    
    # Extract syllabusTopicsMap
    syllabus_map_match = re.search(r'const syllabusTopicsMap = \{(.*?)\};', content, re.DOTALL)
    syllabus_topics_map = {}
    if syllabus_map_match:
        entries = re.findall(r"'([^']+)':\s*\[(.*?)\]", syllabus_map_match.group(1))
        for exam, topics_str in entries:
            topics = re.findall(r"'([^']+)'", topics_str)
            syllabus_topics_map[exam] = topics
    
    # Extract subjectsMap
    subjects_map_match = re.search(r'const subjectsMap = \{(.*?)\};', content, re.DOTALL)
    subjects_map = {}
    if subjects_map_match:
        entries = re.findall(r"'([^']+)':\s*\[(.*?)\]", subjects_map_match.group(1))
        for topic, subjects_str in entries:
            subjects = re.findall(r"'([^']+)'", subjects_str)
            subjects_map[topic] = subjects
    
    return {
        'exam_names': exam_names,
        'syllabus_topics_map': syllabus_topics_map,
        'subjects_map': subjects_map
    }

def validate():
    """Validate frontend matches backend"""
    print("🔍 Validating Frontend-Backend Sync...\n")
    
    frontend_data = extract_frontend_data()
    backend_exam_ids = set(EXAM_DATA.keys())
    frontend_exam_ids = set(frontend_data['exam_names'])
    
    issues_found = 0
    
    # Check 1: Missing exams in frontend
    missing_in_frontend = backend_exam_ids - frontend_exam_ids
    if missing_in_frontend:
        print(f"❌ Missing exams in frontend examNames: {missing_in_frontend}")
        issues_found += len(missing_in_frontend)
    
    # Check 2: Extra exams in frontend
    extra_in_frontend = frontend_exam_ids - backend_exam_ids
    if extra_in_frontend:
        print(f"⚠️  Extra exams in frontend (not in backend): {extra_in_frontend}")
    
    # Check 3: Syllabus topics mismatch
    print("\n📋 Checking Syllabus Topics...")
    for exam_id in backend_exam_ids:
        backend_topics = list(EXAM_DATA[exam_id]['syllabus_topics'].keys())
        frontend_topics = frontend_data['syllabus_topics_map'].get(exam_id, [])
        
        if set(backend_topics) != set(frontend_topics):
            print(f"❌ {exam_id}: Syllabus topics mismatch")
            print(f"   Backend: {backend_topics}")
            print(f"   Frontend: {frontend_topics}")
            issues_found += 1
    
    # Check 4: Subjects map completeness
    print("\n📚 Checking Subjects Map...")
    backend_subjects = {}
    for exam_id, data in EXAM_DATA.items():
        for syllabus_topic, topic_data in data['syllabus_topics'].items():
            subjects = list(topic_data['subjects'].keys())
            if syllabus_topic not in backend_subjects:
                backend_subjects[syllabus_topic] = subjects
    
    missing_subjects = set(backend_subjects.keys()) - set(frontend_data['subjects_map'].keys())
    if missing_subjects:
        print(f"❌ Missing subject mappings in frontend: {len(missing_subjects)}")
        for subj in list(missing_subjects)[:5]:
            print(f"   - {subj}")
        issues_found += len(missing_subjects)
    
    # Summary
    print("\n" + "="*60)
    if issues_found == 0:
        print("✅ SUCCESS: Frontend and Backend are in PERFECT SYNC!")
    else:
        print(f"❌ ISSUES FOUND: {issues_found} mismatches detected")
        print("\n💡 To fix, run:")
        print("   cd /app/backend")
        print("   python3 generate_frontend_mappings.py > /tmp/mappings.js")
        print("   # Then copy the relevant sections to ExamSheetManager.js")
    print("="*60)
    
    return issues_found == 0

if __name__ == "__main__":
    success = validate()
    sys.exit(0 if success else 1)
