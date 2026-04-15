import { httpClient } from './httpClient';

const SCRAPER_BASE = 'scraper-service/api/v1';

export interface ScrapeRequest {
  user_id: string;
  url: string;
  vault_id?: string;
  periodic?: boolean;
  interval_hours?: number;
  create_document?: boolean;
  generate_ai_notes?: boolean;
}

export interface ScrapeResponse {
  content_id: string;
  document_id?: string;
  title?: string;
  content_preview: string;
  ai_summary?: string;
  status: string;
}

export interface ScrapedContent {
  id: string;
  url: string;
  title?: string;
  domain: string;
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  id: string;
  title?: string;
  url: string;
  ai_summary?: string;
  similarity: number;
  matched_text: string;
}

class ScraperApiService {
  async scrapeUrl(request: ScrapeRequest): Promise<ScrapeResponse> {
    return httpClient.post<ScrapeResponse>(`${SCRAPER_BASE}/scrape`, request);
  }

  async getUserContent(userId: string): Promise<ScrapedContent[]> {
    return httpClient.get<ScrapedContent[]>(`${SCRAPER_BASE}/content/user/${userId}`);
  }

  async getContent(contentId: string): Promise<any> {
    return httpClient.get<any>(`${SCRAPER_BASE}/content/${contentId}`);
  }

  async searchContent(query: string, userId: string, limit: number = 10): Promise<SearchResult[]> {
    return httpClient.post<SearchResult[]>(`${SCRAPER_BASE}/search`, {
      query,
      user_id: userId,
      limit,
    });
  }

  async captureSession(domain: string): Promise<void> {
    return httpClient.post<void>(`${SCRAPER_BASE}/sessions/capture`, { domain });
  }
}

export const scraperApi = new ScraperApiService();
