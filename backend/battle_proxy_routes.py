from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
import httpx
import os

router = APIRouter()

BATTLE_SERVER_URL = "http://localhost:5001"

# Proxy HTTP requests to battle-server
@router.api_route("/battle/{path:path}", methods=["GET", "POST", "DELETE", "PUT"])
async def proxy_battle_http(path: str, request: Request):
    """Proxy HTTP requests to battle-server"""
    try:
        url = f"{BATTLE_SERVER_URL}/api/battle/{path}"
        
        # Get request body if present
        body = None
        if request.method in ["POST", "PUT"]:
            body = await request.body()
        
        # Forward request to battle-server
        async with httpx.AsyncClient() as client:
            response = await client.request(
                method=request.method,
                url=url,
                content=body,
                headers=dict(request.headers),
                timeout=30.0
            )
            
            return JSONResponse(
                content=response.json(),
                status_code=response.status_code
            )
    except Exception as e:
        return JSONResponse(
            content={"success": False, "error": str(e)},
            status_code=500
        )

# WebSocket proxy for Socket.io connections
@router.websocket("/battle/socket.io/")
async def proxy_battle_websocket(websocket: WebSocket):
    """Proxy WebSocket connections to battle-server"""
    await websocket.accept()
    
    try:
        # For now, just keep connection alive
        # Full Socket.io proxy would require more complex implementation
        while True:
            data = await websocket.receive_text()
            # Echo back for now
            await websocket.send_text(data)
    except WebSocketDisconnect:
        pass
