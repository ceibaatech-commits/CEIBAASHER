"""
Socket.io Proxy for Battle Server
Forwards Socket.io requests from external domain to internal battle-server on port 5001
"""
from fastapi import APIRouter, Request, Response
from fastapi.responses import StreamingResponse
import httpx
import asyncio

router = APIRouter()

# Battle server internal URL
BATTLE_SERVER_URL = "http://localhost:5001"

@router.api_route("/battlews/{path:path}", methods=["GET", "POST", "OPTIONS"])
async def socket_proxy(path: str, request: Request):
    """
    Proxy all Socket.io requests to the battle server
    This allows external browser connections to reach the internal battle-server
    Mounted at /api/battlews to avoid Kubernetes ingress conflicts
    """
    # Build the target URL - forward to battle server's /socket.io path
    target_url = f"{BATTLE_SERVER_URL}/socket.io/{path}"
    
    # Get query parameters
    query_params = str(request.url.query)
    if query_params:
        target_url += f"?{query_params}"
    
    # Prepare headers (remove host header to avoid conflicts)
    headers = dict(request.headers)
    headers.pop('host', None)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            if request.method == "GET":
                # For polling requests
                response = await client.get(
                    target_url,
                    headers=headers
                )
                
                return Response(
                    content=response.content,
                    status_code=response.status_code,
                    headers=dict(response.headers),
                    media_type=response.headers.get('content-type')
                )
            
            elif request.method == "POST":
                # For sending data
                body = await request.body()
                response = await client.post(
                    target_url,
                    headers=headers,
                    content=body
                )
                
                return Response(
                    content=response.content,
                    status_code=response.status_code,
                    headers=dict(response.headers),
                    media_type=response.headers.get('content-type')
                )
            
            elif request.method == "OPTIONS":
                # CORS preflight
                return Response(
                    status_code=200,
                    headers={
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                        "Access-Control-Allow-Headers": "*"
                    }
                )
    
    except Exception as e:
        print(f"Socket.io proxy error: {e}")
        return Response(
            content=f"Proxy error: {str(e)}",
            status_code=502
        )
