import json
import logging
from typing import Dict, List, Any
from fastapi import WebSocket

logger = logging.getLogger("sellsy.websocket")

class ConnectionManager:
    def __init__(self):
        # Map store_id to list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, store_id: str):
        await websocket.accept()
        if store_id not in self.active_connections:
            self.active_connections[store_id] = []
        self.active_connections[store_id].append(websocket)
        logger.info(f"WebSocket client connected for store {store_id}. Total active: {len(self.active_connections[store_id])}")

    def disconnect(self, websocket: WebSocket, store_id: str):
        if store_id in self.active_connections:
            if websocket in self.active_connections[store_id]:
                self.active_connections[store_id].remove(websocket)
            if not self.active_connections[store_id]:
                del self.active_connections[store_id]
        logger.info(f"WebSocket client disconnected for store {store_id}")

    async def broadcast_to_store(self, store_id: str, message: Dict[str, Any]):
        if store_id not in self.active_connections:
            return

        payload = json.dumps(message)
        dead_sockets = []
        for ws in self.active_connections[store_id]:
            try:
                await ws.send_text(payload)
            except Exception as e:
                logger.warning(f"Failed to send to client in store {store_id}: {e}")
                dead_sockets.append(ws)

        for dead in dead_sockets:
            self.disconnect(dead, store_id)

    async def broadcast_all(self, message: Dict[str, Any]):
        payload = json.dumps(message)
        for store_id, sockets in list(self.active_connections.items()):
            dead_sockets = []
            for ws in sockets:
                try:
                    await ws.send_text(payload)
                except Exception:
                    dead_sockets.append(ws)
            for dead in dead_sockets:
                self.disconnect(dead, store_id)

ws_manager = ConnectionManager()

