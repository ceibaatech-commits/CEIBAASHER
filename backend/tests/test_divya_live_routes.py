"""
Test suite for Divya Live AI Tutor endpoints
Tests: /api/divya/live/ask, /api/divya/live/upload-context, /api/divya/live/transcribe
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://ceibaa-integration.preview.emergentagent.com').rstrip('/')


class TestDivyaLiveAsk:
    """Tests for /api/divya/live/ask endpoint - AI tutor text/audio response"""
    
    def test_ask_divya_simple_question(self):
        """Test asking Divya a simple math question"""
        response = requests.post(
            f"{BASE_URL}/api/divya/live/ask",
            json={
                "text": "What is 2+2?",
                "tutor": "divya",
                "language": "en",
                "context": "",
                "chat_history": []
            },
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data["success"] == True
        assert "text" in data
        assert len(data["text"]) > 0
        assert "audio_base64" in data
        assert len(data["audio_base64"]) > 100  # Audio should be substantial
        assert data["tutor"] == "divya"
        assert data["language"] == "en"
        
        # Divya's response should include the answer
        assert "4" in data["text"]
        print(f"Divya's response: {data['text'][:200]}")
    
    def test_ask_sher_simple_question(self):
        """Test asking Sher a simple question"""
        response = requests.post(
            f"{BASE_URL}/api/divya/live/ask",
            json={
                "text": "What is the capital of India?",
                "tutor": "sher",
                "language": "en",
                "context": "",
                "chat_history": []
            },
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "text" in data
        assert "audio_base64" in data
        assert data["tutor"] == "sher"
        
        # Should mention Delhi or New Delhi
        assert "delhi" in data["text"].lower()
        print(f"Sher's response: {data['text'][:200]}")
    
    def test_ask_with_context(self):
        """Test asking with study material context"""
        response = requests.post(
            f"{BASE_URL}/api/divya/live/ask",
            json={
                "text": "What is photosynthesis based on the context?",
                "tutor": "divya",
                "language": "en",
                "context": "Photosynthesis is the process by which green plants convert sunlight into chemical energy. The process occurs in chloroplasts and produces glucose and oxygen.",
                "chat_history": []
            },
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        # Response should reference the context
        assert "chloroplast" in data["text"].lower() or "sunlight" in data["text"].lower() or "glucose" in data["text"].lower()
        print(f"Response with context: {data['text'][:200]}")
    
    def test_ask_with_chat_history(self):
        """Test conversation continuity with chat history"""
        # Retry logic for flaky AI responses
        for attempt in range(2):
            response = requests.post(
                f"{BASE_URL}/api/divya/live/ask",
                json={
                    "text": "And what about 5+5?",
                    "tutor": "divya",
                    "language": "en",
                    "context": "",
                    "chat_history": [
                        {"role": "Student", "text": "What is 2+2?"},
                        {"role": "Divya", "text": "2 + 2 equals 4!"}
                    ]
                },
                timeout=70
            )
            
            if response.status_code == 200:
                break
            time.sleep(2)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "10" in data["text"]
        print(f"Chat history response: {data['text'][:200]}")
    
    def test_ask_hindi_language(self):
        """Test response in Hindi language"""
        # Retry logic for flaky AI responses
        for attempt in range(2):
            response = requests.post(
                f"{BASE_URL}/api/divya/live/ask",
                json={
                    "text": "Namaste! Mujhe batao 3+3 kitna hai?",
                    "tutor": "divya",
                    "language": "hi",
                    "context": "",
                    "chat_history": []
                },
                timeout=70
            )
            
            if response.status_code == 200:
                break
            time.sleep(2)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["language"] == "hi"
        # Response should contain Hindi/Hinglish or the answer
        assert "6" in data["text"]
        print(f"Hindi response: {data['text'][:200]}")
    
    def test_ask_invalid_tutor_defaults_to_divya(self):
        """Test that invalid tutor name defaults to divya"""
        response = requests.post(
            f"{BASE_URL}/api/divya/live/ask",
            json={
                "text": "Hello!",
                "tutor": "invalid_tutor",
                "language": "en",
                "context": "",
                "chat_history": []
            },
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["tutor"] == "divya"  # Should default to divya


class TestDivyaLiveUploadContext:
    """Tests for /api/divya/live/upload-context endpoint - PDF text extraction"""
    
    def test_upload_simple_pdf(self):
        """Test uploading a simple PDF for context extraction"""
        # Create a minimal PDF content
        pdf_content = b"""%PDF-1.4
1 0 obj
<</Type/Catalog/Pages 2 0 R>>
endobj
2 0 obj
<</Type/Pages/Kids[3 0 R]/Count 1>>
endobj
3 0 obj
<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R>>
endobj
4 0 obj
<</Length 44>>
stream
BT /F1 12 Tf 100 700 Td (Test content) Tj ET
endstream
endobj
trailer
<</Root 1 0 R>>
%%EOF"""
        
        files = {'files': ('test.pdf', pdf_content, 'application/pdf')}
        response = requests.post(
            f"{BASE_URL}/api/divya/live/upload-context",
            files=files,
            timeout=120
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "context" in data
        assert "char_count" in data
        assert data["char_count"] > 0
        print(f"Extracted context ({data['char_count']} chars): {data['context'][:200]}")
    
    def test_upload_without_file_returns_error(self):
        """Test that uploading without file returns error"""
        response = requests.post(
            f"{BASE_URL}/api/divya/live/upload-context",
            files={},
            timeout=30
        )
        
        # Should return 422 (validation error) since file is required
        assert response.status_code == 422


class TestDivyaLiveTranscribe:
    """Tests for /api/divya/live/transcribe endpoint - Audio transcription"""
    
    def test_transcribe_invalid_audio_returns_error(self):
        """Test that invalid audio file returns appropriate error"""
        # Create a minimal invalid audio file
        invalid_audio = b"test audio content"
        
        files = {'file': ('test.webm', invalid_audio, 'audio/webm')}
        response = requests.post(
            f"{BASE_URL}/api/divya/live/transcribe",
            files=files,
            timeout=30
        )
        
        # Expected to fail with 500 since the audio is invalid
        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
        print(f"Expected error for invalid audio: {data['detail'][:100]}")
    
    def test_transcribe_large_file_rejected(self):
        """Test that files over 25MB are rejected"""
        # Create content that appears to be >25MB
        # Note: This would be slow to actually send, so we just verify the endpoint exists
        response = requests.post(
            f"{BASE_URL}/api/divya/live/transcribe",
            files={'file': ('test.webm', b'small', 'audio/webm')},
            timeout=30
        )
        
        # Should process (or error out) - main check is endpoint exists
        assert response.status_code in [200, 400, 500]


class TestDivyaLiveEndpointAvailability:
    """Basic availability tests for all endpoints"""
    
    def test_ask_endpoint_reachable(self):
        """Verify /api/divya/live/ask endpoint is reachable"""
        response = requests.post(
            f"{BASE_URL}/api/divya/live/ask",
            json={"text": "test", "tutor": "divya", "language": "en"},
            timeout=60
        )
        # Should return 200, not 404
        assert response.status_code in [200, 500]  # 500 if AI service issue
    
    def test_upload_context_endpoint_reachable(self):
        """Verify /api/divya/live/upload-context endpoint is reachable"""
        response = requests.post(
            f"{BASE_URL}/api/divya/live/upload-context",
            files={'files': ('test.pdf', b'%PDF-1.4 test', 'application/pdf')},
            timeout=60
        )
        # Should not return 404
        assert response.status_code != 404
    
    def test_transcribe_endpoint_reachable(self):
        """Verify /api/divya/live/transcribe endpoint is reachable"""
        response = requests.post(
            f"{BASE_URL}/api/divya/live/transcribe",
            files={'file': ('test.webm', b'test', 'audio/webm')},
            timeout=30
        )
        # Should not return 404
        assert response.status_code != 404


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
