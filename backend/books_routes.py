"""
Books Routes for Ceibaa Platform
Handles books, chapters, and book-based questions
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid

router = APIRouter()

# Global db instance (will be set from server.py)
db = None

def init_db(database):
    global db
    db = database


# ==================== MODELS ====================

class Book(BaseModel):
    name: str
    description: Optional[str] = None
    author: Optional[str] = None
    publisher: Optional[str] = None
    cover_image: Optional[str] = None
    category: Optional[str] = None  # e.g., "Academic", "Competitive Exam", "General"
    isActive: bool = True

class Chapter(BaseModel):
    book_id: str
    name: str
    chapter_number: int
    description: Optional[str] = None

class BookSheet(BaseModel):
    book_name: str
    chapter_name: str
    sheet_link: str


# ==================== BOOKS CRUD ====================

@router.get("/api/books")
async def get_all_books(category: Optional[str] = None, active_only: bool = True):
    """
    Get all books
    """
    try:
        query = {}
        if active_only:
            query["isActive"] = True
        if category:
            query["category"] = category
        
        books = await db.books.find(query, {"_id": 0}).to_list(1000)
        
        # Add chapter count for each book
        for book in books:
            book_id = book.get("id")
            chapter_count = await db.book_chapters.count_documents({"book_id": book_id})
            book["chapter_count"] = chapter_count
        
        return {
            "success": True,
            "books": books,
            "count": len(books)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching books: {str(e)}")


@router.get("/api/books/{book_id}")
async def get_book(book_id: str):
    """
    Get a specific book with its chapters
    """
    try:
        book = await db.books.find_one({"id": book_id}, {"_id": 0})
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        # Get chapters for this book
        chapters = await db.book_chapters.find(
            {"book_id": book_id}, 
            {"_id": 0}
        ).sort("chapter_number", 1).to_list(1000)
        
        book["chapters"] = chapters
        
        return {
            "success": True,
            "book": book
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching book: {str(e)}")


@router.post("/api/books")
async def create_book(book: Book):
    """
    Create a new book
    """
    try:
        book_id = str(uuid.uuid4())
        book_data = {
            "id": book_id,
            "name": book.name,
            "description": book.description,
            "author": book.author,
            "publisher": book.publisher,
            "cover_image": book.cover_image,
            "category": book.category or "Academic",
            "isActive": book.isActive,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.books.insert_one(book_data.copy())
        
        return {
            "success": True,
            "message": "Book created successfully",
            "book": book_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating book: {str(e)}")


@router.put("/api/books/{book_id}")
async def update_book(book_id: str, book: Book):
    """
    Update a book
    """
    try:
        existing = await db.books.find_one({"id": book_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Book not found")
        
        update_data = {
            "name": book.name,
            "description": book.description,
            "author": book.author,
            "publisher": book.publisher,
            "cover_image": book.cover_image,
            "category": book.category,
            "isActive": book.isActive,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.books.update_one(
            {"id": book_id},
            {"$set": update_data}
        )
        
        return {
            "success": True,
            "message": "Book updated successfully"
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating book: {str(e)}")


@router.delete("/api/books/{book_id}")
async def delete_book(book_id: str):
    """
    Delete a book (soft delete - set isActive to False)
    """
    try:
        result = await db.books.update_one(
            {"id": book_id},
            {"$set": {"isActive": False, "deleted_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Book not found")
        
        return {
            "success": True,
            "message": "Book deleted successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting book: {str(e)}")


# ==================== CHAPTERS CRUD ====================

@router.get("/api/books/{book_id}/chapters")
async def get_book_chapters(book_id: str):
    """
    Get all chapters for a book
    """
    try:
        chapters = await db.book_chapters.find(
            {"book_id": book_id},
            {"_id": 0}
        ).sort("chapter_number", 1).to_list(1000)
        
        # Add question count for each chapter
        for chapter in chapters:
            chapter_id = chapter.get("id")
            # Count questions in exam_sheets collection with book_id and chapter_id
            question_count = await db.exam_sheets.count_documents({
                "type": "book",
                "book_id": book_id,
                "chapter_id": chapter_id,
                "questions_imported": True
            })
            chapter["question_count"] = question_count
        
        return {
            "success": True,
            "chapters": chapters,
            "count": len(chapters)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching chapters: {str(e)}")


@router.post("/api/books/{book_id}/chapters")
async def create_chapter(book_id: str, chapter: Chapter):
    """
    Create a new chapter for a book
    """
    try:
        # Verify book exists
        book = await db.books.find_one({"id": book_id})
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        chapter_id = str(uuid.uuid4())
        chapter_data = {
            "id": chapter_id,
            "book_id": book_id,
            "name": chapter.name,
            "chapter_number": chapter.chapter_number,
            "description": chapter.description,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.book_chapters.insert_one(chapter_data.copy())
        
        return {
            "success": True,
            "message": "Chapter created successfully",
            "chapter": chapter_data
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating chapter: {str(e)}")


@router.delete("/api/books/chapters/{chapter_id}")
async def delete_chapter(chapter_id: str):
    """
    Delete a chapter
    """
    try:
        result = await db.book_chapters.delete_one({"id": chapter_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Chapter not found")
        
        return {
            "success": True,
            "message": "Chapter deleted successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting chapter: {str(e)}")


# ==================== BOOK QUESTIONS ====================

@router.post("/api/admin/sheets/book")
async def create_book_sheet(sheet: BookSheet):
    """
    Add a question sheet for a book chapter
    """
    try:
        from google_sheets_service import GoogleSheetsService
        
        # Find book by name
        book = await db.books.find_one({"name": sheet.book_name})
        if not book:
            raise HTTPException(status_code=404, detail=f"Book '{sheet.book_name}' not found")
        
        # Find chapter by name
        chapter = await db.book_chapters.find_one({
            "book_id": book["id"],
            "name": sheet.chapter_name
        })
        if not chapter:
            raise HTTPException(status_code=404, detail=f"Chapter '{sheet.chapter_name}' not found in book '{sheet.book_name}'")
        
        sheet_id = str(uuid.uuid4())
        sheet_data = {
            "id": sheet_id,
            "type": "book",
            "book_id": book["id"],
            "book_name": sheet.book_name,
            "chapter_id": chapter["id"],
            "chapter_name": sheet.chapter_name,
            "sheet_link": sheet.sheet_link,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "questions_imported": False,
            "question_count": 0
        }
        
        # Try to import questions from sheet
        try:
            sheets_service = GoogleSheetsService()
            questions = sheets_service.fetch_questions(sheet.sheet_link)
            
            if questions:
                sheet_data["questions_imported"] = True
                sheet_data["question_count"] = len(questions)
                print(f"✅ Imported {len(questions)} questions for {sheet.book_name} - {sheet.chapter_name}")
            else:
                print(f"⚠️ No questions found in sheet for {sheet.book_name} - {sheet.chapter_name}")
        except Exception as e:
            print(f"⚠️ Could not import questions: {e}")
        
        await db.exam_sheets.insert_one(sheet_data.copy())
        
        return {
            "success": True,
            "message": "Book sheet added successfully",
            "sheet": sheet_data
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error creating book sheet: {str(e)}")


@router.get("/api/books/{book_id}/chapters/{chapter_id}/questions")
async def get_chapter_questions(book_id: str, chapter_id: str):
    """
    Get questions for a specific chapter
    """
    try:
        from google_sheets_service import GoogleSheetsService
        
        # Find the sheet mapping
        sheet_mapping = await db.exam_sheets.find_one({
            "type": "book",
            "book_id": book_id,
            "chapter_id": chapter_id
        })
        
        if not sheet_mapping:
            return {
                "success": False,
                "message": "No questions available for this chapter",
                "questions": []
            }
        
        # Fetch questions from Google Sheet
        sheets_service = GoogleSheetsService()
        questions = sheets_service.fetch_questions(sheet_mapping["sheet_link"])
        
        return {
            "success": True,
            "questions": questions,
            "count": len(questions)
        }
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error fetching questions: {str(e)}")
