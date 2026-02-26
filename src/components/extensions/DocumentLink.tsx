import { Node, mergeAttributes } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import type { SuggestionOptions } from '@tiptap/suggestion';
import Suggestion from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import { DocumentLinkList } from './DocumentLinkList.tsx';
import { editorApi } from '../../services/editorApi';
import type { AppDocument } from '../../types/editor';

export interface DocumentLinkOptions {
    HTMLAttributes: Record<string, any>;
    renderLabel: (props: { node: any }) => string;
    suggestion: Omit<SuggestionOptions, 'editor'>;
    vaultId?: string;
    onNavigate?: (documentId: string) => void;
}

export const DocumentLinkPluginKey = new PluginKey('documentLink');

export const DocumentLink = Node.create<DocumentLinkOptions>({
    name: 'documentLink',

    addOptions() {
        return {
            HTMLAttributes: {},
            renderLabel({ node }) {
                return `${node.attrs.label ?? node.attrs.id}`;
            },
            suggestion: {
                char: '[[',
                pluginKey: DocumentLinkPluginKey,
                command: ({ editor, range, props }) => {
                    const nodeAfter = editor.view.state.selection.$to.nodeAfter;
                    const overrideSpace = nodeAfter?.text?.startsWith(' ');

                    if (overrideSpace) {
                        range.to += 1;
                    }

                    editor
                        .chain()
                        .focus()
                        .insertContentAt(range, [
                            {
                                type: this.name,
                                attrs: props,
                            },
                        ])
                        .run();
                },
                allow: ({ state, range }) => {
                    const $from = state.doc.resolve(range.from);
                    const type = state.schema.nodes[this.name];
                    const allow = !!$from.parent.type.contentMatch.matchType(type);

                    return allow;
                },
            },
            vaultId: undefined,
            onNavigate: undefined,
        };
    },

    group: 'inline',

    inline: true,

    selectable: false,

    atom: true,

    addAttributes() {
        return {
            id: {
                default: null,
                parseHTML: element => element.getAttribute('data-id'),
                renderHTML: attributes => {
                    if (!attributes.id) {
                        return {};
                    }

                    return {
                        'data-id': attributes.id,
                    };
                },
            },

            label: {
                default: null,
                parseHTML: element => element.getAttribute('data-label'),
                renderHTML: attributes => {
                    if (!attributes.label) {
                        return {};
                    }

                    return {
                        'data-label': attributes.label,
                    };
                },
            },

            customText: {
                default: null,
                parseHTML: element => element.getAttribute('data-custom-text'),
                renderHTML: attributes => {
                    if (!attributes.customText) {
                        return {};
                    }

                    return {
                        'data-custom-text': attributes.customText,
                    };
                },
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: `span[data-type="${this.name}"]`,
            },
        ];
    },

    renderHTML({ node, HTMLAttributes }) {
        // Use customText if provided, otherwise use label or id
        const displayText = node.attrs.customText || node.attrs.label || node.attrs.id;
        
        return [
            'span',
            mergeAttributes(
                { 'data-type': this.name },
                this.options.HTMLAttributes,
                HTMLAttributes
            ),
            displayText,
        ];
    },

    renderText({ node }) {
        // In text format, show [customText](label) if customText exists (Markdown style)
        const label = node.attrs.label || node.attrs.id;
        if (node.attrs.customText) {
            return `[${node.attrs.customText}](${label})`;
        }
        return `[[${label}]]`;
    },

    addKeyboardShortcuts() {
        return {
            Backspace: () =>
                this.editor.commands.command(({ tr, state }) => {
                    let isDocumentLink = false;
                    const { selection } = state;
                    const { empty, anchor } = selection;

                    if (!empty) {
                        return false;
                    }

                    state.doc.nodesBetween(anchor - 1, anchor, (node, pos) => {
                        if (node.type.name === this.name) {
                            isDocumentLink = true;
                            const label = node.attrs.label || node.attrs.id;
                            const text = node.attrs.customText 
                                ? `[[${label}|${node.attrs.customText}` 
                                : `[[${label}`;
                            tr.insertText(text, pos, pos + node.nodeSize);
                            return false;
                        }
                    });

                    return isDocumentLink;
                }),
            
            // Handle closing ]] to convert text back to link
            ']': ({ editor }) => {
                const { state } = editor;
                const { selection } = state;
                const { $from } = selection;
                
                // Get text before cursor
                const textBefore = $from.parent.textBetween(
                    Math.max(0, $from.parentOffset - 100),
                    $from.parentOffset,
                    null,
                    '\ufffc'
                );
                
                console.log('DocumentLink: ] pressed, text before:', textBefore);
                
                // Check if we're closing a link: [[title]] or [[title|customText]]
                const match = textBefore.match(/\[\[([^\]|]+)(\|([^\]]+))?\]$/);
                
                if (match) {
                    console.log('DocumentLink: Found link pattern', match);
                    const fullMatch = match[0];
                    const docTitle = match[1].trim();
                    const customText = match[3]?.trim();
                    
                    console.log('DocumentLink: Parsed', { docTitle, customText });
                    
                    // Find the document by searching
                    const vaultId = this.options.vaultId;
                    if (vaultId) {
                        console.log('DocumentLink: Searching for document', docTitle);
                        // Search for exact match
                        editorApi.searchDocuments(docTitle, vaultId, 10).then(docs => {
                            console.log('DocumentLink: Search results', docs);
                            const doc = docs.find(d => d.title === docTitle) || docs[0];
                            
                            if (doc) {
                                console.log('DocumentLink: Found document, creating link', doc);
                                const from = $from.pos - fullMatch.length;
                                const to = $from.pos;
                                
                                // Replace text with link node
                                editor.chain()
                                    .focus()
                                    .deleteRange({ from, to })
                                    .insertContentAt(from, {
                                        type: this.name,
                                        attrs: {
                                            id: doc.id,
                                            label: doc.title,
                                            customText: customText || null,
                                        },
                                    })
                                    .run();
                            } else {
                                console.log('DocumentLink: No document found');
                            }
                        }).catch(err => {
                            console.error('DocumentLink: Failed to search document:', err);
                        });
                        
                        // Return true to prevent default ] insertion
                        return true;
                    } else {
                        console.log('DocumentLink: No vaultId');
                    }
                } else {
                    console.log('DocumentLink: No match found');
                }
                
                return false;
            },
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});

export function createDocumentLinkSuggestion(
    vaultId: string | undefined
): Omit<SuggestionOptions, 'editor'> {
    return {
        char: '[[',
        
        items: async ({ query }) => {
            if (!vaultId) {
                console.log('DocumentLink: No vaultId provided');
                return [];
            }
            
            console.log('DocumentLink: Searching for documents', { query, vaultId });
            
            try {
                const documents = await editorApi.searchDocuments(query, vaultId, 10);
                console.log('DocumentLink: Found documents', documents);
                return documents.map((doc: AppDocument) => ({
                    id: doc.id,
                    label: doc.title,
                    icon: doc.icon,
                }));
            } catch (error) {
                console.error('Failed to search documents:', error);
                return [];
            }
        },

        render: () => {
            let component: ReactRenderer;
            let popup: TippyInstance[];

            return {
                onStart: (props: any) => {
                    component = new ReactRenderer(DocumentLinkList, {
                        props,
                        editor: props.editor,
                    });

                    if (!props.clientRect) {
                        return;
                    }

                    popup = tippy('body', {
                        getReferenceClientRect: props.clientRect,
                        appendTo: () => document.body,
                        content: component.element,
                        showOnCreate: true,
                        interactive: true,
                        trigger: 'manual',
                        placement: 'bottom-start',
                    });
                },

                onUpdate(props: any) {
                    component.updateProps(props);

                    if (!props.clientRect) {
                        return;
                    }

                    popup[0].setProps({
                        getReferenceClientRect: props.clientRect,
                    });
                },

                onKeyDown(props: any) {
                    if (props.event.key === 'Escape') {
                        popup[0].hide();
                        return true;
                    }

                    // @ts-ignore - ref might not have onKeyDown
                    return component.ref?.onKeyDown?.(props) || false;
                },

                onExit() {
                    popup[0].destroy();
                    component.destroy();
                },
            };
        },

        command: ({ editor, range, props }) => {
            const nodeAfter = editor.view.state.selection.$to.nodeAfter;
            const overrideSpace = nodeAfter?.text?.startsWith(' ');

            if (overrideSpace) {
                range.to += 1;
            }

            editor
                .chain()
                .focus()
                .insertContentAt(range, [
                    {
                        type: 'documentLink',
                        attrs: props,
                    },
                ])
                .run();
        },

        allow: ({ state, range }) => {
            const $from = state.doc.resolve(range.from);
            const type = state.schema.nodes['documentLink'];
            return !!$from.parent.type.contentMatch.matchType(type);
        },
    };
}
