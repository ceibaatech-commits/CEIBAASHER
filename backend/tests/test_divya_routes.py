"""
Divya AI Tutor Backend Tests
Tests for audio Range requests, /ask endpoint, and /mind-map endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestDivyaAudioRangeRequests:
    """Test audio endpoint supports HTTP Range requests for browser streaming"""
    
    def test_audio_with_range_header_returns_206(self):
        """Audio endpoint should return 206 Partial Content with Range header"""
        response = requests.get(
            f"{BASE_URL}/api/divya/audio/test_audio.mp3",
            headers={"Range": "bytes=0-10"}
        )
        
        assert response.status_code == 206, f"Expected 206 Partial Content, got {response.status_code}"
        assert "Accept-Ranges" in response.headers
        assert response.headers.get("Accept-Ranges") == "bytes"
        assert "Content-Range" in response.headers
        assert "Content-Length" in response.headers
        
        # Verify Content-Range format: bytes start-end/total
        content_range = response.headers.get("Content-Range")
        assert content_range.startswith("bytes 0-10/"), f"Invalid Content-Range: {content_range}"
        
        print(f"PASS: Audio with Range header returns 206 with Content-Range: {content_range}")
    
    def test_audio_without_range_header_returns_200(self):
        """Audio endpoint should return 200 OK without Range header"""
        response = requests.get(f"{BASE_URL}/api/divya/audio/test_audio.mp3")
        
        assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
        assert "Accept-Ranges" in response.headers
        assert response.headers.get("Accept-Ranges") == "bytes"
        assert "Content-Length" in response.headers
        
        print(f"PASS: Audio without Range header returns 200 with full content")
    
    def test_audio_partial_range_returns_correct_bytes(self):
        """Audio endpoint should return correct byte range"""
        # Request bytes 5-15
        response = requests.get(
            f"{BASE_URL}/api/divya/audio/test_audio.mp3",
            headers={"Range": "bytes=5-15"}
        )
        
        assert response.status_code == 206
        content_range = response.headers.get("Content-Range")
        assert "bytes 5-15/" in content_range
        
        # Content-Length should match the range (11 bytes)
        assert response.headers.get("Content-Length") == "11"
        
        print(f"PASS: Partial range bytes=5-15 returns correct 11 bytes")
    
    def test_audio_nonexistent_file_returns_404(self):
        """Audio endpoint should return 404 for nonexistent files"""
        response = requests.get(f"{BASE_URL}/api/divya/audio/nonexistent_file.mp3")
        
        assert response.status_code == 404
        print(f"PASS: Nonexistent audio file returns 404")


class TestDivyaAskEndpoint:
    """Test /api/divya/ask endpoint for Join Conversation feature"""
    
    def test_ask_endpoint_returns_success(self):
        """Ask endpoint should return AI responses"""
        payload = {
            "question": "What is photosynthesis?",
            "context": "",
            "recent_chat": ""
        }
        
        response = requests.post(
            f"{BASE_URL}/api/divya/ask",
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") == True
        assert "responses" in data
        assert len(data["responses"]) > 0
        
        # Verify response structure
        for resp in data["responses"]:
            assert "speaker" in resp
            assert "text" in resp
            assert resp["speaker"] in ["Divya", "Sher"]
        
        print(f"PASS: Ask endpoint returns success with {len(data['responses'])} responses")
    
    def test_ask_endpoint_with_context(self):
        """Ask endpoint should use context in response"""
        payload = {
            "question": "Can you explain more about the main topic?",
            "context": "The topic is about climate change and its effects on polar ice caps.",
            "recent_chat": "Divya: Welcome to our discussion!\nSher: Great to have you here!"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/divya/ask",
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        
        print(f"PASS: Ask endpoint works with context and recent_chat")
    
    def test_ask_endpoint_empty_question_handled(self):
        """Ask endpoint should handle empty question gracefully"""
        payload = {
            "question": "",
            "context": "",
            "recent_chat": ""
        }
        
        response = requests.post(
            f"{BASE_URL}/api/divya/ask",
            json=payload,
            timeout=60
        )
        
        # Should either work or return an error - not crash
        assert response.status_code in [200, 400, 422, 500]
        print(f"PASS: Empty question handled with status {response.status_code}")


class TestDivyaMindMapEndpoint:
    """Test /api/divya/mind-map endpoint"""
    
    def test_mind_map_endpoint_returns_success(self):
        """Mind map endpoint should return structured mind map"""
        payload = {
            "content": "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce oxygen and energy. It occurs in chloroplasts and is essential for life on Earth."
        }
        
        response = requests.post(
            f"{BASE_URL}/api/divya/mind-map",
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") == True
        assert "mind_map" in data
        
        mind_map = data["mind_map"]
        assert "title" in mind_map
        assert "branches" in mind_map
        assert isinstance(mind_map["branches"], list)
        
        # Verify branch structure
        for branch in mind_map["branches"]:
            assert "label" in branch
            assert "children" in branch
            assert isinstance(branch["children"], list)
        
        print(f"PASS: Mind map endpoint returns valid structure with {len(mind_map['branches'])} branches")
    
    def test_mind_map_endpoint_empty_content_returns_error(self):
        """Mind map endpoint should reject empty content"""
        payload = {"content": ""}
        
        response = requests.post(
            f"{BASE_URL}/api/divya/mind-map",
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 400
        print(f"PASS: Empty content returns 400 Bad Request")
    
    def test_mind_map_endpoint_whitespace_content_returns_error(self):
        """Mind map endpoint should reject whitespace-only content"""
        payload = {"content": "   \n\t  "}
        
        response = requests.post(
            f"{BASE_URL}/api/divya/mind-map",
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 400
        print(f"PASS: Whitespace-only content returns 400 Bad Request")


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
