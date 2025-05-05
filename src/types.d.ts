/**
 * Type definitions for Cloudflare AutoRAG
 */

interface AutoRAGSearchOptions {
  query: string;
  model?: string;
  rewrite_query?: boolean;
  max_num_results?: number;
  ranking_options?: {
    score_threshold?: number;
  };
  stream?: boolean;
  filters?: Record<string, any>;
}

interface AutoRAGContentItem {
  id: string;
  type: string;
  text: string;
}

interface AutoRAGResultItem {
  file_id: string;
  filename: string;
  score: number;
  attributes: {
    modified_date?: number;
    folder?: string;
    [key: string]: any;
  };
  content: AutoRAGContentItem[];
}

interface AutoRAGResponse {
  object: string;
  search_query: string;
  response: string;
  data: AutoRAGResultItem[];
  has_more: boolean;
  next_page: string | null;
}

interface StreamingResponse {
  body: ReadableStream;
}

interface AutoRAGInstance {
  aiSearch(options: AutoRAGSearchOptions & { stream: true }): Promise<StreamingResponse>;
  aiSearch(options: AutoRAGSearchOptions & { stream?: false }): Promise<AutoRAGResponse>;
  aiSearch(options: AutoRAGSearchOptions): Promise<AutoRAGResponse | StreamingResponse>;
  search(options: Omit<AutoRAGSearchOptions, 'model' | 'stream'>): Promise<Omit<AutoRAGResponse, 'response'>>;
}

declare global {
  interface Env {
    AI: {
      autorag(name: string): AutoRAGInstance;
    };
  }
}

export {};