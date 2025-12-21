import React, { useEffect, useMemo, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';

interface Props {
    documentId: string;
    userName: string;
    userColor: string;
}

export const TiptapEditor: React.FC<Props> = ({ documentId, userName, userColor }) => {
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
            provider ? CollaborationCursor.configure({
                provider,
                user: { name: userName, color: userColor },
            }) : null,
        ].filter(Boolean),
        editorProps: {
            attributes: {
                class: 'ProseMirror prose prose-invert max-w-none focus:outline-none py-8 px-12',
            },
        },
    }, [provider]);

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
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                    <span className="text-xs text-white/60 capitalize">{status}</span>
                </div>
            </div>

            {/* Контент */}
            <div className="flex-1 overflow-y-auto bg-transparent text-white">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};