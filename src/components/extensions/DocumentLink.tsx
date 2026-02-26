import { Node, mergeAttributes } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import type { SuggestionOptions } from '@tiptap/suggestion';
import Suggestion from '@tiptap/suggestion';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import { DocumentLinkList } from './DocumentLinkList.tsx';
import { editorApi } from '../../services/editorApi';
import type { AppDocument } from '../../types/editor';

export interface DocumentLinkOptions {
    HTMLAttributes: Record<string, any>;
    renderLabel: (props: { node: any }) => string;
    suggestion: Omit<SuggestionOptions, 'editor'>;
    vaultId?: string;
    sourceDocumentId?: string;
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
            sourceDocumentId: undefined,
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
            
            ']': ({ editor }) => {
                const { state } = editor;
                const { selection } = state;
                const { $from } = selection;
                
                const textBefore = $from.parent.textBetween(
                    Math.max(0, $from.parentOffset - 100),
                    $from.parentOffset,
                    null,
                    '\ufffc'
                );
                
                const match = textBefore.match(/\[\[([^\]|]+)(\|([^\]]+))?\]$/);
                
                if (match) {
                    const fullMatch = match[0];
                    const docTitle = match[1].trim();
                    const customText = match[3]?.trim();
                    
                    const vaultId = this.options.vaultId;
                    if (vaultId) {
                        editorApi.searchDocuments(docTitle, vaultId, 10).then(docs => {
                            const doc = docs.find(d => d.title === docTitle) || docs[0];
                            
                            if (doc) {
                                const from = $from.pos - fullMatch.length;
                                const to = $from.pos;
                                
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

                                const srcId = this.options.sourceDocumentId;
                                if (srcId && doc.id) {
                                    editorApi.createConnection(srcId, doc.id, 'references', undefined, true)
                                        .then(() => window.dispatchEvent(new Event('connections-changed')))
                                        .catch(() => {});
                                }
            } else {
                            }
                        }).catch(() => {});
                        
                        return true;
                    }
                }
                
                return false;
            },
        };
    },

    addProseMirrorPlugins() {
        const sourceDocumentId = this.options.sourceDocumentId;
        const nodeName = this.name;

        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
            new Plugin({
                key: new PluginKey('documentLinkTracker'),
                appendTransaction(transactions, oldState, newState) {
                    if (!sourceDocumentId) return null;

                    const docChanged = transactions.some(tr => tr.docChanged);
                    if (!docChanged) return null;

                    const oldLinks = new Set<string>();
                    const newLinks = new Set<string>();

                    oldState.doc.descendants(node => {
                        if (node.type.name === nodeName && node.attrs.id) {
                            oldLinks.add(node.attrs.id);
                        }
                    });

                    newState.doc.descendants(node => {
                        if (node.type.name === nodeName && node.attrs.id) {
                            newLinks.add(node.attrs.id);
                        }
                    });

                    for (const id of oldLinks) {
                        if (!newLinks.has(id)) {
                            editorApi.deleteInlineConnection(sourceDocumentId, id)
                                .then(() => window.dispatchEvent(new Event('connections-changed')))
                                .catch(() => {});
                        }
                    }

                    return null;
                },
            }),
        ];
    },
});

export function createDocumentLinkSuggestion(
    vaultId: string | undefined,
    sourceDocumentId?: string,
): Omit<SuggestionOptions, 'editor'> {
    return {
        char: '[[',
        
        items: async ({ query }) => {
            if (!vaultId) {
                return [];
            }
            
            try {
                const documents = await editorApi.searchDocuments(query, vaultId, 10);
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

                    // @ts-ignore
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
                        attrs: {
                            id: props.id,
                            label: props.label,
                        },
                    },
                ])
                .run();

            if (sourceDocumentId && props.id && props.connectionType) {
                editorApi.createConnection(
                    sourceDocumentId,
                    props.id,
                    props.connectionType,
                    undefined,
                    true,
                ).then(() => {
                    window.dispatchEvent(new Event('connections-changed'));
                }).catch(() => {
                });
            }
        },

        allow: ({ state, range }) => {
            const $from = state.doc.resolve(range.from);
            const type = state.schema.nodes['documentLink'];
            return !!$from.parent.type.contentMatch.matchType(type);
        },
    };
}
