"""battle_webrtc_handlers.py — WebRTC signaling, VC events, admin monitor.
"""
from battle_shared import sio, db, user_activity
from datetime import datetime, timezone
import asyncio

@sio.event
async def join_video_room(sid, data):
    """Explicitly join a video room for WebRTC signaling"""
    try:
        room_id = data.get('roomId')
        if room_id:
            await sio.enter_room(sid, room_id)
            print(f"[WEBRTC] 🚪 {sid} joined video room: {room_id}")
            
            # Get list of participants in the room
            rooms = sio.rooms(sid)
            print(f"[WEBRTC] 📋 {sid} is now in rooms: {rooms}")
    except Exception as e:
        print(f"[ERROR] join_video_room: {str(e)}")


# ==================== VIDEO CALL REQUEST EVENTS ====================

@sio.event
async def vc_request(sid, data):
    """Player requests a video call with opponent"""
    room_id = data.get('roomId')
    player_name = data.get('playerName', 'Player')
    print(f"[VC] Video call requested by {player_name} ({sid}) in room {room_id}")
    await sio.emit('vc_request', {'playerName': player_name, 'from': sid}, room=room_id, skip_sid=sid)

@sio.event
async def vc_accepted(sid, data):
    """Opponent accepted the video call"""
    room_id = data.get('roomId')
    player_name = data.get('playerName', 'Player')
    print(f"[VC] Video call accepted by {player_name} ({sid}) in room {room_id}")
    await sio.emit('vc_accepted', {'playerName': player_name, 'from': sid}, room=room_id, skip_sid=sid)

@sio.event
async def vc_declined(sid, data):
    """Opponent declined the video call"""
    room_id = data.get('roomId')
    player_name = data.get('playerName', 'Player')
    print(f"[VC] Video call declined by {player_name} ({sid}) in room {room_id}")
    await sio.emit('vc_declined', {'playerName': player_name, 'from': sid}, room=room_id, skip_sid=sid)

@sio.event
async def vc_ended(sid, data):
    """Video call ended"""
    room_id = data.get('roomId')
    player_name = data.get('playerName', 'Player')
    print(f"[VC] Video call ended by {player_name} ({sid}) in room {room_id}")
    await sio.emit('vc_ended', {'playerName': player_name, 'from': sid}, room=room_id, skip_sid=sid)



@sio.event
async def webrtc_offer(sid, data):
    """WebRTC offer signaling"""
    try:
        room_id = data.get('roomId')
        offer = data.get('offer')
        
        print(f"[WEBRTC] 📹 Offer received from {sid} for room {room_id}")
        
        # Check which rooms this sender is in
        sender_rooms = sio.rooms(sid)
        print(f"[WEBRTC] 📋 Sender {sid} is in rooms: {sender_rooms}")
        
        # Check if room_id is in sender's rooms
        if room_id not in sender_rooms:
            print(f"[WEBRTC] ⚠️ Warning: Sender not in room {room_id}, joining now...")
            await sio.enter_room(sid, room_id)

        # Forward to other users in room
        await sio.emit('webrtc-offer', {
            'offer': offer,
            'from': sid
        }, room=room_id, skip_sid=sid)
        
        print(f"[WEBRTC] ✅ Offer forwarded to room {room_id}")

    except Exception as e:
        print(f"[ERROR] webrtc_offer: {str(e)}")
        import traceback
        traceback.print_exc()


@sio.event
async def webrtc_answer(sid, data):
    """WebRTC answer signaling"""
    try:
        room_id = data.get('roomId')
        answer = data.get('answer')
        
        print(f"[WEBRTC] 📹 Answer received from {sid} for room {room_id}")
        
        # Check which rooms this sender is in
        sender_rooms = sio.rooms(sid)
        print(f"[WEBRTC] 📋 Sender {sid} is in rooms: {sender_rooms}")
        
        # Ensure sender is in room
        if room_id not in sender_rooms:
            print(f"[WEBRTC] ⚠️ Warning: Sender not in room {room_id}, joining now...")
            await sio.enter_room(sid, room_id)

        # Forward to other users in room
        await sio.emit('webrtc-answer', {
            'answer': answer,
            'from': sid
        }, room=room_id, skip_sid=sid)
        
        print(f"[WEBRTC] ✅ Answer forwarded to room {room_id}")

    except Exception as e:
        print(f"[ERROR] webrtc_answer: {str(e)}")
        import traceback
        traceback.print_exc()


@sio.event
async def webrtc_ice_candidate(sid, data):
    """WebRTC ICE candidate signaling"""
    try:
        room_id = data.get('roomId')
        candidate = data.get('candidate')
        
        print(f"[WEBRTC] 🧊 ICE candidate from {sid} for room {room_id}")

        # Forward to other users in room
        await sio.emit('webrtc-ice-candidate', {
            'candidate': candidate,
            'from': sid
        }, room=room_id, skip_sid=sid)

    except Exception as e:
        print(f"[ERROR] webrtc_ice_candidate: {str(e)}")


