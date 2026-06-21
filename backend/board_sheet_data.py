import re
from collections import defaultdict


DYNAMIC_BOARDS = {"rbse", "hbse", "upboard", "bseb", "mpbse"}


def normalize_board(board: str | None) -> str:
    return (board or "cbse").strip().lower()


def is_dynamic_board(board: str | None) -> bool:
    return normalize_board(board) in DYNAMIC_BOARDS


def board_class_name(class_num: str, stream: str | None = None) -> str:
    class_num = str(class_num).replace("class-", "").replace("Class ", "")
    if class_num in {"11", "12"} and stream:
        return f"Class {class_num} ({stream.title()})"
    return f"Class {class_num}"


def subject_slug(subject_name: str) -> str:
    return (
        (subject_name or "")
        .strip()
        .lower()
        .replace(" - ", "---")
        .replace(": ", ":")
        .replace(" ", "-")
    )


def _chapter_sort_key(chapter_name: str):
    chapter_name = (chapter_name or "").strip()
    match = re.match(r"^(\d+)[\.)\-: ]*", chapter_name)
    if match:
        return (0, int(match.group(1)), chapter_name.lower())
    return (1, chapter_name.lower())


def _dedupe_preserve_order(items: list[str]) -> list[str]:
    seen = set()
    result = []
    for item in items:
        normalized = (item or "").strip()
        if not normalized:
            continue
        key = normalized.casefold()
        if key in seen:
            continue
        seen.add(key)
        result.append(normalized)
    return result


# ─────────────────────────────────────────────────────────────
# class_chapters collection — written by the admin Class Chapter Manager.
# We MERGE these with exam_sheets so that subjects/chapters defined via
# the Chapter Manager appear immediately in Exam Sheet Manager dropdowns
# AND on the student frontend — even before a Google Sheet has been
# linked. Board comparison is case-insensitive (regex ^...$ /i) because
# legacy rows may have mixed case (e.g. "HBSE" vs "hbse").
# ─────────────────────────────────────────────────────────────

def _board_case_insensitive_filter(board_value: str) -> dict:
    """Return a Mongo filter that matches `board_value` regardless of case
    (covers legacy uppercase rows and the new normalized lowercase rows)."""
    return {"$regex": f"^{re.escape(board_value)}$", "$options": "i"}


async def _get_subjects_from_class_chapters(
    db, class_name: str, normalized_board: str
) -> list[str]:
    rows = await db.class_chapters.find(
        {
            "class_name": class_name,
            "board": _board_case_insensitive_filter(normalized_board),
        },
        {"_id": 0, "subject": 1},
    ).to_list(2000)
    return [row.get("subject") for row in rows]


async def _get_chapters_from_class_chapters(
    db, class_name: str, subject_name: str, normalized_board: str
) -> list[str]:
    rows = await db.class_chapters.find(
        {
            "class_name": class_name,
            "board": _board_case_insensitive_filter(normalized_board),
            "subject": {"$regex": f"^{re.escape(subject_name)}$", "$options": "i"},
        },
        {"_id": 0, "chapter_name": 1, "chapter_number": 1},
    ).to_list(2000)
    return [row.get("chapter_name") for row in rows]


async def get_dynamic_board_subjects_for_class(db, class_num: str, stream: str | None = None, board: str | None = None) -> list[dict]:
    class_name = board_class_name(class_num, stream)
    normalized_board = normalize_board(board)

    # 1) Subjects that already have a linked Google Sheet
    sheets = await db.exam_sheets.find(
        {"type": "class", "board": normalized_board, "class_name": class_name},
        {"_id": 0, "subject": 1},
    ).to_list(2000)
    subject_pool = [sheet.get("subject") for sheet in sheets]

    # 2) Subjects defined via the admin Class Chapter Manager (no sheet yet)
    subject_pool += await _get_subjects_from_class_chapters(db, class_name, normalized_board)

    subjects = sorted(
        _dedupe_preserve_order(subject_pool),
        key=lambda value: value.lower(),
    )

    return [
        {
            "name": subject,
            "slug": subject_slug(subject),
            "icon": "BookOpen",
            "color": "from-blue-500 to-blue-600",
        }
        for subject in subjects
    ]


async def get_dynamic_board_chapters_for_subject(db, class_num: str, subject_name: str, stream: str | None = None, board: str | None = None) -> list[str]:
    class_name = board_class_name(class_num, stream)
    normalized_board = normalize_board(board)

    sheets = await db.exam_sheets.find(
        {
            "type": "class",
            "board": normalized_board,
            "class_name": class_name,
            "subject": {"$regex": f"^{re.escape(subject_name)}$", "$options": "i"},
        },
        {"_id": 0, "chapter": 1},
    ).to_list(2000)
    chapter_pool = [sheet.get("chapter") for sheet in sheets]

    # Merge in chapters defined via Class Chapter Manager
    chapter_pool += await _get_chapters_from_class_chapters(db, class_name, subject_name, normalized_board)

    chapters = _dedupe_preserve_order(chapter_pool)
    return sorted(chapters, key=_chapter_sort_key)


async def get_dynamic_board_chapter_cards(db, class_num: str, subject_name: str, board: str | None = None) -> list[dict]:
    class_name = board_class_name(class_num)
    normalized_board = normalize_board(board)

    # ── 1) Pull authoritative metadata (#questions, difficulty, duration)
    #       from class_chapters, the admin-curated source of truth.
    cc_rows = await db.class_chapters.find(
        {
            "class_name": class_name,
            "board": _board_case_insensitive_filter(normalized_board),
            "subject": {"$regex": f"^{re.escape(subject_name)}$", "$options": "i"},
        },
        {"_id": 0, "chapter_number": 1, "chapter_name": 1, "total_questions": 1, "difficulty": 1, "duration": 1},
    ).to_list(2000)

    cc_by_name: dict[str, dict] = {}
    for row in cc_rows:
        name = (row.get("chapter_name") or "").strip()
        if name:
            cc_by_name[name.casefold()] = row

    # ── 2) Pull question counts from any linked exam_sheets so totals
    #       reflect actual MCQ inventory if a sheet has been uploaded.
    sheets = await db.exam_sheets.find(
        {
            "type": "class",
            "board": normalized_board,
            "class_name": class_name,
            "subject": {"$regex": f"^{re.escape(subject_name)}$", "$options": "i"},
        },
        {"_id": 0, "chapter": 1, "question_count": 1},
    ).to_list(2000)

    chapter_counts: dict[str, int] = defaultdict(int)
    for sheet in sheets:
        chapter_name = (sheet.get("chapter") or "").strip()
        if not chapter_name:
            continue
        chapter_counts[chapter_name] += int(sheet.get("question_count") or 0)

    # ── 3) Merge both sources: every chapter from class_chapters PLUS any
    #       chapter from exam_sheets that isn't already listed (safety net
    #       for sheets uploaded before the Chapter Manager existed).
    merged_names = _dedupe_preserve_order(
        [r.get("chapter_name") for r in cc_rows] + list(chapter_counts.keys())
    )

    sorted_names = sorted(merged_names, key=_chapter_sort_key)
    cards: list[dict] = []
    for index, chapter_name in enumerate(sorted_names):
        cc = cc_by_name.get(chapter_name.casefold())
        sheet_count = chapter_counts.get(chapter_name) or 0
        if cc:
            total_q = sheet_count or int(cc.get("total_questions") or 0)
            difficulty = cc.get("difficulty") or "Medium"
            duration = int(cc.get("duration") or 30)
            chapter_number = int(cc.get("chapter_number") or (index + 1))
        else:
            total_q = sheet_count
            difficulty = "Medium"
            duration = 30
            chapter_number = index + 1
        cards.append({
            "chapter_number": chapter_number,
            "chapter_name": chapter_name,
            "total_questions": total_q,
            "difficulty": difficulty,
            "duration": duration,
        })
    return cards


async def get_dynamic_board_chapter_detail(db, class_num: str, subject_name: str, chapter_number: int, board: str | None = None) -> dict | None:
    chapters = await get_dynamic_board_chapter_cards(db, class_num, subject_name, board)
    for chapter in chapters:
        if chapter["chapter_number"] == chapter_number:
            return chapter
    return None


async def get_dynamic_board_admin_map(db, board: str | None = None) -> dict:
    normalized_board = normalize_board(board)
    class_subjects = {
        "Class 6": {},
        "Class 7": {},
        "Class 8": {},
        "Class 9": {},
        "Class 10": {},
        "Class 11 (Science)": {},
        "Class 11 (Commerce)": {},
        "Class 11 (Humanities)": {},
        "Class 12 (Science)": {},
        "Class 12 (Commerce)": {},
        "Class 12 (Humanities)": {},
    }

    grouped: dict[str, dict[str, list[str]]] = defaultdict(lambda: defaultdict(list))

    # ── 1) Chapters defined via the admin Class Chapter Manager. This is the
    #       primary source that powers ExamSheetManager's Subject + Chapter
    #       dropdowns BEFORE a Google Sheet is linked.
    cc_rows = await db.class_chapters.find(
        {"board": _board_case_insensitive_filter(normalized_board)},
        {"_id": 0, "class_name": 1, "subject": 1, "chapter_name": 1, "chapter_number": 1},
    ).to_list(10000)
    # Stable order by chapter_number
    cc_rows_sorted = sorted(cc_rows, key=lambda r: int(r.get("chapter_number") or 9999))
    for row in cc_rows_sorted:
        class_name = (row.get("class_name") or "").strip()
        subject = (row.get("subject") or "").strip()
        chapter = (row.get("chapter_name") or "").strip()
        if not class_name or not subject or not chapter:
            continue
        grouped[class_name][subject].append(chapter)

    # ── 2) Merge in chapters that came in via exam_sheets uploads (so
    #       legacy data also surfaces). Case-insensitive board match.
    sheets = await db.exam_sheets.find(
        {"type": "class", "board": normalized_board},
        {"_id": 0, "class_name": 1, "subject": 1, "chapter": 1},
    ).to_list(10000)
    for sheet in sheets:
        class_name = (sheet.get("class_name") or "").strip()
        subject = (sheet.get("subject") or "").strip()
        chapter = (sheet.get("chapter") or "").strip()
        if not class_name or not subject:
            continue
        grouped[class_name][subject].append(chapter)

    for class_name, subjects in grouped.items():
        class_subjects.setdefault(class_name, {})
        for subject, chapters in subjects.items():
            class_subjects[class_name][subject] = sorted(
                _dedupe_preserve_order(chapters),
                key=_chapter_sort_key,
            )

    return class_subjects
