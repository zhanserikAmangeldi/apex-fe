import React, { useState, useEffect, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import * as Y from 'yjs';

export interface Comment {
    id: string;
    text: string;
    author: string;
    authorColor: string;
    createdAt: number;
    resolved: boolean;
    replies: CommentReply[];
}

export interface CommentReply {
    id: string;
    text: string;
    author: string;
    authorColor: string;
    createdAt: number;
}

interface Props {
    editor: Editor | null;
    ydoc: Y.Doc;
    userName: string;
    userColor: string;
    readOnly?: boolean;
    onClose: () => void;
}

function generateId() {
    return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function formatTime(ts: number): string {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
}

export const CommentsSidebar: React.FC<Props> = ({
    editor, ydoc, userName, userColor, readOnly, onClose,
}) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newCommentText, setNewCommentText] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [showResolved, setShowResolved] = useState(false);

    // Yjs shared array for comments
    const yComments = ydoc.getArray<Comment>('comments');

    // Sync Yjs array → React state
    const syncComments = useCallback(() => {
        const arr = yComments.toArray();
        setComments([...arr]);
    }, [yComments]);

    useEffect(() => {
        syncComments();
        yComments.observe(syncComments);
        return () => yComments.unobserve(syncComments);
    }, [yComments, syncComments]);

    const addComment = () => {
        if (!newCommentText.trim() || !editor) return;

        const { from, to } = editor.state.selection;
        const hasSelection = from !== to;

        const commentId = generateId();
        const comment: Comment = {
            id: commentId,
            text: newCommentText.trim(),
            author: userName,
            authorColor: userColor,
            createdAt: Date.now(),
            resolved: false,
            replies: [],
        };

        // If text is selected, highlight it
        if (hasSelection) {
            editor.chain().focus().setComment(commentId).run();
        }

        yComments.push([comment]);
        setNewCommentText('');
    };

    const addReply = (commentId: string) => {
        if (!replyText.trim()) return;

        const idx = yComments.toArray().findIndex(c => c.id === commentId);
        if (idx === -1) return;

        const comment = yComments.get(idx);
        const reply: CommentReply = {
            id: generateId(),
            text: replyText.trim(),
            author: userName,
            authorColor: userColor,
            createdAt: Date.now(),
        };

        const updated: Comment = {
            ...comment,
            replies: [...comment.replies, reply],
        };

        ydoc.transact(() => {
            yComments.delete(idx, 1);
            yComments.insert(idx, [updated]);
        });

        setReplyText('');
        setReplyingTo(null);
    };

    const resolveComment = (commentId: string) => {
        const idx = yComments.toArray().findIndex(c => c.id === commentId);
        if (idx === -1) return;

        const comment = yComments.get(idx);
        const updated: Comment = { ...comment, resolved: !comment.resolved };

        ydoc.transact(() => {
            yComments.delete(idx, 1);
            yComments.insert(idx, [updated]);
        });

        // Remove highlight if resolving
        if (!comment.resolved && editor) {
            // Find and remove the mark
            const { doc } = editor.state;
            const positions: { from: number; to: number }[] = [];
            doc.descendants((node, pos) => {
                node.marks.forEach(mark => {
                    if (mark.type.name === 'commentHighlight' && mark.attrs.commentId === commentId) {
                        positions.push({ from: pos, to: pos + node.nodeSize });
                    }
                });
            });
            if (positions.length > 0) {
                const chain = editor.chain();
                positions.forEach(({ from, to }) => {
                    chain.setTextSelection({ from, to }).unsetComment();
                });
                chain.run();
            }
        }
    };

    const deleteComment = (commentId: string) => {
        const idx = yComments.toArray().findIndex(c => c.id === commentId);
        if (idx === -1) return;
        yComments.delete(idx, 1);
    };

    const activeComments = comments.filter(c => !c.resolved);
    const resolvedComments = comments.filter(c => c.resolved);
    const displayComments = showResolved ? resolvedComments : activeComments;

    return (
        <div className="w-80 flex-shrink-0 border-l border-white/10 bg-black/30 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h3 className="text-white font-medium text-sm">
                    Comments ({activeComments.length})
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowResolved(!showResolved)}
                        className={`text-xs px-2 py-1 rounded ${showResolved ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white/60'}`}
                    >
                        {showResolved ? 'Resolved' : 'Active'}
                    </button>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
                        <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* New comment input */}
            {!readOnly && (
                <div className="p-3 border-b border-white/10">
                    <textarea
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Add a comment... (select text first to highlight)"
                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-white/40 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                        rows={2}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                addComment();
                            }
                        }}
                    />
                    <button
                        onClick={addComment}
                        disabled={!newCommentText.trim()}
                        className="mt-2 w-full px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        Comment {editor && editor.state.selection.from !== editor.state.selection.to ? '(with highlight)' : ''}
                    </button>
                </div>
            )}

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto">
                {displayComments.length === 0 ? (
                    <div className="p-4 text-center text-white/40 text-sm">
                        {showResolved ? 'No resolved comments' : 'No comments yet'}
                    </div>
                ) : (
                    displayComments.map((comment) => (
                        <div key={comment.id} className="p-3 border-b border-white/5 hover:bg-white/5 transition-colors">
                            {/* Comment header */}
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
                                        style={{ backgroundColor: comment.authorColor }}
                                    >
                                        {comment.author[0]?.toUpperCase()}
                                    </div>
                                    <span className="text-white/80 text-xs font-medium">{comment.author}</span>
                                    <span className="text-white/30 text-[10px]">{formatTime(comment.createdAt)}</span>
                                </div>
                                {!readOnly && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => resolveComment(comment.id)}
                                            className="p-1 hover:bg-white/10 rounded"
                                            title={comment.resolved ? 'Reopen' : 'Resolve'}
                                        >
                                            <svg className={`w-3.5 h-3.5 ${comment.resolved ? 'text-green-400' : 'text-white/40'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => deleteComment(comment.id)}
                                            className="p-1 hover:bg-red-500/20 rounded"
                                            title="Delete"
                                        >
                                            <svg className="w-3.5 h-3.5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Comment text */}
                            <p className="text-white/70 text-sm ml-7">{comment.text}</p>

                            {/* Replies */}
                            {comment.replies.length > 0 && (
                                <div className="ml-7 mt-2 space-y-2 border-l-2 border-white/10 pl-3">
                                    {comment.replies.map((reply) => (
                                        <div key={reply.id}>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <div
                                                    className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white font-bold"
                                                    style={{ backgroundColor: reply.authorColor }}
                                                >
                                                    {reply.author[0]?.toUpperCase()}
                                                </div>
                                                <span className="text-white/70 text-[11px] font-medium">{reply.author}</span>
                                                <span className="text-white/30 text-[10px]">{formatTime(reply.createdAt)}</span>
                                            </div>
                                            <p className="text-white/60 text-xs ml-6">{reply.text}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Reply input */}
                            {!readOnly && replyingTo === comment.id ? (
                                <div className="ml-7 mt-2">
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Reply..."
                                        className="w-full px-2 py-1.5 rounded bg-white/10 border border-white/20 text-white text-xs placeholder-white/40 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                                        rows={1}
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                                addReply(comment.id);
                                            }
                                            if (e.key === 'Escape') {
                                                setReplyingTo(null);
                                                setReplyText('');
                                            }
                                        }}
                                    />
                                    <div className="flex gap-1 mt-1">
                                        <button
                                            onClick={() => addReply(comment.id)}
                                            disabled={!replyText.trim()}
                                            className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] disabled:opacity-30"
                                        >
                                            Reply
                                        </button>
                                        <button
                                            onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                            className="px-2 py-0.5 rounded bg-white/10 text-white/60 text-[10px]"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                !readOnly && !comment.resolved && (
                                    <button
                                        onClick={() => setReplyingTo(comment.id)}
                                        className="ml-7 mt-1 text-[11px] text-white/40 hover:text-white/60"
                                    >
                                        Reply
                                    </button>
                                )
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
