/**
 * Custom Tiptap Mark for highlighting commented text.
 * Uses the Highlight extension as a base, adding a comment-id attribute
 * so we can link highlighted ranges to comment threads.
 */
import { Mark, mergeAttributes } from '@tiptap/core';

export interface CommentHighlightOptions {
    HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        commentHighlight: {
            setComment: (commentId: string) => ReturnType;
            unsetComment: () => ReturnType;
        };
    }
}

export const CommentHighlight = Mark.create<CommentHighlightOptions>({
    name: 'commentHighlight',

    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    addAttributes() {
        return {
            commentId: {
                default: null,
                parseHTML: (el) => el.getAttribute('data-comment-id'),
                renderHTML: (attrs) => {
                    if (!attrs.commentId) return {};
                    return { 'data-comment-id': attrs.commentId };
                },
            },
        };
    },

    parseHTML() {
        return [{ tag: 'mark[data-comment-id]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['mark', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
            class: 'comment-highlight',
        }), 0];
    },

    addCommands() {
        return {
            setComment: (commentId: string) => ({ commands }) => {
                return commands.setMark(this.name, { commentId });
            },
            unsetComment: () => ({ commands }) => {
                return commands.unsetMark(this.name);
            },
        };
    },
});
