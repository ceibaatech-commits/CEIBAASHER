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
            
            # Log the headers to debug
            if reader.fieldnames:
                print(f"📋 CSV Headers found: {reader.fieldnames}")
            
            all_questions = []
            filtered_questions = []
            
            for idx, row in enumerate(reader):
                # Skip empty rows
                if not row or all(not str(v).strip() for v in row.values()):
                    continue
                
                # Try multiple column name variations with whitespace trimming
                # Create a case-insensitive lookup dict
                row_lower = {k.strip().lower(): v for k, v in row.items() if k}
                
                # Parse the row based on your format
                question_text = (row.get('Question') or row.get('question') or 
                               row_lower.get('question') or '').strip()
                
                if not question_text:
                    print(f"⚠️ Row {idx + 1}: Skipping - no question text found. Row keys: {list(row.keys())}")
                    continue
                
                # Get options - try both exact case and lowercase
                option_a = (row.get('A') or row.get('a') or row_lower.get('a') or '').strip()
                option_b = (row.get('B') or row.get('b') or row_lower.get('b') or '').strip()
                option_c = (row.get('C') or row.get('c') or row_lower.get('c') or '').strip()
                option_d = (row.get('D') or row.get('d') or row_lower.get('d') or '').strip()
                
                # Get answer - try multiple column names
                answer = (row.get('Answer') or row.get('answer') or 
                         row.get('Correct Answer') or row.get('correct answer') or
                         row_lower.get('answer') or row_lower.get('correct answer') or '').strip()
                
                if not answer:
                    print(f"⚠️ Row {idx + 1}: No answer found for question: {question_text[:50]}...")
                
                # Convert answer to index (0-3)
                correct_answer = self._parse_answer(answer)
                
                # Get explanation
                explanation = (row.get('Explanation') or row.get('explanation') or 
                              row_lower.get('explanation') or '').strip()
                
                question_obj = {
                    "id": f"q_{idx + 1}",
                    "question": question_text,
                    "options": [option_a, option_b, option_c, option_d],
                    "correctAnswer": correct_answer,
                    "explanation": explanation
                }
                
                all_questions.append(question_obj)
                
                # Check if question matches topic filter
                if topic_filter:
                    # Look for pattern like "(Topic Name):" at start of question
                    if question_text.lower().startswith(f"({topic_filter.lower()}):"):
                        filtered_questions.append(question_obj)
            
            print(f"✅ Parsed {len(all_questions)} total questions")
            if topic_filter:
                print(f"📌 Filtered to {len(filtered_questions)} questions for topic: {topic_filter}")
            
            # Return filtered questions if filter was used AND matches were found
            # Otherwise return all questions (sheets without topic prefixes)
            if topic_filter and filtered_questions:
                return filtered_questions
            else:
                return all_questions
            
        except Exception as e:
            import traceback
            print(f"❌ Error fetching from Google Sheets: {e}")
            print(traceback.format_exc())
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
