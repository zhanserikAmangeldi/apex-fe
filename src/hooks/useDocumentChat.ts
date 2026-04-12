import { useState, useCallback } from 'react';
import { aiApi, ChatMessage, VideoResult } from '../services/aiApi';

export function useDocumentChat(documentId: string) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | undefined>();
    const [videos, setVideos] = useState<VideoResult[]>([]);

    const sendMessage = useCallback(async (content: string, includeVideos = true) => {
        if (!content.trim()) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: content.trim(),
        };

        setMessages(prev => [...prev, userMessage]);
        setLoading(true);
        setError(null);

        try {
            const response = await aiApi.chatWithDocument(
                documentId,
                content.trim(),
                sessionId,
                includeVideos
            );

            setSessionId(response.session_id);
            setMessages(prev => [...prev, response.message]);
            
            if (response.videos.length > 0) {
                setVideos(response.videos);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
            setError(errorMessage);
            
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
            }]);
        } finally {
            setLoading(false);
        }
    }, [documentId, sessionId]);

    const clearChat = useCallback(() => {
        setMessages([]);
        setSessionId(undefined);
        setVideos([]);
        setError(null);
    }, []);

    return {
        messages,
        loading,
        error,
        videos,
        sessionId,
        sendMessage,
        clearChat,
    };
}
