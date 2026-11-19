const DEFAULT_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

interface RequestOptions extends RequestInit {
  forceRefresh?: boolean;
  cacheTtlMs?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class ApiClient {
  private static cache = new Map<string, CacheEntry<any>>();
  private static inFlight = new Map<string, Promise<any>>();
  private static resolvedBaseUrl: string | null = null;

  public static getBaseUrl(): string {
    if (this.resolvedBaseUrl) return this.resolvedBaseUrl;
    return DEFAULT_BASE_URL;
  }

  public static getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("storsy_token") || localStorage.getItem("sellsy_token");
  }

  public static isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem("storsy_token") || localStorage.getItem("sellsy_token"));
  }

  public static setToken(token: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("storsy_token", token);
    }
  }

  public static clearToken() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("storsy_token");
      localStorage.removeItem("storsy_user");
      localStorage.removeItem("sellsy_token");
      localStorage.removeItem("sellsy_user");
    }
    this.clearCache();
  }

  public static getUser(): any {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("storsy_user") || localStorage.getItem("sellsy_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public static clearCache(endpointPrefix?: string) {
    if (!endpointPrefix) {
      this.cache.clear();
      return;
    }
    this.cache.forEach((_, key) => {
      if (key.startsWith(endpointPrefix)) {
        this.cache.delete(key);
      }
    });
  }

  public static getCached<T>(endpoint: string, maxAgeMs = 120_000): T | null {
    const entry = this.cache.get(endpoint);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > maxAgeMs) {
      return null;
    }
    return entry.data as T;
  }

  public static setCache<T>(endpoint: string, data: T) {
    this.cache.set(endpoint, { data, timestamp: Date.now() });
  }

  public static async prefetch(endpoint: string): Promise<void> {
    try {
      await this.request(endpoint);
    } catch {
      // Ignore background prefetch errors
    }
  }

  public static async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const isGet = !options.method || options.method.toUpperCase() === "GET";
    const cacheKey = endpoint;
    const ttl = options.cacheTtlMs ?? 60_000;

    // Check cache for GET requests unless forceRefresh is true
    if (isGet && !options.forceRefresh) {
      const cached = this.getCached<T>(cacheKey, ttl);
      if (cached !== null) {
        return cached;
      }

      // Check if an identical request is already in-flight
      const inFlightPromise = this.inFlight.get(cacheKey);
      if (inFlightPromise) {
        return inFlightPromise as Promise<T>;
      }
    }

    const fetchPromise = (async () => {
      const token = this.getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const primaryBase = this.getBaseUrl();
      const primaryUrl = `${primaryBase}${endpoint}`;

      // Build fallback URL candidate if local (e.g. 127.0.0.1 <-> localhost)
      let fallbackUrl: string | null = null;
      if (primaryBase.includes("127.0.0.1")) {
        fallbackUrl = `${primaryBase.replace("127.0.0.1", "localhost")}${endpoint}`;
      } else if (primaryBase.includes("localhost")) {
        fallbackUrl = `${primaryBase.replace("localhost", "127.0.0.1")}${endpoint}`;
      }

      const timeoutMs = 20000;
      const fetchWithTimeout = async (url: string) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
          return await fetch(url, {
            ...options,
            headers,
            signal: options.signal || controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }
      };

      let response: Response;
      try {
        response = await fetchWithTimeout(primaryUrl);
      } catch (err: any) {
        console.error(`[API] Connection failed at ${primaryUrl}:`, err);
        // If network failed and we have a local fallback candidate, try fallback
        if (fallbackUrl) {
          try {
            response = await fetchWithTimeout(fallbackUrl);
            this.resolvedBaseUrl = fallbackUrl.replace(endpoint, "");
          } catch (fallbackErr: any) {
            console.error(`[API] Fallback connection failed at ${fallbackUrl}:`, fallbackErr);
            throw new Error(`Unable to connect to the backend server at ${primaryUrl}. Please verify the backend is running.`);
          }
        } else {
          throw new Error(`Unable to connect to the backend server at ${primaryUrl}. Please verify the backend is running.`);
        }
      }

      if (!response.ok) {
        let serverDetail = "";
        try {
          const errorData = await response.json();
          console.error(`[API Error ${response.status}] ${response.url}`, errorData);
          if (typeof errorData?.detail === "string") {
            serverDetail = errorData.detail;
          } else if (Array.isArray(errorData?.detail)) {
            serverDetail = errorData.detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ");
          } else if (errorData?.message) {
            serverDetail = errorData.message;
          }
        } catch {
          console.error(`[API Error ${response.status}] ${response.url}: ${response.statusText}`);
        }
        const message = serverDetail 
          ? `[${response.status}] ${serverDetail}` 
          : `Request failed with status ${response.status} (${response.statusText || response.url})`;
        throw new Error(message);
      }

      const data = await response.json();

      // Cache successful GET requests
      if (isGet) {
        this.setCache(cacheKey, data);
      } else {
        // Clear related caches on mutations
        if (endpoint.includes("/seed") || endpoint.includes("/csv") || endpoint.includes("/reports") || endpoint.includes("/sample-data")) {
          this.clearCache();
        }
      }

      return data as T;
    })();

    if (isGet && !options.forceRefresh) {
      this.inFlight.set(cacheKey, fetchPromise);
      fetchPromise.finally(() => {
        this.inFlight.delete(cacheKey);
      });
    }

    return fetchPromise;
  }

  // --- Auth ---
  static async login(email: string, password: string) {
    const data = await this.request<{ access_token: string; user: any }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    if (typeof window !== "undefined") {
      localStorage.setItem("storsy_user", JSON.stringify(data.user));
    }
    return data;
  }

  static async register(email: string, password: string, fullName: string) {
    const data = await this.request<{ access_token: string; user: any }>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    this.setToken(data.access_token);
    if (typeof window !== "undefined") {
      localStorage.setItem("storsy_user", JSON.stringify(data.user));
    }
    return data;
  }

  static async getMe(forceRefresh = false) {
    return this.request<any>("/api/v1/auth/me", { forceRefresh });
  }

  // --- Store ---
  static async getActiveStore(forceRefresh = false) {
    return this.request<any>("/api/v1/stores/active", { forceRefresh });
  }

  static async listStores(forceRefresh = false) {
    return this.request<any[]>("/api/v1/stores", { forceRefresh });
  }

  static async loadSampleData() {
    const res = await this.request<{
      success: boolean;
      status: string;
      message: string;
      categories: number;
      products: number;
      customers: number;
      orders: number;
      notifications?: number;
    }>("/api/v1/stores/active/sample-data", {
      method: "POST",
    });
    this.clearCache();
    return res;
  }

  // --- Analytics ---
  static async getOverview(forceRefresh = false) {
    return this.request<any>("/api/v1/analytics/overview", { forceRefresh });
  }

  static async getKpis(days: number = 30, forceRefresh = false) {
    return this.request<any>(`/api/v1/analytics/kpis?days=${days}`, { forceRefresh });
  }

  static async getTrends(days: number = 30, forceRefresh = false) {
    return this.request<any>(`/api/v1/analytics/trends?days=${days}`, { forceRefresh });
  }

  static async getCategories(forceRefresh = false) {
    return this.request<any[]>("/api/v1/analytics/categories", { forceRefresh });
  }

  // --- Products ---
  static async getProducts(params?: { category_id?: string; search?: string; sort_by?: string }, forceRefresh = false) {
    const query = new URLSearchParams();
    if (params?.category_id) query.append("category_id", params.category_id);
    if (params?.search) query.append("search", params.search);
    if (params?.sort_by) query.append("sort_by", params.sort_by);
    const qs = query.toString();
    const endpoint = `/api/v1/products${qs ? `?${qs}` : ""}`;
    return this.request<any[]>(endpoint, { forceRefresh });
  }

  static async getTopProducts(limit: number = 5, forceRefresh = false) {
    return this.request<any[]>(`/api/v1/products/top?limit=${limit}`, { forceRefresh });
  }

  static async getDecliningProducts(forceRefresh = false) {
    return this.request<any[]>("/api/v1/products/declining", { forceRefresh });
  }

  static async getProductDetail(productId: string, forceRefresh = false) {
    return this.request<any>(`/api/v1/products/${productId}`, { forceRefresh });
  }

  // --- Customers ---
  static async getCustomerInsights(forceRefresh = false) {
    return this.request<any>("/api/v1/customers/insights", { forceRefresh });
  }

  static async getCustomers(params?: { segment?: string; search?: string; sort_by?: string }, forceRefresh = false) {
    const query = new URLSearchParams();
    if (params?.segment) query.append("segment", params.segment);
    if (params?.search) query.append("search", params.search);
    if (params?.sort_by) query.append("sort_by", params.sort_by);
    const qs = query.toString();
    const endpoint = `/api/v1/customers${qs ? `?${qs}` : ""}`;
    return this.request<any[]>(endpoint, { forceRefresh });
  }

  // --- Forecasting ---
  static async getForecast(daysAhead: number = 30, forceRefresh = false) {
    return this.request<any>(`/api/v1/forecasts?days_ahead=${daysAhead}`, { forceRefresh });
  }

  // --- Marketing Advisor ---
  static async getMarketingStrategy(forceRefresh = false) {
    return this.request<any>("/api/v1/marketing/strategy", { forceRefresh });
  }

  // --- AI Assistant ---
  static async sendChatMessage(message: string, conversationId?: string) {
    const result = await this.request<any>("/api/v1/assistant/chat", {
      method: "POST",
      body: JSON.stringify({ message, conversation_id: conversationId }),
    });
    this.clearCache("/api/v1/assistant/conversations");
    return result;
  }

  static async getConversations(forceRefresh = false) {
    return this.request<any[]>("/api/v1/assistant/conversations", { forceRefresh });
  }

  static async getConversation(conversationId: string, forceRefresh = false) {
    return this.request<any>(`/api/v1/assistant/conversations/${conversationId}`, { forceRefresh });
  }

  // --- Reports ---
  static async listReports(forceRefresh = false) {
    return this.request<any[]>("/api/v1/reports", { forceRefresh });
  }

  static async generateReport(reportType: string, fileFormat: string) {
    const res = await this.request<any>("/api/v1/reports/generate", {
      method: "POST",
      body: JSON.stringify({ report_type: reportType, file_format: fileFormat }),
    });
    this.clearCache("/api/v1/reports");
    return res;
  }

  static getReportDownloadUrl(reportId: string): string {
    return `${this.getBaseUrl()}/api/v1/reports/${reportId}/download`;
  }

  // --- Integrations ---
  static async getIntegrationStatus(forceRefresh = false) {
    return this.request<any>("/api/v1/integrations/status", { forceRefresh });
  }

  static async connectShopify(shopDomain: string, apiKey?: string, accessToken?: string) {
    const res = await this.request<any>("/api/v1/integrations/shopify/connect", {
      method: "POST",
      body: JSON.stringify({ shop_domain: shopDomain, api_key: apiKey, access_token: accessToken }),
    });
    this.clearCache("/api/v1/integrations/status");
    return res;
  }

  static async previewCsv(file: File, importType: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("import_type", importType);

    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const primaryBase = this.getBaseUrl();
    const res = await fetch(`${primaryBase}/api/v1/integrations/csv/preview`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to parse CSV preview");
    return res.json();
  }

  static async confirmCsvImport(importType: string, columnMapping: Record<string, string>, rows: any[]) {
    const res = await this.request<any>("/api/v1/integrations/csv/confirm", {
      method: "POST",
      body: JSON.stringify({ import_type: importType, column_mapping: columnMapping, rows }),
    });
    this.clearCache();
    return res;
  }

  // --- Notifications ---
  static async listNotifications(limit = 30, forceRefresh = false) {
    return this.request<{ notifications: any[]; unread_count: number }>(`/api/v1/notifications?limit=${limit}`, { forceRefresh });
  }

  static async markNotificationRead(id: string) {
    const res = await this.request<any>(`/api/v1/notifications/${id}/read`, { method: "POST" });
    this.clearCache("/api/v1/notifications");
    return res;
  }

  static async markAllNotificationsRead() {
    const res = await this.request<any>("/api/v1/notifications/mark-all-read", { method: "POST" });
    this.clearCache("/api/v1/notifications");
    return res;
  }

  // --- Gamification ---
  static async getGamificationOverview(forceRefresh = false) {
    return this.request<any>("/api/v1/gamification/overview", { forceRefresh });
  }

  static async getLeaderboard(forceRefresh = false) {
    return this.request<any[]>("/api/v1/gamification/leaderboard", { forceRefresh });
  }

  static async claimGamificationTask(taskKey: string, taskTitle: string) {
    const res = await this.request<any>("/api/v1/gamification/claim-task", {
      method: "POST",
      body: JSON.stringify({ task_key: taskKey, task_title: taskTitle })
    });
    this.clearCache("/api/v1/gamification");
    return res;
  }

  static async trackInteraction(feature: string) {
    try {
      await this.request<any>(`/api/v1/gamification/track-interaction?feature=${feature}`, { method: "POST" });
    } catch {
      // Ignore background tracking error
    }
  }

  // --- Real-Time Engine & Live Simulator ---
  static async simulateLiveOrder() {
    const res = await this.request<any>("/api/v1/realtime/simulate-order", { method: "POST" });
    this.clearCache("/api/v1/analytics");
    this.clearCache("/api/v1/notifications");
    this.clearCache("/api/v1/gamification");
    return res;
  }

  // --- Multi-Agent AI Team ---
  static async runAiTeam() {
    const res = await this.request<any>("/api/v1/agents/run", { method: "POST" });
    this.clearCache("/api/v1/agents");
    return res;
  }

  static async getAiTeamHistory(limit = 20, forceRefresh = false) {
    return this.request<any[]>(`/api/v1/agents/history?limit=${limit}`, { forceRefresh });
  }

  // --- Customer Prediction & Win-Back ---
  static async getAtRiskCustomers(days = 30, forceRefresh = false) {
    return this.request<any>(`/api/v1/winback/at-risk?days=${days}`, { forceRefresh });
  }

  static async updateCustomerWhatsapp(customerId: string, whatsapp: string) {
    const res = await this.request<any>(`/api/v1/winback/customer/${customerId}/whatsapp`, {
      method: "PATCH",
      body: JSON.stringify({ whatsapp }),
    });
    this.clearCache("/api/v1/winback");
    return res;
  }

  static async generateWinbackMessage(customerId: string, discountCode = "WELCOMEBACK") {
    return this.request<any>("/api/v1/winback/message", {
      method: "POST",
      body: JSON.stringify({ customer_id: customerId, discount_code: discountCode }),
    });
  }

  // --- Inventory & Restock Alerts ---
  static async getInventoryAlerts(forceRefresh = false) {
    return this.request<any>("/api/v1/inventory/alerts", { forceRefresh });
  }

  static async updateProductReorderLevel(productId: string, reorderLevel: number) {
    const res = await this.request<any>(`/api/v1/inventory/products/${productId}/reorder-level`, {
      method: "PATCH",
      body: JSON.stringify({ reorder_level: reorderLevel }),
    });
    this.clearCache("/api/v1/inventory");
    return res;
  }

  static async checkInventoryAlerts() {
    return this.request<any>("/api/v1/inventory/check-alerts", { method: "POST" });
  }

  // --- AI Content Generator ---
  static async generateContent(productId: string, contentType: string, tone: string) {
    return this.request<any>("/api/v1/content/generate", {
      method: "POST",
      body: JSON.stringify({
        product_id: productId,
        content_type: contentType,
        tone: tone,
      }),
    });
  }
}
