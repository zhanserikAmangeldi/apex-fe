import React, { useState, useRef, useEffect } from 'react';
import { aiApi } from '../services/aiApi';
import type { ChatMessage, VideoResult } from '../services/aiApi';
import { Send, Video, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MarkdownComponentProps {
    children?: React.ReactNode;
    className?: string;
    href?: string;
}

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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#1a1a1a] rounded-lg shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-white font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Chat about this note
                </h3>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-8">
                        <p className="text-sm">Ask me anything about this note!</p>
                        <p className="text-xs mt-2 text-gray-600">I can explain concepts, suggest videos, and more.</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] rounded-lg px-4 py-3 ${
                                msg.role === 'user'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white/5 text-gray-200 border border-white/10'
                            }`}
                        >
                            {msg.role === 'user' ? (
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            ) : (
                                <div className="prose prose-sm prose-invert max-w-none">
                                    <ReactMarkdown
                                        components={{
                                            p: ({ children }: MarkdownComponentProps) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                                            strong: ({ children }: MarkdownComponentProps) => <strong className="font-semibold text-white">{children}</strong>,
                                            em: ({ children }: MarkdownComponentProps) => <em className="italic text-gray-300">{children}</em>,
                                            ul: ({ children }: MarkdownComponentProps) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                            ol: ({ children }: MarkdownComponentProps) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                            li: ({ children }: MarkdownComponentProps) => <li className="text-gray-300 leading-relaxed">{children}</li>,
                                            code: ({ children, className }: MarkdownComponentProps) => {
                                                const isInline = !className;
                                                return isInline ? (
                                                    <code className="bg-black/30 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono">
                                                        {children}
                                                    </code>
                                                ) : (
                                                    <code className="block bg-black/30 text-gray-300 p-2 rounded text-xs font-mono overflow-x-auto">
                                                        {children}
                                                    </code>
                                                );
                                            },
                                            h1: ({ children }: MarkdownComponentProps) => <h1 className="text-lg font-bold text-white mb-2 mt-3 first:mt-0">{children}</h1>,
                                            h2: ({ children }: MarkdownComponentProps) => <h2 className="text-base font-bold text-white mb-2 mt-3 first:mt-0">{children}</h2>,
                                            h3: ({ children }: MarkdownComponentProps) => <h3 className="text-sm font-semibold text-white mb-1 mt-2 first:mt-0">{children}</h3>,
                                            hr: () => <hr className="border-white/10 my-3" />,
                                            blockquote: ({ children }: MarkdownComponentProps) => (
                                                <blockquote className="border-l-2 border-indigo-500/50 pl-3 italic text-gray-400 my-2">
                                                    {children}
                                                </blockquote>
                                            ),
                                            a: ({ children, href }: MarkdownComponentProps) => (
                                                <a href={href} target="_blank" rel="noopener noreferrer" 
                                                   className="text-indigo-400 hover:text-indigo-300 underline">
                                                    {children}
                                                </a>
                                            ),
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Videos */}
            {videos.length > 0 && (
                <div className="border-t border-white/10 p-4 bg-white/5">
                    <div className="flex items-center gap-2 mb-3">
                        <Video className="w-4 h-4 text-red-400" />
                        <h4 className="font-semibold text-sm text-white">Related Videos</h4>
                    </div>
                    <div className="space-y-2">
                        {videos.map((video) => (
                            <a
                                key={video.video_id}
                                href={`https://www.youtube.com/watch?v=${video.video_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors border border-white/10 group"
                            >
                                <img
                                    src={video.thumbnail_url}
                                    alt={video.title}
                                    className="w-32 h-20 object-cover rounded flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-200 group-hover:text-white line-clamp-2 leading-snug">
                                        {video.title}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1.5">
                                        {video.channel_title}
                                    </p>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="border-t border-white/10 p-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a question..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
