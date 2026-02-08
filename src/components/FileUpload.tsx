import React, { useState, useRef } from 'react';
import { editorApi } from '../services/editorApi';

interface FileUploadProps {
    vaultId: string;
    parentId?: string | null;
    onUploadComplete?: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ vaultId, parentId, onUploadComplete }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        await uploadFiles(files);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        await uploadFiles(files);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const uploadFiles = async (files: File[]) => {
        if (files.length === 0) return;

        setUploading(true);
        const newProgress: { [key: string]: number } = {};
        files.forEach(file => {
            newProgress[file.name] = 0;
        });
        setUploadProgress(newProgress);

        const errors: string[] = [];

        try {
            for (const file of files) {
                try {
                    await uploadSingleFile(file);
                } catch (error) {
                    errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            
            if (errors.length > 0) {
                alert(`Some files failed to upload:\n${errors.join('\n')}`);
            }
            
            if (onUploadComplete && errors.length < files.length) {
                onUploadComplete();
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload files');
        } finally {
            setUploading(false);
            setUploadProgress({});
        }
    };

    const uploadSingleFile = async (file: File) => {
        try {
            // Create document for the file
            const document = await editorApi.createDocument(vaultId, {
                title: file.name,
                parent_id: parentId || null,
                is_folder: false,
            });

            // Update progress
            setUploadProgress(prev => ({ ...prev, [file.name]: 30 }));

            // Upload file as attachment
            console.log('Uploading file:', {
                name: file.name,
                type: file.type,
                size: file.size,
                documentId: document.id
            });

            const { uploadUrl } = await editorApi.initiateAttachmentUpload(
                document.id,
                file.name,
                file.type || 'application/octet-stream', // Fallback MIME type
                file.size
            );

            setUploadProgress(prev => ({ ...prev, [file.name]: 60 }));

            await editorApi.uploadAttachment(uploadUrl, file);

            // Update progress
            setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error);
            throw error;
        }
    };

    return (
        <div className="p-4">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
                    isDragging
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
                />

                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>

                    {uploading ? (
                        <div className="space-y-3">
                            <p className="text-white font-medium">Uploading files...</p>
                            {Object.entries(uploadProgress).map(([filename, progress]) => (
                                <div key={filename} className="space-y-1">
                                    <div className="flex justify-between text-xs text-white/60">
                                        <span className="truncate max-w-[200px]">{filename}</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            <p className="text-white font-medium mb-2">
                                {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                            </p>
                            <p className="text-white/60 text-sm mb-4">or</p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                            >
                                Browse Files
                            </button>
                            <p className="text-white/40 text-xs mt-4">
                                Supports all file types • Max 100MB per file
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
