# 📋 Ceibaa Exam System - Developer Guide

## Single Source of Truth Architecture

The exam system is designed with a **single source of truth** principle:

```
/app/backend/exam_data.py (MASTER DATA)
        ↓
    Backend API
        ↓
   ┌────┴────┐
   ↓         ↓
Home.js   ExamSheetManager.js
(Frontend)    (Admin Panel)
```

## How to Add a New Exam

### Step 1: Add to Backend (REQUIRED)

Edit `/app/backend/exam_data.py` and add your exam to the `EXAM_DATA` dictionary:

```python
"YOUR_EXAM_ID": {
    "name": "Exam Display Name",
    "full_name": "Full Official Exam Name",
    "description": "Brief description of the exam",
    "icon": "https://example.com/icon.png",  # or emoji like "📚"
    "color": "from-blue-500 to-indigo-600",  # Tailwind gradient
    "total_questions": 150,
    "duration": "3 hours",
    "category": "Your Category",  # See existing categories below
    "syllabus_topics": {
        "Syllabus Topic 1": {
            "subjects": {
                "Subject Name": {
                    "sub_topics": ["Sub Topic 1", "Sub Topic 2", "Sub Topic 3"],
                    "questions": 30
                }
            }
        }
    }
}
```

### Step 2: Check Category (CONDITIONAL)

**If using an EXISTING category**, you're done! The exam will automatically appear in:
- ✅ Homepage exam list
- ✅ Admin Panel dropdowns
- ✅ Category filter (if category is mapped)

**Existing Categories:**
| Category Name | Homepage Section |
|--------------|------------------|
| `Admission Tests` | Admission Tests |
| `Medical Entrance` | Medical |
| `Defence` / `Defence Examinations` | Defence Exams |
| `Banking Examinations` | Banking Examinations |
| `Teaching Examinations` | Teaching Examinations |
| `SSC Examinations` | SSC Examinations |
| `UPSC Examinations` | UPSC Examinations |
| `RSMSSB Examinations` | RSMSSB Examinations |
| `Language Proficiency Tests` | Language Tests |

### Step 3: For NEW Categories (OPTIONAL)

If you need a **NEW category**, update these files:

#### 3a. Update Home.js - Categories Array
File: `/app/frontend/src/pages/Home.js`

Add to the `categories` array:
```javascript
{ id: 'yourcategory', label: 'Your Category', icon: '📚', color: 'from-blue-600 to-indigo-600' },
```

#### 3b. Update Home.js - Category Map
In the `getFilteredExams()` function, add:
```javascript
yourcategory: { ids: ['YOUR_EXAM_ID'], categories: ['Your Category'] },
```

#### 3c. Add Desktop Section (Optional)
Copy an existing exam section (search for "Examinations Section") and modify it for your new category.

## File Reference

| File | Purpose |
|------|---------|
| `/app/backend/exam_data.py` | **MASTER DATA** - All exam definitions |
| `/app/backend/exam_metadata_routes.py` | API endpoint that serves exam data |
| `/app/frontend/src/pages/Home.js` | Homepage with category filters |
| `/app/frontend/src/components/admin/ExamSheetManager.js` | Admin panel for managing questions |

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/quiz/exams` | List all exams for homepage |
| `GET /api/exam-metadata` | Full exam metadata for admin panel |
| `GET /api/exam-metadata/{exam_id}` | Single exam details |

## Testing Your New Exam

1. **Homepage**: Visit `/` and check if exam appears in the correct category
2. **Exam Page**: Visit `/exam/YOUR_EXAM_ID` to see syllabus details
3. **Admin Panel**: Go to `/admin` → Exam Sheet Manager → Add New Sheet
   - Your exam should appear in the dropdown
   - Selecting it should show correct syllabus topics/subjects

## Troubleshooting

### Exam not showing in Admin Panel?
- Check if the backend API is returning it: `curl /api/exam-metadata | grep YOUR_EXAM_ID`
- The admin panel uses dynamic loading - refresh the page

### Exam not in homepage category?
- Verify the `category` field in exam_data.py matches an existing category
- If new category, make sure categoryMap in Home.js is updated

### Syllabus topics not cascading?
- Check the structure in exam_data.py follows the exact format
- Ensure `syllabus_topics` → `subjects` → `sub_topics` hierarchy

---

*Last Updated: December 2024*
