import React, { useState, useEffect } from 'react';
import { editorApi } from '../services/editorApi';
import { GradientButton } from './ui/Button';
import { FilePreviewModal } from './FilePreviewModal';
import { FileIcon } from './ui/FileIcon';
import { isPreviewableFile, getMimeType } from '../utils/fileIcons';

interface AttachmentManagerProps {
    documentId: string;
}

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({ documentId }) => {
    const [attachments, setAttachments] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [showManager, setShowManager] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ url: string; filename: string; mimeType: string } | null>(null);

    useEffect(() => {
        if (showManager) {
            loadAttachments();
        }
    }, [showManager, documentId]);

    const loadAttachments = async () => {
        try {
            const data = await editorApi.getDocumentAttachments(documentId);
            setAttachments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load attachments:', error);
            setAttachments([]);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const { attachmentId, uploadUrl } = await editorApi.initiateAttachmentUpload(
                documentId,
                file.name,
                file.type,
                file.size
            );

            await editorApi.uploadAttachment(uploadUrl, file);
            
            alert('File uploaded successfully!');
            await loadAttachments();
        } catch (error) {
            console.error('Failed to upload file:', error);
            alert('Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (attachmentId: string, filename: string) => {
        try {
            const { downloadUrl } = await editorApi.getAttachment(attachmentId);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            link.click();
        } catch (error) {
            console.error('Failed to download attachment:', error);
            alert('Failed to download attachment');
        }
    };

    const handlePreview = async (attachmentId: string, filename: string) => {
        try {
            const { downloadUrl } = await editorApi.getAttachment(attachmentId);
            const token = localStorage.getItem('access_token');
            const urlWithToken = `${downloadUrl}?token=${encodeURIComponent(token || '')}`;
            
            setPreviewFile({
                url: urlWithToken,
                filename,
                mimeType: getMimeType(filename)
            });
        } catch (error) {
            console.error('Failed to preview attachment:', error);
            alert('Failed to preview attachment');
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="border-t border-white/10 pt-4">
            <button
                onClick={() => setShowManager(!showManager)}
                className="text-white/80 hover:text-white text-sm flex items-center gap-2"
            >
                📎 Attachments ({attachments.length})
            </button>

            {showManager && (
                <div className="mt-4 space-y-4">
                    <div>
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                            <GradientButton disabled={uploading}>
                                {uploading ? 'Uploading...' : 'Upload File'}
                            </GradientButton>
                        </label>
                    </div>

                    <div className="space-y-2">
                        {attachments.length === 0 ? (
                            <p className="text-white/40 text-sm text-center py-4">
                                No attachments yet
                            </p>
                        ) : (
                            attachments.map((attachment) => {
                                const canPreview = isPreviewableFile(attachment.filename);
                                
                                return (
                                    <div
                                        key={attachment.id}
                                        className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
                                    >
                                        <FileIcon 
                                            filename={attachment.filename}
                                            size={24}
                                            className="flex-shrink-0"
                                        />
                                        
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm truncate">{attachment.filename}</p>
                                            <p className="text-white/60 text-xs">
                                                {formatFileSize(attachment.size_bytes)} • {new Date(attachment.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {canPreview && (
                                                <button
                                                    onClick={() => handlePreview(attachment.id, attachment.filename)}
                                                    className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                                                    title="Preview"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                            )}
                                            
                                            <button
                                                onClick={() => handleDownload(attachment.id, attachment.filename)}
                                                className="p-2 text-purple-400 hover:bg-purple-500/20 rounded-lg transition-colors"
                                                title="Download"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewFile && (
                <FilePreviewModal
                    isOpen={true}
                    onClose={() => setPreviewFile(null)}
                    fileUrl={previewFile.url}
                    filename={previewFile.filename}
                    mimeType={previewFile.mimeType}
                />
            )}
        </div>
    );
};
