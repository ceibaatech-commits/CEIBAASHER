"""
Test 1v1 Battle Matchmaking and WebRTC Video Chat Feature
Tests the matchmaking flow and WebRTC signaling events between two users
"""
import pytest
import os
import asyncio
import socketio
import time
from datetime import datetime

# Configure pytest-asyncio
pytestmark = pytest.mark.asyncio

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestBattleMatchmaking:
    """Test 1v1 matchmaking functionality"""

    def test_backend_url_configured(self):
        """Test that backend URL is properly configured"""
        assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
        print(f"✅ Backend URL configured: {BASE_URL}")

    @pytest.mark.asyncio
    async def test_socket_connection(self):
        """Test Socket.IO connection to battle server"""
        sio = socketio.AsyncClient()
        connected = False
        
        @sio.event
        async def connect():
            nonlocal connected
            connected = True
            print("✅ Socket connected to battle server")
        
        try:
            await sio.connect(
                BASE_URL,
                socketio_path='/api/battlews/socket.io',
                transports=['websocket', 'polling'],
                wait_timeout=10
            )
            await asyncio.sleep(1)
            assert connected, "Failed to connect to battle socket server"
            print(f"✅ Socket.IO connection successful, connected={sio.connected}")
        finally:
            await sio.disconnect()

    @pytest.mark.asyncio
    async def test_find_match_event(self):
        """Test that find-match event is accepted by server"""
        sio = socketio.AsyncClient()
        waiting_received = False
        match_found = False
        
        @sio.event
        async def waiting(data):
            nonlocal waiting_received
            waiting_received = True
            print(f"✅ Received 'waiting' event: {data}")
        
        @sio.event
        async def match_found_handler(data):
            nonlocal match_found
            match_found = True
            print(f"✅ Received 'match-found' event: {data}")
        
        sio.on('match-found', match_found_handler)
        
        try:
            await sio.connect(
                BASE_URL,
                socketio_path='/api/battlews/socket.io',
                transports=['websocket', 'polling'],
                wait_timeout=10
            )
            
            # Send find-match event
            await sio.emit('find-match', {
                'playerName': 'TestPlayer1',
                'exam': 'NDA',
                'subject': 'Mathematics (300 Marks)',
                'topic': 'Trigonometry'
            })
            
            # Wait for response
            await asyncio.sleep(3)
            
            # Should receive 'waiting' since no other player is searching
            assert waiting_received or match_found, "Should receive either 'waiting' or 'match-found'"
            print(f"✅ find-match event handled correctly (waiting={waiting_received}, match={match_found})")
            
        finally:
            # Cancel matchmaking
            await sio.emit('cancel-match')
            await asyncio.sleep(0.5)
            await sio.disconnect()


class TestMatchmakingFlow:
    """Test full matchmaking flow with two users"""

    @pytest.mark.asyncio
    async def test_two_players_matchmaking(self):
        """Test that two players can match and get a roomId"""
        # Create two socket clients
        sio1 = socketio.AsyncClient()
        sio2 = socketio.AsyncClient()
        
        results = {
            'player1_waiting': False,
            'player1_matched': False,
            'player1_room_id': None,
            'player2_waiting': False,
            'player2_matched': False,
            'player2_room_id': None
        }
        
        # Player 1 handlers
        @sio1.event
        async def waiting(data):
            results['player1_waiting'] = True
            print(f"[Player1] ⏳ Waiting: {data}")
        
        def handle_match_found_p1(data):
            results['player1_matched'] = True
            results['player1_room_id'] = data.get('roomId')
            print(f"[Player1] 🎯 Match found! Room: {results['player1_room_id']}")
        sio1.on('match-found', handle_match_found_p1)
        
        # Player 2 handlers
        @sio2.event
        async def waiting(data):
            results['player2_waiting'] = True
            print(f"[Player2] ⏳ Waiting: {data}")
        
        def handle_match_found_p2(data):
            results['player2_matched'] = True
            results['player2_room_id'] = data.get('roomId')
            print(f"[Player2] 🎯 Match found! Room: {results['player2_room_id']}")
        sio2.on('match-found', handle_match_found_p2)
        
        try:
            # Connect both players
            await sio1.connect(
                BASE_URL,
                socketio_path='/api/battlews/socket.io',
                transports=['websocket', 'polling'],
                wait_timeout=10
            )
            print("[Player1] ✅ Connected")
            
            await sio2.connect(
                BASE_URL,
                socketio_path='/api/battlews/socket.io',
                transports=['websocket', 'polling'],
                wait_timeout=10
            )
            print("[Player2] ✅ Connected")
            
            # Player 1 starts searching
            await sio1.emit('find-match', {
                'playerName': 'demo1',
                'exam': 'NDA',
                'subject': 'Mathematics (300 Marks)',
                'topic': 'Trigonometry'
            })
            print("[Player1] 🔍 Searching for match...")
            
            await asyncio.sleep(1)
            
            # Player 2 starts searching (same topic)
            await sio2.emit('find-match', {
                'playerName': 'demo2',
                'exam': 'NDA',
                'subject': 'Mathematics (300 Marks)',
                'topic': 'Trigonometry'
            })
            print("[Player2] 🔍 Searching for match...")
            
            # Wait for match
            await asyncio.sleep(3)
            
            # Verify results
            assert results['player1_matched'], "Player 1 should receive match-found"
            assert results['player2_matched'], "Player 2 should receive match-found"
            assert results['player1_room_id'] == results['player2_room_id'], "Both players should be in same room"
            
            print(f"✅ Both players matched in room: {results['player1_room_id']}")
            
        finally:
            await sio1.emit('cancel-match')
            await sio2.emit('cancel-match')
            await asyncio.sleep(0.5)
            await sio1.disconnect()
            await sio2.disconnect()


class TestWebRTCSignaling:
    """Test WebRTC signaling events through Socket.IO"""

    @pytest.mark.asyncio 
    async def test_webrtc_offer_forwarding(self):
        """Test that WebRTC offer is forwarded to other player"""
        sio1 = socketio.AsyncClient()
        sio2 = socketio.AsyncClient()
        
        results = {
            'room_id': None,
            'offer_sent': False,
            'offer_received': False,
            'offer_data': None
        }
        
        # Match found handlers
        def handle_match_found_p1(data):
            results['room_id'] = data.get('roomId')
            print(f"[Player1] 🎯 Room: {results['room_id']}")
        sio1.on('match-found', handle_match_found_p1)
        
        def handle_match_found_p2(data):
            print(f"[Player2] 🎯 Room: {data.get('roomId')}")
        sio2.on('match-found', handle_match_found_p2)
        
        # WebRTC handlers
        def handle_webrtc_offer(data):
            results['offer_received'] = True
            results['offer_data'] = data
            print(f"[Player2] 📹 Received WebRTC offer from {data.get('from')}")
        sio2.on('webrtc-offer', handle_webrtc_offer)
        
        try:
            # Connect both players
            await sio1.connect(
                BASE_URL,
                socketio_path='/api/battlews/socket.io',
                transports=['websocket', 'polling'],
                wait_timeout=10
            )
            await sio2.connect(
                BASE_URL,
                socketio_path='/api/battlews/socket.io',
                transports=['websocket', 'polling'],
                wait_timeout=10
            )
            print("[Both] ✅ Connected")
            
            # Match both players
            await sio1.emit('find-match', {
                'playerName': 'demo1',
                'exam': 'NDA',
                'subject': 'Mathematics (300 Marks)',
                'topic': 'Trigonometry'
            })
            await asyncio.sleep(0.5)
            
            await sio2.emit('find-match', {
                'playerName': 'demo2',
                'exam': 'NDA',
                'subject': 'Mathematics (300 Marks)',
                'topic': 'Trigonometry'
            })
            
            # Wait for match
            await asyncio.sleep(2)
            
            assert results['room_id'], "Should get a room ID from match"
            
            # Player 1 joins video room and sends WebRTC offer
            await sio1.emit('join-video-room', {'roomId': results['room_id']})
            await sio2.emit('join-video-room', {'roomId': results['room_id']})
            await asyncio.sleep(0.5)
            
            # Player 1 sends a mock WebRTC offer
            mock_offer = {
                'type': 'offer',
                'sdp': 'v=0\no=- 1234567890 1234567890 IN IP4 127.0.0.1\ns=-\nt=0 0\na=group:BUNDLE 0\nm=video 9 UDP/TLS/RTP/SAVPF 96\nc=IN IP4 0.0.0.0\na=rtcp:9 IN IP4 0.0.0.0\na=ice-ufrag:mock\na=ice-pwd:mockpassword\na=fingerprint:sha-256 AA:BB:CC:DD:EE:FF\na=setup:actpass\na=mid:0\na=sendrecv'
            }
            
            await sio1.emit('webrtc_offer', {
                'roomId': results['room_id'],
                'offer': mock_offer
            })
            results['offer_sent'] = True
            print(f"[Player1] 📤 Sent WebRTC offer to room {results['room_id']}")
            
            # Wait for offer to be forwarded
            await asyncio.sleep(2)
            
            # Verify offer was received by player 2
            assert results['offer_received'], "Player 2 should receive the WebRTC offer"
            assert results['offer_data'].get('offer'), "Offer data should contain offer"
            
            print("✅ WebRTC offer successfully forwarded between players")
            
        finally:
            await sio1.emit('cancel-match')
            await sio2.emit('cancel-match')
            await asyncio.sleep(0.5)
            await sio1.disconnect()
            await sio2.disconnect()

    @pytest.mark.asyncio
    async def test_webrtc_answer_forwarding(self):
        """Test that WebRTC answer is forwarded back to caller"""
        sio1 = socketio.AsyncClient()
        sio2 = socketio.AsyncClient()
        
        results = {
            'room_id': None,
            'answer_received': False,
            'answer_data': None
        }
        
        # Match found handlers
        def handle_match_found(data):
            results['room_id'] = data.get('roomId')
        sio1.on('match-found', handle_match_found)
        sio2.on('match-found', handle_match_found)
        
        # WebRTC handlers - Player 1 receives answer from Player 2
        def handle_webrtc_answer(data):
            results['answer_received'] = True
            results['answer_data'] = data
            print(f"[Player1] 📹 Received WebRTC answer from {data.get('from')}")
        sio1.on('webrtc-answer', handle_webrtc_answer)
        
        try:
            # Connect and match
            await sio1.connect(BASE_URL, socketio_path='/api/battlews/socket.io', transports=['websocket', 'polling'])
            await sio2.connect(BASE_URL, socketio_path='/api/battlews/socket.io', transports=['websocket', 'polling'])
            
            await sio1.emit('find-match', {'playerName': 'demo1', 'exam': 'NDA', 'subject': 'Mathematics (300 Marks)', 'topic': 'Trigonometry'})
            await asyncio.sleep(0.5)
            await sio2.emit('find-match', {'playerName': 'demo2', 'exam': 'NDA', 'subject': 'Mathematics (300 Marks)', 'topic': 'Trigonometry'})
            await asyncio.sleep(2)
            
            assert results['room_id'], "Should get a room ID"
            
            # Join video rooms
            await sio1.emit('join-video-room', {'roomId': results['room_id']})
            await sio2.emit('join-video-room', {'roomId': results['room_id']})
            await asyncio.sleep(0.5)
            
            # Player 2 sends answer (simulating response to offer)
            mock_answer = {
                'type': 'answer',
                'sdp': 'v=0\no=- 9876543210 9876543210 IN IP4 127.0.0.1\ns=-\nt=0 0\na=group:BUNDLE 0\nm=video 9 UDP/TLS/RTP/SAVPF 96\nc=IN IP4 0.0.0.0\na=rtcp:9 IN IP4 0.0.0.0\na=ice-ufrag:mock2\na=ice-pwd:mockpassword2\na=fingerprint:sha-256 11:22:33:44:55:66\na=setup:active\na=mid:0\na=sendrecv'
            }
            
            await sio2.emit('webrtc_answer', {
                'roomId': results['room_id'],
                'answer': mock_answer
            })
            print(f"[Player2] 📤 Sent WebRTC answer")
            
            await asyncio.sleep(2)
            
            assert results['answer_received'], "Player 1 should receive WebRTC answer"
            print("✅ WebRTC answer successfully forwarded")
            
        finally:
            await sio1.emit('cancel-match')
            await sio2.emit('cancel-match')
            await sio1.disconnect()
            await sio2.disconnect()

    @pytest.mark.asyncio
    async def test_webrtc_ice_candidate_forwarding(self):
        """Test that ICE candidates are forwarded between players"""
        sio1 = socketio.AsyncClient()
        sio2 = socketio.AsyncClient()
        
        results = {
            'room_id': None,
            'ice_received': False,
            'ice_data': None
        }
        
        def handle_match_found(data):
            results['room_id'] = data.get('roomId')
        sio1.on('match-found', handle_match_found)
        sio2.on('match-found', handle_match_found)
        
        def handle_ice_candidate(data):
            results['ice_received'] = True
            results['ice_data'] = data
            print(f"[Player2] 🧊 Received ICE candidate from {data.get('from')}")
        sio2.on('webrtc-ice-candidate', handle_ice_candidate)
        
        try:
            await sio1.connect(BASE_URL, socketio_path='/api/battlews/socket.io', transports=['websocket', 'polling'])
            await sio2.connect(BASE_URL, socketio_path='/api/battlews/socket.io', transports=['websocket', 'polling'])
            
            await sio1.emit('find-match', {'playerName': 'demo1', 'exam': 'NDA', 'subject': 'Mathematics (300 Marks)', 'topic': 'Trigonometry'})
            await asyncio.sleep(0.5)
            await sio2.emit('find-match', {'playerName': 'demo2', 'exam': 'NDA', 'subject': 'Mathematics (300 Marks)', 'topic': 'Trigonometry'})
            await asyncio.sleep(2)
            
            assert results['room_id'], "Should get a room ID"
            
            # Join video rooms
            await sio1.emit('join-video-room', {'roomId': results['room_id']})
            await sio2.emit('join-video-room', {'roomId': results['room_id']})
            await asyncio.sleep(0.5)
            
            # Send ICE candidate from Player 1
            mock_ice = {
                'candidate': 'candidate:1 1 UDP 2130706431 192.168.1.1 54321 typ host',
                'sdpMLineIndex': 0,
                'sdpMid': '0'
            }
            
            await sio1.emit('webrtc_ice_candidate', {
                'roomId': results['room_id'],
                'candidate': mock_ice
            })
            print(f"[Player1] 🧊 Sent ICE candidate")
            
            await asyncio.sleep(2)
            
            assert results['ice_received'], "Player 2 should receive ICE candidate"
            print("✅ ICE candidate successfully forwarded")
            
        finally:
            await sio1.emit('cancel-match')
            await sio2.emit('cancel-match')
            await sio1.disconnect()
            await sio2.disconnect()


class TestBattleChat:
    """Test battle chat functionality"""

    @pytest.mark.asyncio
    async def test_battle_chat_message(self):
        """Test chat messages are delivered between matched players"""
        sio1 = socketio.AsyncClient()
        sio2 = socketio.AsyncClient()
        
        results = {
            'room_id': None,
            'chat_received': False,
            'chat_message': None
        }
        
        def handle_match_found(data):
            results['room_id'] = data.get('roomId')
        sio1.on('match-found', handle_match_found)
        sio2.on('match-found', handle_match_found)
        
        def handle_chat_message(data):
            results['chat_received'] = True
            results['chat_message'] = data
            print(f"[Player2] 💬 Received chat: {data}")
        sio2.on('chat-message', handle_chat_message)
        
        try:
            await sio1.connect(BASE_URL, socketio_path='/api/battlews/socket.io', transports=['websocket', 'polling'])
            await sio2.connect(BASE_URL, socketio_path='/api/battlews/socket.io', transports=['websocket', 'polling'])
            
            await sio1.emit('find-match', {'playerName': 'demo1', 'exam': 'NDA', 'subject': 'Mathematics (300 Marks)', 'topic': 'Trigonometry'})
            await asyncio.sleep(0.5)
            await sio2.emit('find-match', {'playerName': 'demo2', 'exam': 'NDA', 'subject': 'Mathematics (300 Marks)', 'topic': 'Trigonometry'})
            await asyncio.sleep(2)
            
            assert results['room_id'], "Should get a room ID"
            
            # Send chat message from Player 1
            await sio1.emit('battle-chat', {
                'roomId': results['room_id'],
                'playerName': 'demo1',
                'message': 'Hello opponent! Ready to battle?'
            })
            print("[Player1] 💬 Sent chat message")
            
            await asyncio.sleep(2)
            
            assert results['chat_received'], "Player 2 should receive chat message"
            assert results['chat_message'].get('message') == 'Hello opponent! Ready to battle?'
            print("✅ Battle chat working correctly")
            
        finally:
            await sio1.emit('cancel-match')
            await sio2.emit('cancel-match')
            await sio1.disconnect()
            await sio2.disconnect()


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
