import gspread
from typing import List, Dict, Optional
import re

class GoogleSheetsService:
    def __init__(self):
        # For public sheets, we don't need authentication
        self.gc = gspread.Client()
    
    @staticmethod
    def extract_sheet_id(url: str) -> str:
        """Extract Google Sheet ID from URL"""
        # Pattern: /spreadsheets/d/{SHEET_ID}/
        match = re.search(r'/spreadsheets/d/([a-zA-Z0-9-_]+)', url)
        if match:
            return match.group(1)
        return url  # Assume it's already an ID
    
    def fetch_questions(self, sheet_url: str, sheet_name: str = None) -> List[Dict]:
        """
        Fetch questions from a public Google Sheet
        Expected format: QUESTION NUMBER | Question | A | B | C | D | Answer | Explanation
        """
        try:
            sheet_id = self.extract_sheet_id(sheet_url)
            
            # Open the spreadsheet by ID (public access)
            spreadsheet = self.gc.open_by_key(sheet_id)
            
            # Get the first sheet or specified sheet
            if sheet_name:
                worksheet = spreadsheet.worksheet(sheet_name)
            else:
                worksheet = spreadsheet.sheet1
            
            # Get all records (assumes first row is header)
            records = worksheet.get_all_records()
            
            questions = []
            for idx, row in enumerate(records):
                # Parse the row based on your format
                # Expected columns: QUESTION NUMBER, Question, A, B, C, D, Answer, Explanation
                
                question_text = row.get('Question', row.get('question', ''))
                if not question_text:
                    continue
                
                # Get options
                option_a = row.get('A', row.get('a', ''))
                option_b = row.get('B', row.get('b', ''))
                option_c = row.get('C', row.get('c', ''))
                option_d = row.get('D', row.get('d', ''))
                
                # Get answer (can be A, B, C, D or 0, 1, 2, 3)
                answer = row.get('Answer', row.get('answer', ''))
                
                # Convert answer to index (0-3)
                correct_answer = self._parse_answer(answer)
                
                explanation = row.get('Explanation', row.get('explanation', ''))
                
                question_obj = {
                    "id": f"q_{idx + 1}",
                    "question": question_text.strip(),
                    "options": [
                        option_a.strip() if option_a else "",
                        option_b.strip() if option_b else "",
                        option_c.strip() if option_c else "",
                        option_d.strip() if option_d else ""
                    ],
                    "correctAnswer": correct_answer,
                    "explanation": explanation.strip() if explanation else ""
                }
                
                questions.append(question_obj)
            
            return questions
            
        except Exception as e:
            print(f"Error fetching from Google Sheets: {e}")
            return []
    
    @staticmethod
    def _parse_answer(answer: str) -> int:
        """Convert answer to 0-3 index"""
        answer = str(answer).strip().upper()
        
        # If it's A, B, C, D
        if answer in ['A', 'B', 'C', 'D']:
            return ord(answer) - ord('A')
        
        # If it's already a number
        try:
            return int(answer)
        except:
            return 0  # Default to first option
    
    def test_sheet_access(self, sheet_url: str) -> Dict:
        """Test if we can access a sheet and return info"""
        try:
            sheet_id = self.extract_sheet_id(sheet_url)
            spreadsheet = self.gc.open_by_key(sheet_id)
            
            return {
                "success": True,
                "title": spreadsheet.title,
                "sheet_count": len(spreadsheet.worksheets()),
                "sheet_names": [ws.title for ws in spreadsheet.worksheets()]
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
