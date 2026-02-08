import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

interface DocumentLinkListProps {
    items: Array<{
        id: string;
        label: string;
        icon?: string;
    }>;
    command: (item: any) => void;
}

export const DocumentLinkList = forwardRef((props: DocumentLinkListProps, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];

        if (item) {
            props.command(item);
        }
    };

    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
    };

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
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

            return false;
        },
    }));

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
                        flex items-center gap-2
                        transition-colors
                        ${
                            index === selectedIndex
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
