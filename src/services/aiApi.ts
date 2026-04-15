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

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: Record<string, any>;
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

export interface VideoSearchResponse {
    query: string;
    videos: VideoResult[];
    count: number;
}

export interface StudyNotesRequest {
    content: string;
    title: string;
    vaultId: string;
}

export interface StudyNotesResponse {
    summary: string;
    key_points: string[];
    notes: string;
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
        try {
            return httpClient.get<SearchResult[]>(
                `${AI_BASE}/embeddings/${documentId}/related?limit=${limit}`
            );
        } catch (error: any) {
            // If document is not indexed yet (404), return empty array silently
            if (error.status === 404 || error.response?.status === 404) {
                return [];
            }
            throw error;
        }
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

    // --- Flashcards ---

    async generateFlashcards(
        documentId: string,
        vaultId: string,
        title: string,
        content: string
    ): Promise<FlashcardGenerateResponse> {
        return httpClient.post<FlashcardGenerateResponse>(`${AI_BASE}/flashcards/generate`, {
            document_id: documentId,
            vault_id: vaultId,
            title,
            content,
        });
    }

    async getFlashcards(vaultId: string, dueOnly: boolean = false): Promise<FlashcardListResponse> {
        const params = dueOnly ? '?due_only=true' : '';
        return httpClient.get<FlashcardListResponse>(`${AI_BASE}/flashcards/${vaultId}${params}`);
    }

    async reviewFlashcard(cardId: string, quality: number): Promise<FlashcardReviewResponse> {
        return httpClient.post<FlashcardReviewResponse>(`${AI_BASE}/flashcards/${cardId}/review`, {
            quality,
        });
    }

    async deleteFlashcard(cardId: string): Promise<void> {
        await httpClient.delete(`${AI_BASE}/flashcards/${cardId}`);
    }

    async generateFlashcardsForVault(vaultId: string): Promise<FlashcardVaultGenerateResponse> {
        return httpClient.post<FlashcardVaultGenerateResponse>(
            `${AI_BASE}/flashcards/generate/vault/${vaultId}`,
            {},
        );
    }

    // --- Quiz ---

    async generateQuiz(vaultId: string, numQuestions: number = 10): Promise<QuizGenerateResponse> {
        return httpClient.post<QuizGenerateResponse>(`${AI_BASE}/quiz/generate`, {
            vault_id: vaultId,
            num_questions: numQuestions,
        });
    }

    async submitQuiz(
        vaultId: string,
        answers: { document_id: string; question: string; correct: boolean }[]
    ): Promise<QuizSubmitResponse> {
        return httpClient.post<QuizSubmitResponse>(`${AI_BASE}/quiz/submit`, {
            vault_id: vaultId,
            answers,
        });
    }

    // --- Progress ---

    async getProgressDashboard(vaultId: string): Promise<ProgressDashboardResponse> {
        return httpClient.get<ProgressDashboardResponse>(`${AI_BASE}/progress/${vaultId}`);
    }

    // --- Streaks ---

    async getStreak(vaultId: string): Promise<StreakResponse> {
        return httpClient.get<StreakResponse>(`${AI_BASE}/streaks/${vaultId}`);
    }

    async getForecast(vaultId: string): Promise<ForecastResponse> {
        return httpClient.get<ForecastResponse>(`${AI_BASE}/forecast/${vaultId}`);
    }

    // --- Mixed Quiz ---

    async generateMixedQuiz(vaultId: string, numQuestions: number = 10): Promise<MixedQuizGenerateResponse> {
        return httpClient.post<MixedQuizGenerateResponse>(`${AI_BASE}/quiz/generate/mixed`, {
            vault_id: vaultId,
            num_questions: numQuestions,
        });
    }

    async submitMixedQuiz(
        vaultId: string,
        answers: { document_id: string; question: string; question_type: string; correct: boolean }[]
    ): Promise<QuizSubmitResponse> {
        return httpClient.post<QuizSubmitResponse>(`${AI_BASE}/quiz/submit/mixed`, {
            vault_id: vaultId,
            answers,
        });
    }

    // --- Spaced Reading ---

    async getReadingList(vaultId: string): Promise<ReadingListResponse> {
        return httpClient.get<ReadingListResponse>(`${AI_BASE}/reading/${vaultId}`);
    }

    async markAsRead(documentId: string): Promise<void> {
        await httpClient.post(`${AI_BASE}/reading/${documentId}/mark-read`, {});
    }

    async createStudyNotes(request: StudyNotesRequest): Promise<StudyNotesResponse> {
        console.log('createStudyNotes called with:', request);
        
        // Validate request
        if (!request.vaultId) {
            throw new Error('Vault ID is required');
        }
        if (!request.content) {
            throw new Error('Content is required');
        }
        
        const safeTitle = request.title || 'Untitled';
        
        // Create a temporary document to use with the chat endpoint
        const tempDoc: { id: string } = await httpClient.post('editor-service/api/v1/documents', {
            vaultId: request.vaultId,
            title: `[TEMP] ${safeTitle}`,
            content: request.content,
        });

        console.log('Temporary document created:', tempDoc);

        const prompt = `Analyze this content and create study notes.

Provide your response in this exact JSON format:
{
  "summary": "A 2-3 sentence summary",
  "key_points": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "notes": "Detailed study notes with important concepts"
}

Focus on extracting the most important information for studying.`;

        try {
            const response = await httpClient.post<ChatResponse>(`${AI_BASE}/chat`, {
                document_id: tempDoc.id,
                message: prompt,
                include_videos: false,
            });

            console.log('AI response received');

            const content = response.message.content;
            console.log('AI message content:', content);
            
            // Try to parse as JSON
            try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                console.log('JSON match:', jsonMatch);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    console.log('Parsed JSON:', parsed);
                    return {
                        summary: parsed.summary || '',
                        key_points: Array.isArray(parsed.key_points) ? parsed.key_points : [],
                        notes: parsed.notes || content,
                    };
                }
            } catch (e) {
                console.warn('Failed to parse JSON response:', e);
            }

            // Fallback: extract sections manually
            const lines = content.split('\n');
            let summary = '';
            let keyPoints: string[] = [];
            let notes = '';
            let currentSection = '';

            for (const line of lines) {
                const lower = line.toLowerCase();
                if (lower.includes('summary')) {
                    currentSection = 'summary';
                } else if (lower.includes('key') && lower.includes('point')) {
                    currentSection = 'keyPoints';
                } else if (lower.includes('note')) {
                    currentSection = 'notes';
                } else if (line.trim()) {
                    if (currentSection === 'summary') {
                        summary += line.trim() + ' ';
                    } else if (currentSection === 'keyPoints' && (line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().match(/^\d+\./))) {
                        keyPoints.push(line.replace(/^[-•\d.]\s*/, '').trim());
                    } else if (currentSection === 'notes') {
                        notes += line + '\n';
                    }
                }
            }

            return {
                summary: summary.trim() || content.substring(0, 200),
                key_points: keyPoints.length > 0 ? keyPoints : ['Key information extracted from content'],
                notes: notes.trim() || content,
            };
        } finally {
            // Clean up temporary document
            try {
                console.log('Deleting temporary document:', tempDoc.id);
                await httpClient.delete(`editor-service/api/v1/documents/${tempDoc.id}`);
            } catch (e) {
                console.warn('Failed to delete temporary document:', e);
            }
        }
    }
}

export const aiApi = new AiApiService();


// --- Flashcard Types ---

export interface FlashcardData {
    id: string;
    document_id: string;
    vault_id: string;
    front: string;
    back: string;
    ease_factor: number;
    interval_days: number;
    reps: number;
    next_review: string;
    created_at: string;
}

export interface FlashcardGenerateResponse {
    document_id: string;
    cards: FlashcardData[];
    count: number;
}

export interface FlashcardVaultGenerateResponse {
    vault_id: string;
    cards: FlashcardData[];
    total_cards: number;
    documents_processed: number;
    documents_skipped: number;
}

export interface FlashcardListResponse {
    cards: FlashcardData[];
    total: number;
    due: number;
}

export interface FlashcardReviewResponse {
    id: string;
    ease_factor: number;
    interval_days: number;
    reps: number;
    next_review: string;
}

// --- Quiz Types ---

export interface QuizOption {
    text: string;
    is_correct: boolean;
}

export interface QuizQuestion {
    document_id: string;
    question: string;
    options: QuizOption[];
    topic: string;
}

export interface QuizGenerateResponse {
    questions: QuizQuestion[];
    count: number;
}

export interface QuizSubmitResponse {
    total: number;
    correct: number;
    xp_earned: number;
    accuracy: number;
}

// --- Progress Types ---

export interface TopicProgress {
    topic: string;
    attempts: number;
    correct: number;
    accuracy: number;
    xp: number;
    status: 'strong' | 'review' | 'weak';
}

export interface RecommendedNote {
    document_id: string;
    title: string;
    score: number;
}

export interface AdaptiveRecommendation {
    topic: string;
    accuracy: number;
    related_notes: RecommendedNote[];
}

export interface ProgressDashboardResponse {
    topic_progress: TopicProgress[];
    total_xp: number;
    total_reviews: number;
    cards_due: number;
    recommendations: AdaptiveRecommendation[];
}

// --- Streak Types ---

export interface StreakResponse {
    current_streak: number;
    longest_streak: number;
    today_done: boolean;
    total_study_days: number;
}

export interface ForecastDay {
    date: string;
    cards_due: number;
}

export interface ForecastResponse {
    forecast: ForecastDay[];
    total_due_7d: number;
}

// --- Mixed Quiz Types ---

export interface MixedQuizQuestion {
    document_id: string;
    question_type: 'multiple_choice' | 'true_false' | 'fill_blank';
    question: string;
    options?: QuizOption[];
    is_true?: boolean;
    answer?: string;
    topic: string;
}

export interface MixedQuizGenerateResponse {
    questions: MixedQuizQuestion[];
    count: number;
}

// --- Reading Types ---

export interface ReadingItem {
    document_id: string;
    title: string;
    vault_id: string;
    interval_days: number;
    next_review: string;
    last_read_at: string | null;
    reason: 'due' | 'low_accuracy' | 'never_read';
}

export interface ReadingListResponse {
    items: ReadingItem[];
    total_due: number;
}
