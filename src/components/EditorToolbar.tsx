import { type Editor } from '@tiptap/react';
import { useCallback } from 'react';

interface ToolbarProps {
    editor: Editor;
}

interface ToolbarButtonProps {
    onClick: () => void;
    isActive?: boolean;
    title: string;
    children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, title, children }: ToolbarButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`p-1.5 rounded transition-colors ${
                isActive
                    ? 'bg-purple-500/30 text-purple-300'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/10'
            }`}
        >
            {children}
        </button>
    );
}

function Divider() {
    return <div className="w-px h-5 bg-white/10 mx-1" />;
}

export function EditorToolbar({ editor }: ToolbarProps) {
    const toggle = useCallback(
        (cmd: () => boolean) => () => { cmd(); },
        []
    );

    return (
        <div className="flex items-center gap-0.5 flex-wrap">
            {/* Text style */}
            <ToolbarButton
                onClick={toggle(() => editor.chain().focus().toggleBold().run())}
                isActive={editor.isActive('bold')}
                title="Bold (Ctrl+B)"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6zm0 8h9a4 4 0 014 4 4 4 0 01-4 4H6z" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
            </ToolbarButton>

            <ToolbarButton
                onClick={toggle(() => editor.chain().focus().toggleItalic().run())}
                isActive={editor.isActive('italic')}
                title="Italic (Ctrl+I)"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" />
                </svg>
            </ToolbarButton>

            <ToolbarButton
                onClick={toggle(() => editor.chain().focus().toggleStrike().run())}
                isActive={editor.isActive('strike')}
                title="Strikethrough"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <path d="M17.5 7.5C17.5 5.01 15.49 3 13 3H7v4.5h6c1.38 0 2.5 1.12 2.5 2.5M7 16.5c0 1.38 1.12 2.5 2.5 2.5H13c2.49 0 4.5-2.01 4.5-4.5H7z" />
                </svg>
            </ToolbarButton>

            <ToolbarButton
                onClick={toggle(() => editor.chain().focus().toggleCode().run())}
                isActive={editor.isActive('code')}
                title="Inline Code"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                </svg>
            </ToolbarButton>

            <Divider />

            {/* Headings */}
            <ToolbarButton
                onClick={toggle(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}
                isActive={editor.isActive('heading', { level: 1 })}
                title="Heading 1"
            >
                <span className="text-xs font-bold leading-none">H1</span>
            </ToolbarButton>

            <ToolbarButton
                onClick={toggle(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
                isActive={editor.isActive('heading', { level: 2 })}
                title="Heading 2"
            >
                <span className="text-xs font-bold leading-none">H2</span>
            </ToolbarButton>

            <ToolbarButton
                onClick={toggle(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}
                isActive={editor.isActive('heading', { level: 3 })}
                title="Heading 3"
            >
                <span className="text-xs font-bold leading-none">H3</span>
            </ToolbarButton>

            <Divider />

            {/* Lists */}
            <ToolbarButton
                onClick={toggle(() => editor.chain().focus().toggleBulletList().run())}
                isActive={editor.isActive('bulletList')}
                title="Bullet List"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" />
                    <circle cx="5" cy="6" r="1" fill="currentColor" /><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="5" cy="18" r="1" fill="currentColor" />
                </svg>
            </ToolbarButton>

            <ToolbarButton
                onClick={toggle(() => editor.chain().focus().toggleOrderedList().run())}
                isActive={editor.isActive('orderedList')}
                title="Ordered List"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="10" y1="6" x2="20" y2="6" /><line x1="10" y1="12" x2="20" y2="12" /><line x1="10" y1="18" x2="20" y2="18" />
                    <text x="3" y="8" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">1</text>
                    <text x="3" y="14" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">2</text>
                    <text x="3" y="20" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">3</text>
                </svg>
            </ToolbarButton>

            <Divider />

            {/* Block elements */}
            <ToolbarButton
                onClick={toggle(() => editor.chain().focus().toggleBlockquote().run())}
                isActive={editor.isActive('blockquote')}
                title="Blockquote"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.166 11 15c0 1.933-1.567 3.5-3.5 3.5-1.171 0-2.277-.566-2.917-1.179zM14.583 17.321C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C19.591 11.69 21 13.166 21 15c0 1.933-1.567 3.5-3.5 3.5-1.171 0-2.277-.566-2.917-1.179z"/>
                </svg>
            </ToolbarButton>

            <ToolbarButton
                onClick={toggle(() => editor.chain().focus().toggleCodeBlock().run())}
                isActive={editor.isActive('codeBlock')}
                title="Code Block"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <polyline points="8 10 6 12 8 14" /><polyline points="16 10 18 12 16 14" />
                </svg>
            </ToolbarButton>

            <ToolbarButton
                onClick={toggle(() => editor.chain().focus().setHorizontalRule().run())}
                title="Horizontal Rule"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="3" y1="12" x2="21" y2="12" />
                </svg>
            </ToolbarButton>
        </div>
    );
}
