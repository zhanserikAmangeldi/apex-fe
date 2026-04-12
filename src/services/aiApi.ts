import { httpClient } from './httpClient';

const AI_BASE = 'ai-service/api/v1';

export interface SearchResult {
    document_id: string;
    title: string;
    score: number;
}

export interface SemanticSearchResponse {
    query: string;
    results: SearchResult[];
    count: number;
}

export interface EmbeddingResponse {
    document_id: string;
    created: boolean;
    content_hash: string;
}

export interface TopicCluster {
    cluster_id: number;
    color: string;
    documents: { document_id: string; title: string }[];
}

export interface TopicClustersResponse {
    clusters: TopicCluster[];
    count: number;
}

class AiApiService {
    async semanticSearch(
        query: string,
        vaultId: string,
        limit: number = 10,
        minScore: number = 0.35
    ): Promise<SemanticSearchResponse> {
        return httpClient.post<SemanticSearchResponse>(`${AI_BASE}/search/semantic`, {
            query,
            vault_id: vaultId,
            limit,
            min_score: minScore,
        });
    }

    async getRelatedNotes(documentId: string, limit: number = 5): Promise<SearchResult[]> {
        return httpClient.get<SearchResult[]>(
            `${AI_BASE}/embeddings/${documentId}/related?limit=${limit}`
        );
    }

    async indexDocument(documentId: string, vaultId: string, title: string, content: string): Promise<EmbeddingResponse> {
        return httpClient.post<EmbeddingResponse>(`${AI_BASE}/embeddings`, {
            document_id: documentId,
            vault_id: vaultId,
            title,
            content,
        });
    }

    async deleteEmbedding(documentId: string): Promise<void> {
        await httpClient.delete(`${AI_BASE}/embeddings/${documentId}`);
    }

    async getTopicClusters(vaultId: string, k: number = 0): Promise<TopicClustersResponse> {
        return httpClient.get<TopicClustersResponse>(`${AI_BASE}/topics/clusters?vault_id=${vaultId}&k=${k}`);
    }

    // Chat endpoints
    async chatWithDocument(
        documentId: string,
        message: string,
        sessionId?: string,
        includeVideos: boolean = true
    ): Promise<ChatResponse> {
        return httpClient.post<ChatResponse>(`${AI_BASE}/chat`, {
            document_id: documentId,
            message,
            session_id: sessionId,
            include_videos: includeVideos,
        });
    }

    async getChatSessions(documentId: string): Promise<ChatSession[]> {
        return httpClient.get<ChatSession[]>(`${AI_BASE}/chat/sessions/${documentId}`);
    }

    async searchVideos(query: string, maxResults: number = 5): Promise<VideoSearchResponse> {
        return httpClient.post<VideoSearchResponse>(`${AI_BASE}/videos/search`, {
            query,
            max_results: maxResults,
        });
    }
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: Record<string, any>;
}

export interface ChatResponse {
    session_id: string;
    message: ChatMessage;
    videos: VideoResult[];
}

export interface ChatSession {
    id: string;
    document_id: string;
    title: string;
    created_at: string;
    updated_at: string;
    messages: ChatMessage[];
}

export interface VideoResult {
    video_id: string;
    title: string;
    description: string;
    thumbnail_url: string;
    channel_title: string;
    published_at: string;
    duration?: string;
    view_count?: number;
}

export interface VideoSearchResponse {
    query: string;
    videos: VideoResult[];
    count: number;
}

export const aiApi = new AiApiService();
