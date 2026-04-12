import React, { useState, useRef, useEffect } from 'react';
import { aiApi, ChatMessage, VideoResult } from '../services/aiApi';
import { Send, Video, Loader2 } from 'lucide-react';

interface DocumentChatProps {
    documentId: string;
    onClose?: () => void;
}

export const DocumentChat: React.FC<DocumentChatProps> = ({ documentId, onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | undefined>();
    const [videos, setVideos] = useState<VideoResult[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: input.trim(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await aiApi.chatWithDocument(
                documentId,
                userMessage.content,
                sessionId,
                true
            );

            setSessionId(response.session_id);
            setMessages(prev => [...prev, response.message]);
            
            if (response.videos.length > 0) {
                setVideos(response.videos);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Chat about this note</h3>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-8">
                        <p>Ask me anything about this note!</p>
                        <p className="text-sm mt-2">I can explain concepts, suggest videos, and more.</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                msg.role === 'user'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-900'
                            }`}
                        >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg px-4 py-2">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Videos */}
            {videos.length > 0 && (
                <div className="border-t p-4 bg-gray-50">
                    <div className="flex items-center gap-2 mb-3">
                        <Video className="w-4 h-4 text-red-500" />
                        <h4 className="font-semibold text-sm">Related Videos</h4>
                    </div>
                    <div className="space-y-2">
                        {videos.map((video) => (
                            <a
                                key={video.video_id}
                                href={`https://www.youtube.com/watch?v=${video.video_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex gap-3 p-2 rounded hover:bg-gray-100 transition-colors"
                            >
                                <img
                                    src={video.thumbnail_url}
                                    alt={video.title}
                                    className="w-32 h-20 object-cover rounded"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm line-clamp-2">
                                        {video.title}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {video.channel_title}
                                    </p>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="border-t p-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask a question..."
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
