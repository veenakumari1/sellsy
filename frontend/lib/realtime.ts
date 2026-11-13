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
  private retryCount = 0;
  private shouldReconnect = true;

  constructor() {
    if (typeof window !== "undefined") {
      // Only connect if the user is currently authenticated
      if (ApiClient.isAuthenticated()) {
        this.connect();
      }
    }
  }

  public connect() {
    if (typeof window === "undefined") return;
    const token = ApiClient.getToken();
    if (!token) {
      // Do not attempt connection without valid auth token
      this.disconnect();
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.shouldReconnect = true;

    try {
      const baseUrl = ApiClient.getBaseUrl();
      const wsProto = baseUrl.startsWith("https") ? "wss" : "ws";
      const cleanHost = baseUrl.replace(/^https?:\/\//, "");
      const url = `${wsProto}://${cleanHost}/api/v1/realtime/ws?token=${encodeURIComponent(token)}`;

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.retryCount = 0;
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          // Auto invalidate cache upon live metric changes
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

      this.ws.onclose = (event) => {
        this.isConnected = false;
        this.stopHeartbeat();
        // If closed due to authentication failure (code 1008, 4401, 4403), stop reconnecting
        if (event.code === 1008 || event.code === 4401 || event.code === 4403) {
          console.warn("[Realtime] WebSocket closed due to auth constraint. Halting reconnect.");
          this.shouldReconnect = false;
          return;
        }
        if (this.shouldReconnect && ApiClient.isAuthenticated()) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        if (this.ws) {
          try {
            this.ws.close();
          } catch {}
        }
      };
    } catch {
      if (this.shouldReconnect && ApiClient.isAuthenticated()) {
        this.scheduleReconnect();
      }
    }
  }

  public disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.isConnected = false;
    this.retryCount = 0;
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
    if (this.reconnectTimer || !this.shouldReconnect) return;
    this.retryCount++;
    // Exponential backoff: 2s, 3s, 4.5s, 6.75s ... up to max 30s
    const delay = Math.min(30000, 2000 * Math.pow(1.5, Math.min(this.retryCount, 7)));
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (ApiClient.isAuthenticated()) {
        this.connect();
      }
    }, delay);
  }

  public subscribe(listener: Listener) {
    this.listeners.add(listener);
    if (!this.isConnected && ApiClient.isAuthenticated()) {
      this.connect();
    }
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
