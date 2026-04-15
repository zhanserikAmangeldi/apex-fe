import { useEffect, useMemo, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';
import { DocumentLink, createDocumentLinkSuggestion } from './extensions/DocumentLink';
import { CommentHighlight } from './extensions/CommentHighlight';
import { CommentsSidebar } from './CommentsSidebar';
import { EditorToolbar } from './EditorToolbar';
import { useNavigate } from 'react-router-dom';
import { aiApi } from '../services/aiApi';

interface Props {
    documentId: string;
    vaultId?: string;
    userName?: string;
    userColor?: string;
    readOnly?: boolean;
    onExport?: () => void;
    onShare?: () => void;
}

export interface TiptapEditorRef {
    getMarkdown: () => string;
    getHTML: () => string;
    getText: () => string;
}

export const TiptapEditor = forwardRef<TiptapEditorRef, Props>(({
    documentId,
    vaultId,
    userName = 'Anonymous',
    userColor = '#6366f1',
    readOnly = false,
    onExport,
    onShare,
}, ref) => {
    const [status, setStatus] = useState('connecting');
    const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
    const [showComments, setShowComments] = useState(false);
    const [readMarked, setReadMarked] = useState(false);
    const navigate = useNavigate();

    const ydoc = useMemo(() => new Y.Doc(), [documentId]);

    useEffect(() => {
        const hProvider = new HocuspocusProvider({
            url: import.meta.env.VITE_WS_URL || 'ws://localhost:1234',
            name: documentId,
            document: ydoc,
            token: localStorage.getItem('access_token') || '',
            onStatus: ({ status }) => setStatus(status),
        });
        setProvider(hProvider);
        return () => { hProvider.destroy(); };
    }, [documentId, ydoc]);

    const handleDocumentLinkClick = useCallback((docId: string) => {
        if (vaultId) {
            navigate(`/workspace/${vaultId}?doc=${docId}&t=${Date.now()}`);
        }
    }, [vaultId, navigate]);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ history: false }),
            Collaboration.configure({ document: ydoc }),
            CommentHighlight,
            DocumentLink.configure({
                suggestion: createDocumentLinkSuggestion(vaultId, documentId),
                vaultId: vaultId,
                sourceDocumentId: documentId,
                HTMLAttributes: { class: 'document-link' },
            }),
            ...(provider ? [CollaborationCursor.configure({
                provider,
                user: { name: userName, color: userColor },
            })] : []),
        ],
        editable: !readOnly,
        editorProps: {
            attributes: {
                class: 'ProseMirror prose prose-invert max-w-none focus:outline-none py-8 px-12',
            },
            handleClickOn: (_view, _pos, node, _nodePos, event) => {
                if (node.type.name === 'documentLink') {
                    event.preventDefault();
                    const id = node.attrs.id;
                    if (id) handleDocumentLinkClick(id);
                    return true;
                }
                return false;
            },
        },
    }, [provider, readOnly, vaultId]);

    useImperativeHandle(ref, () => ({
        getMarkdown: () => {
            if (!editor) return '';
            return htmlToMarkdown(editor.getHTML());
        },
        getHTML: () => editor?.getHTML() || '',
        getText: () => editor?.getText() || '',
    }), [editor]);

    if (!editor || !provider) {
        return (
            <div className="flex-1 flex items-center justify-center text-white/40">
                Initializing real-time session...
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex-shrink-0 px-6 py-3 bg-black/20 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {readOnly && (
                        <span className="text-xs text-yellow-400 px-3 py-1 bg-yellow-500/10 rounded-full">
                            Read Only Mode
                        </span>
                    )}
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                        <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                        <span className="text-xs text-white/60 capitalize">{status}</span>
                    </div>
                </div>

                {/* Comments & Read */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            showComments
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        Comments
                    </button>
                    <button
                        onClick={async () => {
                            try {
                                await aiApi.markAsRead(documentId);
                                setReadMarked(true);
                                setTimeout(() => setReadMarked(false), 2000);
                            } catch {
                                // no schedule yet
                            }
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            readMarked
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {readMarked ? '✅ Done' : '✓ Read'}
                    </button>
                    {onExport && (
                        <button
                            onClick={onExport}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors bg-white/5 text-white/60 hover:bg-white/10"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export
                        </button>
                    )}
                    {onShare && (
                        <button
                            onClick={onShare}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors bg-white/5 text-white/60 hover:bg-white/10"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            Share
                        </button>
                    )}
                </div>
            </div>

            {/* Formatting toolbar */}
            {!readOnly && (
                <div className="flex-shrink-0 px-6 py-2 bg-black/10 border-b border-white/5">
                    <EditorToolbar editor={editor} />
                </div>
            )}

            {/* Content + Comments sidebar */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-y-auto bg-transparent text-white">
                    <EditorContent editor={editor} />
                </div>

                {showComments && (
                    <CommentsSidebar
                        editor={editor}
                        ydoc={ydoc}
                        userName={userName}
                        userColor={userColor}
                        readOnly={readOnly}
                        onClose={() => setShowComments(false)}
                    />
                )}
            </div>
        </div>
    );
});

TiptapEditor.displayName = 'TiptapEditor';

function htmlToMarkdown(html: string): string {
    let md = html;
    md = md.replace(/<\/?p>/g, '\n');
    md = md.replace(/<h1>(.*?)<\/h1>/g, '# $1\n');
    md = md.replace(/<h2>(.*?)<\/h2>/g, '## $1\n');
    md = md.replace(/<h3>(.*?)<\/h3>/g, '### $1\n');
    md = md.replace(/<h4>(.*?)<\/h4>/g, '#### $1\n');
    md = md.replace(/<h5>(.*?)<\/h5>/g, '##### $1\n');
    md = md.replace(/<h6>(.*?)<\/h6>/g, '###### $1\n');
    md = md.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
    md = md.replace(/<b>(.*?)<\/b>/g, '**$1**');
    md = md.replace(/<em>(.*?)<\/em>/g, '*$1*');
    md = md.replace(/<i>(.*?)<\/i>/g, '*$1*');
    md = md.replace(/<ul>/g, '\n');
    md = md.replace(/<\/ul>/g, '\n');
    md = md.replace(/<ol>/g, '\n');
    md = md.replace(/<\/ol>/g, '\n');
    md = md.replace(/<li>(.*?)<\/li>/g, '- $1\n');
    md = md.replace(/<code>(.*?)<\/code>/g, '`$1`');
    md = md.replace(/<pre><code>(.*?)<\/code><\/pre>/gs, '```\n$1\n```\n');
    md = md.replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)');
    md = md.replace(/<blockquote>(.*?)<\/blockquote>/gs, (_m, c) =>
        c.split('\n').map((l: string) => `> ${l}`).join('\n') + '\n'
    );
    md = md.replace(/<br\s*\/?>/g, '\n');
    md = md.replace(/<[^>]+>/g, '');
    md = md.replace(/\n{3,}/g, '\n\n');
    md = md.replace(/&nbsp;/g, ' ');
    md = md.replace(/&amp;/g, '&');
    md = md.replace(/&lt;/g, '<');
    md = md.replace(/&gt;/g, '>');
    md = md.replace(/&quot;/g, '"');
    return md.trim();
}
