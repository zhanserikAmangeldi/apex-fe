import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import type { ConnectionType } from '../../types/editor';

interface DocumentLinkListProps {
    items: Array<{
        id: string;
        label: string;
        icon?: string;
    }>;
    command: (item: any) => void;
}

const CONNECTION_TYPES: Array<{ value: ConnectionType; label: string; icon: string }> = [
    { value: 'references', label: 'References', icon: '📌' },
    { value: 'related', label: 'Related', icon: '🔗' },
    { value: 'supports', label: 'Supports', icon: '✅' },
    { value: 'contradicts', label: 'Contradicts', icon: '⚡' },
    { value: 'extends', label: 'Extends', icon: '📎' },
    { value: 'inspired_by', label: 'Inspired by', icon: '💡' },
];

export const DocumentLinkList = forwardRef((props: DocumentLinkListProps, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [selectedDoc, setSelectedDoc] = useState<{ id: string; label: string; icon?: string } | null>(null);
    const [typeIndex, setTypeIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            setSelectedDoc(item);
            setTypeIndex(0);
        }
    };

    const selectType = (index: number) => {
        if (!selectedDoc) return;
        const type = CONNECTION_TYPES[index];
        props.command({ ...selectedDoc, connectionType: type.value });
    };

    const upHandler = () => {
        if (selectedDoc) {
            setTypeIndex((typeIndex + CONNECTION_TYPES.length - 1) % CONNECTION_TYPES.length);
        } else {
            setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        }
    };

    const downHandler = () => {
        if (selectedDoc) {
            setTypeIndex((typeIndex + 1) % CONNECTION_TYPES.length);
        } else {
            setSelectedIndex((selectedIndex + 1) % props.items.length);
        }
    };

    const enterHandler = () => {
        if (selectedDoc) {
            selectType(typeIndex);
        } else {
            selectItem(selectedIndex);
        }
    };

    const backHandler = () => {
        if (selectedDoc) {
            setSelectedDoc(null);
            return true;
        }
        return false;
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                upHandler();
                return true;
            }
            if (event.key === 'ArrowDown') {
                downHandler();
                return true;
            }
            if (event.key === 'Enter') {
                enterHandler();
                return true;
            }
            if (event.key === 'Backspace' || event.key === 'Escape') {
                return backHandler();
            }
            return false;
        },
    }));

    if (selectedDoc) {
        return (
            <div className="bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl p-2 min-w-[220px]">
                <div className="text-white/40 text-[11px] px-3 py-1 mb-1 flex items-center gap-1.5">
                    <span>{selectedDoc.icon || '📄'}</span>
                    <span className="truncate">{selectedDoc.label}</span>
                </div>
                <div className="border-t border-white/10 my-1" />
                <div className="text-white/30 text-[10px] uppercase tracking-wider px-3 py-1">
                    Connection type
                </div>
                {CONNECTION_TYPES.map((type, index) => (
                    <button
                        key={type.value}
                        onClick={() => selectType(index)}
                        className={`
                            w-full text-left px-3 py-1.5 rounded-md text-sm
                            flex items-center gap-2 transition-colors
                            ${index === typeIndex
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'text-white/80 hover:bg-white/5'
                            }
                        `}
                    >
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                    </button>
                ))}
            </div>
        );
    }

    if (props.items.length === 0) {
        return (
            <div className="bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl p-2 min-w-[200px]">
                <div className="text-white/40 text-sm px-3 py-2">No documents found</div>
            </div>
        );
    }

    return (
        <div className="bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl p-2 min-w-[200px] max-h-[300px] overflow-y-auto">
            {props.items.map((item, index) => (
                <button
                    key={item.id}
                    onClick={() => selectItem(index)}
                    className={`
                        w-full text-left px-3 py-2 rounded-md text-sm
                        flex items-center gap-2 transition-colors
                        ${index === selectedIndex
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'text-white/80 hover:bg-white/5'
                        }
                    `}
                >
                    {item.icon && <span className="text-base">{item.icon}</span>}
                    <span className="truncate">{item.label}</span>
                </button>
            ))}
        </div>
    );
});

DocumentLinkList.displayName = 'DocumentLinkList';
