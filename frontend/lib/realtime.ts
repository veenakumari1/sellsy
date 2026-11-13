import { ApiClient } from "./api";

export type RealtimeEvent =
  | { type: "NOTIFICATION"; data: any }
  | { type: "METRIC_UPDATE"; data: any }
  | { type: "POINTS_EARNED"; data: any }
  | { type: "ACHIEVEMENT_UNLOCKED"; data: any }
  | { type: "PONG" };

type Listener = (event: RealtimeEvent) => void;

class RealtimeClient {
  private ws: WebSocket | null = null;
  private listeners: Set<Listener> = new Set();
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private isConnected = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.connect();
    }
  }

  public connect() {
    if (typeof window === "undefined") return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const baseUrl = ApiClient.getBaseUrl();
      const wsProto = baseUrl.startsWith("https") ? "wss" : "ws";
      const cleanHost = baseUrl.replace(/^https?:\/\//, "");
      const url = `${wsProto}://${cleanHost}/api/v1/realtime/ws`;

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          // If metric update, clear overview analytics cache automatically
          if (parsed.type === "METRIC_UPDATE") {
            ApiClient.clearCache("/api/v1/analytics");
          } else if (parsed.type === "NOTIFICATION") {
            ApiClient.clearCache("/api/v1/notifications");
          } else if (parsed.type === "POINTS_EARNED" || parsed.type === "ACHIEVEMENT_UNLOCKED") {
            ApiClient.clearCache("/api/v1/gamification");
          }
          this.notifyListeners(parsed);
        } catch {
          // ignore non-json messages
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.stopHeartbeat();
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        if (this.ws) {
          this.ws.close();
        }
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send("ping");
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }

  public subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(event: RealtimeEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (e) {
        console.error("Error in realtime listener", e);
      }
    });
  }

  public getIsConnected() {
    return this.isConnected;
  }
}

export const realtimeClient = typeof window !== "undefined" ? new RealtimeClient() : (null as any);

