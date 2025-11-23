#!/usr/bin/env python3
"""
Auto-generate frontend exam mappings from backend exam_data.py
This ensures frontend and backend stay in perfect sync!
"""

import sys
sys.path.insert(0, '/app/backend')

from exam_data import EXAM_DATA

def generate_exam_names():
    """Generate examNames array"""
    exams = []
    
    # Group by category
    categories = {}
    for exam_id, data in EXAM_DATA.items():
        category = data.get('category', 'Other')
        if category not in categories:
            categories[category] = []
        categories[category].append(exam_id)
    
    # Print grouped
    print("  const examNames = [")
    for category, exam_list in sorted(categories.items()):
        print(f"    // {category}")
        for exam in sorted(exam_list):
            print(f"    '{exam}',")
        print()
    print("  ];")

def generate_syllabus_topics_map():
    """Generate syllabusTopicsMap"""
    print("\n  const syllabusTopicsMap = {")
    for exam_id, data in sorted(EXAM_DATA.items()):
        topics = list(data['syllabus_topics'].keys())
        topics_str = ", ".join([f"'{t}'" for t in topics])
        print(f"    '{exam_id}': [{topics_str}],")
    print("  };")

def generate_subjects_map():
    """Generate subjectsMap"""
    print("\n  const subjectsMap = {")
    
    # Collect all unique syllabus topics and their subjects
    all_mappings = {}
    for exam_id, data in EXAM_DATA.items():
        for syllabus_topic, topic_data in data['syllabus_topics'].items():
            subjects = list(topic_data['subjects'].keys())
            if syllabus_topic not in all_mappings:
                all_mappings[syllabus_topic] = subjects
    
    for syllabus_topic, subjects in sorted(all_mappings.items()):
        subjects_str = ", ".join([f"'{s}'" for s in subjects])
        print(f"    '{syllabus_topic}': [{subjects_str}],")
    
    print("  };")

def generate_sub_topics_map():
    """Generate subTopicsMap"""
    print("\n  const subTopicsMap = {")
    
    # Collect all unique subjects and their sub-topics
    all_mappings = {}
    for exam_id, data in EXAM_DATA.items():
        for syllabus_topic, topic_data in data['syllabus_topics'].items():
            for subject, subject_data in topic_data['subjects'].items():
                sub_topics = subject_data['sub_topics']
                if subject not in all_mappings:
                    all_mappings[subject] = sub_topics
    
    for subject, sub_topics in sorted(all_mappings.items()):
        sub_topics_str = ", ".join([f"'{st}'" for st in sub_topics])
        print(f"    '{subject}': [{sub_topics_str}],")
    
    print("  };")

if __name__ == "__main__":
    print("// Auto-generated from backend/exam_data.py")
    print("// DO NOT EDIT MANUALLY - Run generate_frontend_mappings.py instead!")
    print()
    
    generate_exam_names()
    generate_syllabus_topics_map()
    generate_subjects_map()
    generate_sub_topics_map()
    
    print("\n// Generated successfully!")
