import React, { useState, useRef, useEffect } from 'react';
import type { AppDocument } from '../types/editor';
import { FileIcon } from './ui/FileIcon';
import { FileUpload } from './FileUpload';
import { FilePreviewModal } from './FilePreviewModal';
import { isPreviewableFile, getMimeType } from '../utils/fileIcons';
import { editorApi } from '../services/editorApi';

interface FileTreeProps {
    documents: AppDocument[];
    selectedDoc: AppDocument | null;
    vaultId: string;
    onSelect: (doc: AppDocument) => void;
    onDelete: (id: string) => void;
    onMove?: (docId: string, newParentId: string | null) => void;
    onRename?: (id: string, newTitle: string) => void;
    onCreate: () => void;
    onRefresh?: () => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
    documents,
    selectedDoc,
    vaultId,
    onSelect,
    onDelete,
    onMove,
    onRename,
    onCreate,
    onRefresh,
}) => {
    const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
    const [draggedItem, setDraggedItem] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: AppDocument } | null>(null);
    const [showUpload, setShowUpload] = useState(false);
    const [uploadToFolder, setUploadToFolder] = useState<string | null>(null);

    const buildTree = (items: AppDocument[], parentId: string | null = null): AppDocument[] => {
        if (!Array.isArray(items)) return [];
        return items
            .filter(i => i.parent_id === parentId)
            .map(i => ({
                ...i,
                children: i.is_folder ? buildTree(items, i.id) : []
            }));
    };

    const handleContextMenu = (e: React.MouseEvent, item: AppDocument) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, item });
    };

    const handleRename = (id: string, newTitle: string) => {
        if (onRename) {
            onRename(id, newTitle);
        }
    };

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    const isRootDropTarget = dropTarget === 'root' && draggedItem;

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-white font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    Files
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowUpload(!showUpload)}
                        className={`p-2 rounded-lg transition-all ${
                            showUpload ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-white/10 text-white'
                        }`}
                        title="Upload files"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </button>
                    <button
                        onClick={onCreate}
                        className="p-2 hover:bg-white/10 rounded-lg transition-all"
                        title="Create new file or folder"
                    >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>
            </div>

            {showUpload && (
                <div className="border-b border-white/10">
                    <FileUpload
                        vaultId={vaultId}
                        parentId={uploadToFolder}
                        onUploadComplete={() => {
                            setShowUpload(false);
                            setUploadToFolder(null);
                            if (onRefresh) onRefresh();
                        }}
                    />
                </div>
            )}

            <div className={`flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar transition-all ${
                     isRootDropTarget ? 'bg-blue-500/10 ring-2 ring-blue-500/30 ring-inset' : ''
                 }`}
                 onDragOver={(e) => {
                     e.preventDefault();
                     if (draggedItem) {
                         setDropTarget('root');
                     }
                 }}
                 onDragLeave={() => {
                     if (dropTarget === 'root') {
                         setDropTarget(null);
                     }
                 }}
                 onDrop={(e) => {
                     e.preventDefault();
                     const draggedId = e.dataTransfer.getData('text/plain');
                     if (draggedId && onMove) {
                         onMove(draggedId, null);
                     }
                     setDraggedItem(null);
                     setDropTarget(null);
                 }}
            >
                {buildTree(documents).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-white/60 text-sm mb-2">Нет файлов</p>
                        <p className="text-white/40 text-xs">Нажмите + чтобы создать первый файл</p>
                    </div>
                ) : (
                    buildTree(documents).map(doc => (
                        <FileTreeItem
                            key={doc.id}
                            item={doc}
                            level={0}
                            isOpen={openFolders[doc.id]}
                            onToggle={() => setOpenFolders(p => ({ ...p, [doc.id]: !p[doc.id] }))}
                            onSelect={onSelect}
                            onDelete={onDelete}
                            onMove={onMove}
                            onRename={handleRename}
                            isSelected={selectedDoc?.id === doc.id}
                            openFolders={openFolders}
                            setOpenFolders={setOpenFolders}
                            draggedItem={draggedItem}
                            setDraggedItem={setDraggedItem}
                            dropTarget={dropTarget}
                            setDropTarget={setDropTarget}
                            onContextMenu={handleContextMenu}
                        />
                    ))
                )}
            </div>

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    item={contextMenu.item}
                    onRename={(newTitle) => {
                        handleRename(contextMenu.item.id, newTitle);
                        setContextMenu(null);
                    }}
                    onDelete={() => {
                        onDelete(contextMenu.item.id);
                        setContextMenu(null);
                    }}
                    onUpload={contextMenu.item.is_folder ? () => {
                        setUploadToFolder(contextMenu.item.id);
                        setShowUpload(true);
                        setContextMenu(null);
                    } : undefined}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
};

interface FileTreeItemProps {
    item: AppDocument & { children?: AppDocument[] };
    level: number;
    isOpen: boolean;
    onToggle: () => void;
    onSelect: (doc: AppDocument) => void;
    onDelete: (id: string) => void;
    onMove?: (docId: string, newParentId: string | null) => void;
    onRename?: (id: string, newTitle: string) => void;
    isSelected: boolean;
    openFolders: Record<string, boolean>;
    setOpenFolders: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    draggedItem: string | null;
    setDraggedItem: (id: string | null) => void;
    dropTarget: string | null;
    setDropTarget: (id: string | null) => void;
    onContextMenu: (e: React.MouseEvent, item: AppDocument) => void;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
    item,
    level,
    isOpen,
    onToggle,
    onSelect,
    onDelete,
    onMove,
    onRename,
    isSelected,
    openFolders,
    setOpenFolders,
    draggedItem,
    setDraggedItem,
    dropTarget,
    setDropTarget,
    onContextMenu,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(item.title);
    const itemRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleRename = () => {
        if (editValue.trim() && editValue !== item.title && onRename) {
            onRename(item.id, editValue.trim());
        } else {
            setEditValue(item.title);
        }
        setIsEditing(false);
    };

    const handleDragStart = (e: React.DragEvent) => {
        e.stopPropagation();
        setDraggedItem(item.id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.id);
        
        if (itemRef.current) {
            const ghost = itemRef.current.cloneNode(true) as HTMLElement;
            ghost.style.opacity = '0.5';
            ghost.style.position = 'absolute';
            ghost.style.top = '-1000px';
            document.body.appendChild(ghost);
            e.dataTransfer.setDragImage(ghost, 0, 0);
            setTimeout(() => document.body.removeChild(ghost), 0);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (draggedItem && draggedItem !== item.id && item.is_folder) {
            setDropTarget(item.id);
            e.dataTransfer.dropEffect = 'move';
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (dropTarget === item.id) {
            setDropTarget(null);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const draggedId = e.dataTransfer.getData('text/plain');
        
        if (draggedId && draggedId !== item.id && item.is_folder && onMove) {
            onMove(draggedId, item.id);
        }
        
        setDraggedItem(null);
        setDropTarget(null);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDropTarget(null);
    };

    const isDragging = draggedItem === item.id;
    const isDropTarget = dropTarget === item.id;

    return (
        <div>
            <div
                ref={itemRef}
                draggable
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onClick={() => item.is_folder ? onToggle() : onSelect(item)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onContextMenu={(e) => onContextMenu(e, item)}
                className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all
                    ${isDragging ? 'opacity-40' : ''}
                    ${isDropTarget ? 'bg-blue-500/30 ring-2 ring-blue-500/50' : ''}
                    ${isSelected
                        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 ring-1 ring-purple-500/50 shadow-lg shadow-purple-500/20'
                        : 'hover:bg-white/10 hover:shadow-md'
                    }
                    ${isHovered && !isSelected ? 'translate-x-1' : ''}
                `}
                style={{ paddingLeft: `${12 + level * 20}px` }}
            >
                {item.is_folder && (
                    <svg
                        className={`w-4 h-4 text-white/60 transition-all duration-200 ${isOpen ? 'rotate-90' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                )}
                {!item.is_folder && <span className="w-4" />}

                <FileIcon
                    filename={item.title}
                    isFolder={item.is_folder}
                    isOpen={isOpen}
                    customIcon={item.icon}
                    size={20}
                    className="flex-shrink-0"
                />

                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleRename();
                            } else if (e.key === 'Escape') {
                                setEditValue(item.title);
                                setIsEditing(false);
                            }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-sm text-white outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                ) : (
                    <span 
                        className={`flex-1 truncate text-sm transition-all ${
                            isSelected ? 'text-white font-medium' : 'text-white/80'
                        }`} 
                        title={item.title}
                        onDoubleClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(true);
                        }}
                    >
                        {item.title}
                    </span>
                )}

                {isHovered && (
                    <div className="flex items-center gap-1 animate-fadeIn">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(item.id);
                            }}
                            className="p-1.5 hover:bg-red-500/20 rounded-md transition-all"
                            title="Delete"
                        >
                            <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                )}

                {item.is_folder && item.children && item.children.length > 0 && (
                    <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded-full">
                        {item.children.length}
                    </span>
                )}
            </div>

            {item.is_folder && isOpen && item.children && (
                <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-white/20 to-transparent"
                         style={{ left: `${20 + level * 20}px` }} />
                    {item.children.map(child => (
                        <FileTreeItem
                            key={child.id}
                            item={child}
                            level={level + 1}
                            isOpen={openFolders[child.id] || false}
                            onToggle={() => setOpenFolders(p => ({ ...p, [child.id]: !p[child.id] }))}
                            onSelect={onSelect}
                            onDelete={onDelete}
                            onMove={onMove}
                            onRename={onRename}
                            isSelected={isSelected}
                            openFolders={openFolders}
                            setOpenFolders={setOpenFolders}
                            draggedItem={draggedItem}
                            setDraggedItem={setDraggedItem}
                            dropTarget={dropTarget}
                            setDropTarget={setDropTarget}
                            onContextMenu={onContextMenu}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const ContextMenu: React.FC<{
    x: number;
    y: number;
    item: AppDocument;
    onRename: (newTitle: string) => void;
    onDelete: () => void;
    onUpload?: () => void;
    onClose: () => void;
}> = ({ x, y, item, onRename, onDelete, onUpload, onClose }) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [newTitle, setNewTitle] = useState(item.title);

    if (isRenaming) {
        return (
            <div
                className="context-menu fixed z-50 bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl p-3 min-w-[200px]"
                style={{ left: x, top: y }}
                onClick={(e) => e.stopPropagation()}
            >
                <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTitle.trim()) {
                            onRename(newTitle.trim());
                        } else if (e.key === 'Escape') {
                            onClose();
                        }
                    }}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white outline-none focus:ring-2 focus:ring-purple-500/50"
                    autoFocus
                    onFocus={(e) => e.target.select()}
                />
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={() => newTitle.trim() && onRename(newTitle.trim())}
                        className="flex-1 px-3 py-1.5 text-xs text-purple-400 hover:bg-purple-500/20 rounded-lg transition-colors"
                    >
                        Сохранить
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="context-menu fixed z-50 bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl py-2 min-w-[180px]"
            style={{ left: x, top: y }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="px-3 py-2 border-b border-white/10">
                <p className="text-white/60 text-xs truncate">{item.title}</p>
            </div>
            
            {item.is_folder && onUpload && (
                <button
                    onClick={() => {
                        onUpload();
                        onClose();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Загрузить файлы
                </button>
            )}
            
            <button
                onClick={() => setIsRenaming(true)}
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Переименовать
            </button>
            
            <button
                onClick={onDelete}
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Удалить
            </button>
        </div>
    );
};
