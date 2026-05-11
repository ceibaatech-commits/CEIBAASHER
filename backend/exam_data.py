# exam_data.py — helpers only. Data lives in exam_data_store.py
from exam_data_store import EXAM_DATA  # noqa: F401  (re-exported for back-compat)

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
