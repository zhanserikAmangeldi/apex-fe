import { useEffect, useMemo, useState, useImperativeHandle, forwardRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';

interface Props {
    documentId: string;
    userName?: string;
    userColor?: string;
    readOnly?: boolean;
}

export interface TiptapEditorRef {
    getMarkdown: () => string;
    getHTML: () => string;
    getText: () => string;
}

export const TiptapEditor = forwardRef<TiptapEditorRef, Props>(({ 
    documentId, 
    userName = 'Anonymous', 
    userColor = '#6366f1',
    readOnly = false 
}, ref) => {
    const [status, setStatus] = useState('connecting');
    const [provider, setProvider] = useState<HocuspocusProvider | null>(null);

    const ydoc = useMemo(() => new Y.Doc(), [documentId]);

    useEffect(() => {
        const hProvider = new HocuspocusProvider({
            url: 'ws://localhost:1234',
            name: documentId,
            document: ydoc,
            token: localStorage.getItem('access_token') || '',
            onStatus: ({ status }) => setStatus(status),
        });

        setProvider(hProvider);

        return () => {
            hProvider.destroy();
        };
    }, [documentId, ydoc]);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                history: false
            }),
            Collaboration.configure({
                document: ydoc
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
        },
    }, [provider, readOnly]);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
        getMarkdown: () => {
            if (!editor) return '';
            // Convert HTML to Markdown (simple conversion)
            const html = editor.getHTML();
            return htmlToMarkdown(html);
        },
        getHTML: () => {
            if (!editor) return '';
            return editor.getHTML();
        },
        getText: () => {
            if (!editor) return '';
            return editor.getText();
        },
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
            {/* Toolbar (Дизайн из твоего варианта) */}
            <div className="flex-shrink-0 px-6 py-3 bg-black/20 border-b border-white/10 flex items-center justify-between">
                {/*<div className="flex items-center gap-2">*/}
                {/*    <button*/}
                {/*        onClick={() => editor.chain().focus().toggleBold().run()}*/}
                {/*        className={`p-2 rounded ${editor.isActive('bold') ? 'bg-purple-500/20 text-purple-400' : 'text-white/60'}`}*/}
                {/*    >*/}
                {/*        <b>B</b>*/}
                {/*    </button>*/}
                {/*    <button*/}
                {/*        onClick={() => editor.chain().focus().toggleItalic().run()}*/}
                {/*        className={`p-2 rounded ${editor.isActive('italic') ? 'bg-purple-500/20 text-purple-400' : 'text-white/60'}`}*/}
                {/*    >*/}
                {/*        <i>I</i>*/}
                {/*    </button>*/}
                {/*</div>*/}

                {/* Индикатор статуса прямо в тулбаре */}
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
            </div>

            {/* Контент */}
            <div className="flex-1 overflow-y-auto bg-transparent text-white">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
});

TiptapEditor.displayName = 'TiptapEditor';

// Simple HTML to Markdown converter
function htmlToMarkdown(html: string): string {
    let markdown = html;
    
    // Remove wrapper tags
    markdown = markdown.replace(/<\/?p>/g, '\n');
    
    // Headers
    markdown = markdown.replace(/<h1>(.*?)<\/h1>/g, '# $1\n');
    markdown = markdown.replace(/<h2>(.*?)<\/h2>/g, '## $1\n');
    markdown = markdown.replace(/<h3>(.*?)<\/h3>/g, '### $1\n');
    markdown = markdown.replace(/<h4>(.*?)<\/h4>/g, '#### $1\n');
    markdown = markdown.replace(/<h5>(.*?)<\/h5>/g, '##### $1\n');
    markdown = markdown.replace(/<h6>(.*?)<\/h6>/g, '###### $1\n');
    
    // Bold and italic
    markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
    markdown = markdown.replace(/<b>(.*?)<\/b>/g, '**$1**');
    markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*');
    markdown = markdown.replace(/<i>(.*?)<\/i>/g, '*$1*');
    
    // Lists
    markdown = markdown.replace(/<ul>/g, '\n');
    markdown = markdown.replace(/<\/ul>/g, '\n');
    markdown = markdown.replace(/<ol>/g, '\n');
    markdown = markdown.replace(/<\/ol>/g, '\n');
    markdown = markdown.replace(/<li>(.*?)<\/li>/g, '- $1\n');
    
    // Code
    markdown = markdown.replace(/<code>(.*?)<\/code>/g, '`$1`');
    markdown = markdown.replace(/<pre><code>(.*?)<\/code><\/pre>/gs, '```\n$1\n```\n');
    
    // Links
    markdown = markdown.replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)');
    
    // Blockquotes
    markdown = markdown.replace(/<blockquote>(.*?)<\/blockquote>/gs, (_match, content) => {
        return content.split('\n').map((line: string) => `> ${line}`).join('\n') + '\n';
    });
    
    // Line breaks
    markdown = markdown.replace(/<br\s*\/?>/g, '\n');
    
    // Clean up remaining HTML tags
    markdown = markdown.replace(/<[^>]+>/g, '');
    
    // Clean up multiple newlines
    markdown = markdown.replace(/\n{3,}/g, '\n\n');
    
    // Decode HTML entities
    markdown = markdown.replace(/&nbsp;/g, ' ');
    markdown = markdown.replace(/&amp;/g, '&');
    markdown = markdown.replace(/&lt;/g, '<');
    markdown = markdown.replace(/&gt;/g, '>');
    markdown = markdown.replace(/&quot;/g, '"');
    
    return markdown.trim();
}