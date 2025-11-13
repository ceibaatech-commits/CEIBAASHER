import requests
from typing import List, Dict, Optional
import re

class GoogleSheetsService:
    
    @staticmethod
    def extract_sheet_id(url: str) -> str:
        """
        Extract Google Sheet ID from URL
        Handles formats:
        - https://docs.google.com/spreadsheets/d/{ID}/edit
        - https://docs.google.com/spreadsheets/d/{ID}/htmlview
        - https://docs.google.com/spreadsheets/u/0/d/{ID}/edit
        - https://docs.google.com/spreadsheets/u/0/d/{ID}/htmlview
        - Just the ID itself
        """
        # Try to find /d/{SHEET_ID}/ pattern (works for all formats)
        match = re.search(r'/d/([a-zA-Z0-9-_]+)', url)
        if match:
            return match.group(1)
        
        # If no pattern matches, assume it's already an ID
        return url
    
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
                
                # Create a normalized lookup dict (lowercase, trimmed)
                row_normalized = {}
                for k, v in row.items():
                    if k:
                        # Normalize key: lowercase, remove extra spaces, remove special chars
                        normalized_key = k.strip().lower().replace(' ', '').replace('_', '')
                        row_normalized[normalized_key] = str(v).strip() if v else ''
                
                # Parse QUESTION (try multiple variations)
                question_text = ''
                for key_variation in ['question', 'questions', 'ques', 'q']:
                    if key_variation in row_normalized:
                        question_text = row_normalized[key_variation]
                        break
                
                # Also try original keys
                if not question_text:
                    question_text = (row.get('Question') or row.get('question') or 
                                   row.get('QUESTION') or '').strip()
                
                if not question_text:
                    print(f"⚠️ Row {idx + 1}: Skipping - no question text found. Available keys: {list(row.keys())}")
                    continue
                
                # Get OPTIONS A, B, C, D (try multiple variations)
                option_a = row_normalized.get('a') or row.get('A') or row.get('a') or ''
                option_b = row_normalized.get('b') or row.get('B') or row.get('b') or ''
                option_c = row_normalized.get('c') or row.get('C') or row.get('c') or ''
                option_d = row_normalized.get('d') or row.get('D') or row.get('d') or ''
                
                # Get ANSWER (try multiple column name variations)
                answer = ''
                for key_variation in ['answer', 'ans', 'correctanswer', 'correct']:
                    if key_variation in row_normalized:
                        answer = row_normalized[key_variation]
                        break
                
                # Also try original keys
                if not answer:
                    answer = (row.get('Answer') or row.get('answer') or row.get('ANSWER') or
                             row.get('Correct Answer') or row.get('correct answer') or '').strip()
                
                if not answer:
                    print(f"⚠️ Row {idx + 1}: No answer found for question: {question_text[:50]}...")
                
                # Convert answer to index (0-3)
                correct_answer = self._parse_answer(answer)
                
                # Get EXPLANATION (try multiple variations)
                explanation = ''
                for key_variation in ['explanation', 'explaination', 'explain', 'exp']:
                    if key_variation in row_normalized:
                        explanation = row_normalized[key_variation]
                        break
                
                # Also try original keys
                if not explanation:
                    explanation = (row.get('Explanation') or row.get('explanation') or 
                                  row.get('EXPLANATION') or '').strip()
                
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
        """
        Convert answer to 0-3 index
        Handles formats: A/B/C/D, 1/2/3/4, 0/1/2/3, Option A, a), (A), etc.
        """
        if not answer:
            return 0
            
        answer = str(answer).strip().upper()
        
        # Remove common prefixes and suffixes
        answer = answer.replace('OPTION', '').replace('(', '').replace(')', '').strip()
        
        # If it's A, B, C, D (or a), b), etc.)
        if answer in ['A', 'B', 'C', 'D']:
            return ord(answer) - ord('A')
        
        # Check if answer is in format like "A)", "A.", "A:"
        if len(answer) >= 1 and answer[0] in ['A', 'B', 'C', 'D']:
            return ord(answer[0]) - ord('A')
        
        # If it's 1, 2, 3, 4 (convert to 0-3)
        if answer in ['1', '2', '3', '4']:
            return int(answer) - 1
        
        # If it's already 0-3
        try:
            num = int(answer)
            if 0 <= num <= 3:
                return num
            # If it's 1-4, convert to 0-3
            if 1 <= num <= 4:
                return num - 1
        except:
            pass
        
        # Try to extract first letter if it contains a letter
        for char in answer:
            if char in ['A', 'B', 'C', 'D']:
                return ord(char) - ord('A')
        
        print(f"⚠️ Could not parse answer '{answer}', defaulting to A (0)")
        return 0  # Default to first option
    
    def test_sheet_access(self, sheet_url: str) -> Dict:
        """Test if we can access a sheet and return info"""
        try:
            sheet_id = self.extract_sheet_id(sheet_url)
            csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
            
            response = requests.get(csv_url, timeout=10)
            response.raise_for_status()
            
            # Parse CSV to get header info
            import csv
            from io import StringIO
            
            response.encoding = 'utf-8'
            csv_data = StringIO(response.text)
            reader = csv.DictReader(csv_data)
            
            # Get headers
            headers = list(reader.fieldnames) if reader.fieldnames else []
            
            # Count lines
            lines = response.text.split('\n')
            non_empty_lines = [line for line in lines if line.strip()]
            
            return {
                "success": True,
                "sheet_id": sheet_id,
                "row_count": len(non_empty_lines) - 1,  # Exclude header
                "headers": headers,
                "column_count": len(headers),
                "preview": lines[0] if lines else "",
                "format_check": {
                    "has_question": any('question' in h.lower() for h in headers),
                    "has_options": all(opt in [h.strip().upper() for h in headers] for opt in ['A', 'B', 'C', 'D']),
                    "has_answer": any('answer' in h.lower() for h in headers),
                    "expected_format": "QUESTION NUMBER | Question | A | B | C | D | Answer | Explanation"
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
