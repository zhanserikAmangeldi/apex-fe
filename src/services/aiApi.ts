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
        limit: number = 10,
        minScore: number = 0.15
    ): Promise<SemanticSearchResponse> {
        return httpClient.post<SemanticSearchResponse>(`${AI_BASE}/search/semantic`, {
            query,
            limit,
            min_score: minScore,
        });
    }

    async getRelatedNotes(documentId: string, limit: number = 5): Promise<SearchResult[]> {
        return httpClient.get<SearchResult[]>(
            `${AI_BASE}/embeddings/${documentId}/related?limit=${limit}`
        );
    }

    async indexDocument(documentId: string, title: string, content: string): Promise<EmbeddingResponse> {
        return httpClient.post<EmbeddingResponse>(`${AI_BASE}/embeddings`, {
            document_id: documentId,
            title,
            content,
        });
    }

    async deleteEmbedding(documentId: string): Promise<void> {
        await httpClient.delete(`${AI_BASE}/embeddings/${documentId}`);
    }

    async getTopicClusters(k: number = 0): Promise<TopicClustersResponse> {
        return httpClient.get<TopicClustersResponse>(`${AI_BASE}/topics/clusters?k=${k}`);
    }
}

export const aiApi = new AiApiService();
