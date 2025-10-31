import requests
from typing import List, Dict, Optional
import re

class GoogleSheetsService:
    
    @staticmethod
    def extract_sheet_id(url: str) -> str:
        """Extract Google Sheet ID from URL"""
        # Pattern: /spreadsheets/d/{SHEET_ID}/
        match = re.search(r'/spreadsheets/d/([a-zA-Z0-9-_]+)', url)
        if match:
            return match.group(1)
        return url  # Assume it's already an ID
    
    def fetch_questions(self, sheet_url: str, sheet_name: str = None, topic_filter: str = None) -> List[Dict]:
        """
        Fetch questions from a public Google Sheet using CSV export
        Expected format: QUESTION NUMBER | Question | A | B | C | D | Answer | Explanation
        
        Args:
            sheet_url: URL of the Google Sheet
            sheet_name: Name of the sheet (optional)
            topic_filter: Filter questions by topic prefix in question text (e.g., "Periodic Table")
                         If topic_filter is provided but no questions match, returns ALL questions
        """
        try:
            sheet_id = self.extract_sheet_id(sheet_url)
            
            # Use public CSV export URL (works for public sheets)
            csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
            
            # Fetch the CSV data with UTF-8 encoding
            response = requests.get(csv_url, timeout=10)
            response.raise_for_status()
            
            # Ensure UTF-8 encoding
            response.encoding = 'utf-8'
            
            # Parse CSV
            import csv
            from io import StringIO
            
            csv_data = StringIO(response.text)
            reader = csv.DictReader(csv_data)
            
            all_questions = []
            filtered_questions = []
            
            for idx, row in enumerate(reader):
                # Parse the row based on your format
                question_text = row.get('Question', row.get('question', ''))
                if not question_text or not question_text.strip():
                    continue
                
                # Get options
                option_a = row.get('A', row.get('a', ''))
                option_b = row.get('B', row.get('b', ''))
                option_c = row.get('C', row.get('c', ''))
                option_d = row.get('D', row.get('d', ''))
                
                # Get answer
                answer = row.get('Answer', row.get('answer', ''))
                
                # Also try 'Correct Answer' column
                if not answer:
                    answer = row.get('Correct Answer', row.get('correct answer', ''))
                
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
                
                all_questions.append(question_obj)
                
                # Check if question matches topic filter
                if topic_filter:
                    # Look for pattern like "(Topic Name):" at start of question
                    if question_text.strip().lower().startswith(f"({topic_filter.lower()}):"):
                        filtered_questions.append(question_obj)
            
            # Return filtered questions if filter was used AND matches were found
            # Otherwise return all questions (sheets without topic prefixes)
            if topic_filter and filtered_questions:
                return filtered_questions
            else:
                return all_questions
            
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
        
        # If it's 1, 2, 3, 4 (convert to 0-3)
        if answer in ['1', '2', '3', '4']:
            return int(answer) - 1
        
        # If it's already 0-3
        try:
            num = int(answer)
            if 0 <= num <= 3:
                return num
        except:
            pass
        
        return 0  # Default to first option
    
    def test_sheet_access(self, sheet_url: str) -> Dict:
        """Test if we can access a sheet and return info"""
        try:
            sheet_id = self.extract_sheet_id(sheet_url)
            csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
            
            response = requests.get(csv_url, timeout=10)
            response.raise_for_status()
            
            # Count lines
            lines = response.text.split('\n')
            
            return {
                "success": True,
                "sheet_id": sheet_id,
                "row_count": len(lines) - 1,  # Exclude header
                "preview": lines[0] if lines else ""
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
