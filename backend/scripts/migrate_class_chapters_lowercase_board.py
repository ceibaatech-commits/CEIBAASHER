"""
One-time migration: normalize `class_chapters.board` (and related text fields)
to a clean canonical form so all downstream queries can run regex-free.

What it does (idempotent — safe to re-run):
  • board       → lower-cased + trimmed (e.g. "HBSE " → "hbse")
  • class_name  → trimmed
  • subject     → trimmed
  • chapter_name→ trimmed

Why: read path already tolerates mixed case via case-insensitive regex,
but this lets queries use exact-match indexes and produces cleaner logs.

Usage:
    cd /app/backend && python scripts/migrate_class_chapters_lowercase_board.py
    # or with a dry-run preview:
    cd /app/backend && python scripts/migrate_class_chapters_lowercase_board.py --dry-run

The script prints a summary table of every change it makes before committing.
"""

import argparse
import os
import sys
from collections import Counter
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne

# Load .env from the backend directory so MONGO_URL / DB_NAME resolve correctly
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="Show changes without writing")
    args = parser.parse_args()

    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not mongo_url or not db_name:
        print("ERROR: MONGO_URL / DB_NAME must be set in backend/.env", file=sys.stderr)
        sys.exit(1)

    client = MongoClient(mongo_url)
    db = client[db_name]
    coll = db.class_chapters

    total = coll.count_documents({})
    print(f"\nclass_chapters total docs: {total}")

    if total == 0:
        print("Nothing to migrate. ✅")
        return

    # ── Distribution BEFORE ─────────────────────────────────────
    boards_before = Counter()
    for row in coll.find({}, {"_id": 0, "board": 1}):
        boards_before[row.get("board")] += 1
    print("\nBoard value distribution (BEFORE):")
    for value, count in sorted(boards_before.items(), key=lambda x: (-x[1], str(x[0]))):
        print(f"  {value!r:<20} → {count}")

    # ── Build per-document updates ──────────────────────────────
    ops = []
    changed_board = 0
    changed_text = 0

    for doc in coll.find({}, {"_id": 1, "board": 1, "class_name": 1, "subject": 1, "chapter_name": 1}):
        update = {}

        raw_board = doc.get("board")
        if isinstance(raw_board, str):
            new_board = raw_board.strip().lower()
            if new_board != raw_board:
                update["board"] = new_board
                changed_board += 1

        for key in ("class_name", "subject", "chapter_name"):
            raw = doc.get(key)
            if isinstance(raw, str):
                new = raw.strip()
                if new != raw:
                    update[key] = new
                    changed_text += 1

        if update:
            ops.append(UpdateOne({"_id": doc["_id"]}, {"$set": update}))

    print(f"\nDocs needing board normalization: {changed_board}")
    print(f"Other text fields needing trim   : {changed_text}")
    print(f"Total update operations queued   : {len(ops)}")

    if not ops:
        print("\nAll docs are already normalized. ✅ Nothing to do.")
        return

    if args.dry_run:
        print("\n--dry-run set → NO writes performed. Re-run without --dry-run to apply.")
        return

    # ── Apply updates in one bulk_write ─────────────────────────
    result = coll.bulk_write(ops, ordered=False)
    print(f"\nApplied: modified={result.modified_count}  matched={result.matched_count}")

    # ── Distribution AFTER ──────────────────────────────────────
    boards_after = Counter()
    for row in coll.find({}, {"_id": 0, "board": 1}):
        boards_after[row.get("board")] += 1
    print("\nBoard value distribution (AFTER):")
    for value, count in sorted(boards_after.items(), key=lambda x: (-x[1], str(x[0]))):
        print(f"  {value!r:<20} → {count}")

    print("\nMigration complete. ✅")


if __name__ == "__main__":
    main()
