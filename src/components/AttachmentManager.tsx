import React, { useState, useEffect } from 'react';
import { editorApi } from '../services/editorApi';
import { GradientButton } from './ui/Button';

interface AttachmentManagerProps {
    documentId: string;
}

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({ documentId }) => {
    const [attachments, setAttachments] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [showManager, setShowManager] = useState(false);

    useEffect(() => {
        if (showManager) {
            loadAttachments();
        }
    }, [showManager, documentId]);

    const loadAttachments = async () => {
        try {
            const data = await editorApi.getDocumentAttachments(documentId);
            setAttachments(data);
        } catch (error) {
            console.error('Failed to load attachments:', error);
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
                        {attachments.map((attachment) => (
                            <div
                                key={attachment.id}
                                className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                            >
                                <div className="flex-1">
                                    <p className="text-white text-sm">{attachment.filename}</p>
                                    <p className="text-white/60 text-xs">
                                        {formatFileSize(attachment.size_bytes)} • {new Date(attachment.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDownload(attachment.id, attachment.filename)}
                                    className="text-purple-400 hover:text-purple-300 text-sm"
                                >
                                    Download
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
