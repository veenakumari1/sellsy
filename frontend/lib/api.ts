const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export class ApiClient {
  private static getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("sellsy_token");
  }

  public static setToken(token: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("sellsy_token", token);
    }
  }

  public static clearToken() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("sellsy_token");
      localStorage.removeItem("sellsy_user");
    }
  }

  public static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMsg = typeof errorData.detail === "string" ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } catch {
        // use default error message
      }
      throw new Error(errorMsg);
    }

    return response.json();
  }

  // --- Auth ---
  static async login(email: string, password: string) {
    const data = await this.request<{ access_token: string; user: any }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    if (typeof window !== "undefined") {
      localStorage.setItem("sellsy_user", JSON.stringify(data.user));
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
      localStorage.setItem("sellsy_user", JSON.stringify(data.user));
    }
    return data;
  }

  static async demoLogin() {
    const data = await this.request<{ access_token: string; user: any }>("/api/v1/auth/demo-login", {
      method: "POST",
    });
    this.setToken(data.access_token);
    if (typeof window !== "undefined") {
      localStorage.setItem("sellsy_user", JSON.stringify(data.user));
    }
    return data;
  }

  static async getMe() {
    return this.request<any>("/api/v1/auth/me");
  }

  // --- Store ---
  static async getActiveStore() {
    return this.request<any>("/api/v1/stores/active");
  }

  static async listStores() {
    return this.request<any[]>("/api/v1/stores");
  }

  // --- Analytics ---
  static async getOverview() {
    return this.request<any>("/api/v1/analytics/overview");
  }

  static async getKpis(days: number = 30) {
    return this.request<any>(`/api/v1/analytics/kpis?days=${days}`);
  }

  static async getTrends(days: number = 30) {
    return this.request<any>(`/api/v1/analytics/trends?days=${days}`);
  }

  static async getCategories() {
    return this.request<any[]>("/api/v1/analytics/categories");
  }

  // --- Products ---
  static async getProducts(params?: { category_id?: string; search?: string; sort_by?: string }) {
    const query = new URLSearchParams();
    if (params?.category_id) query.append("category_id", params.category_id);
    if (params?.search) query.append("search", params.search);
    if (params?.sort_by) query.append("sort_by", params.sort_by);
    return this.request<any[]>(`/api/v1/products?${query.toString()}`);
  }

  static async getTopProducts(limit: number = 5) {
    return this.request<any[]>(`/api/v1/products/top?limit=${limit}`);
  }

  static async getDecliningProducts() {
    return this.request<any[]>("/api/v1/products/declining");
  }

  static async getProductDetail(productId: string) {
    return this.request<any>(`/api/v1/products/${productId}`);
  }

  // --- Customers ---
  static async getCustomerInsights() {
    return this.request<any>("/api/v1/customers/insights");
  }

  static async getCustomers(params?: { segment?: string; search?: string; sort_by?: string }) {
    const query = new URLSearchParams();
    if (params?.segment) query.append("segment", params.segment);
    if (params?.search) query.append("search", params.search);
    if (params?.sort_by) query.append("sort_by", params.sort_by);
    return this.request<any[]>(`/api/v1/customers?${query.toString()}`);
  }

  // --- Forecasting ---
  static async getForecast(daysAhead: number = 30) {
    return this.request<any>(`/api/v1/forecasts?days_ahead=${daysAhead}`);
  }

  // --- Marketing Advisor ---
  static async getMarketingStrategy() {
    return this.request<any>("/api/v1/marketing/strategy");
  }

  // --- AI Assistant ---
  static async sendChatMessage(message: string, conversationId?: string) {
    return this.request<any>("/api/v1/assistant/chat", {
      method: "POST",
      body: JSON.stringify({ message, conversation_id: conversationId }),
    });
  }

  static async getConversations() {
    return this.request<any[]>("/api/v1/assistant/conversations");
  }

  static async getConversation(conversationId: string) {
    return this.request<any>(`/api/v1/assistant/conversations/${conversationId}`);
  }

  // --- Reports ---
  static async listReports() {
    return this.request<any[]>("/api/v1/reports");
  }

  static async generateReport(reportType: string, fileFormat: string) {
    return this.request<any>("/api/v1/reports/generate", {
      method: "POST",
      body: JSON.stringify({ report_type: reportType, file_format: fileFormat }),
    });
  }

  static getReportDownloadUrl(reportId: string): string {
    return `${API_BASE_URL}/api/v1/reports/${reportId}/download`;
  }

  // --- Integrations ---
  static async getIntegrationStatus() {
    return this.request<any>("/api/v1/integrations/status");
  }

  static async connectShopify(shopDomain: string, apiKey?: string, accessToken?: string) {
    return this.request<any>("/api/v1/integrations/shopify/connect", {
      method: "POST",
      body: JSON.stringify({ shop_domain: shopDomain, api_key: apiKey, access_token: accessToken }),
    });
  }

  static async previewCsv(file: File, importType: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("import_type", importType);

    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/api/v1/integrations/csv/preview`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to parse CSV preview");
    return res.json();
  }

  static async confirmCsvImport(importType: string, columnMapping: Record<string, string>, rows: any[]) {
    return this.request<any>("/api/v1/integrations/csv/confirm", {
      method: "POST",
      body: JSON.stringify({ import_type: importType, column_mapping: columnMapping, rows }),
    });
  }
}
