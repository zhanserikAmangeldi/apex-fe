import React, { useState, useEffect } from 'react';
import { isImageFile, isVideoFile, isPdfFile } from '../utils/fileIcons';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  filename: string;
  mimeType?: string;
}

/**
 * FilePreviewModal - Universal file preview component
 * Supports: Images (jpg, png, gif, svg, webp), Videos (mp4, webm, ogg), PDFs
 */
export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  filename,
  mimeType,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
      setZoom(100);
      document.body.style.overflow = 'hidden';
      
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEsc);
      
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEsc);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download file');
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleZoomReset = () => setZoom(100);

  const renderPreview = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white/60">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg">{error}</p>
        </div>
      );
    }

    if (isImageFile(filename)) {
      return (
        <div className="flex items-center justify-center h-full overflow-auto p-8">
          <img
            src={fileUrl}
            alt={filename}
            style={{ 
              transform: `scale(${zoom / 100})`,
              transition: 'transform 0.2s ease-in-out',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError('Failed to load image');
            }}
            className="rounded-lg shadow-2xl"
          />
        </div>
      );
    }

    if (isVideoFile(filename)) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <video
            src={fileUrl}
            controls
            autoPlay={false}
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            style={{ 
              transform: `scale(${zoom / 100})`,
              transition: 'transform 0.2s ease-in-out'
            }}
            onLoadedData={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError('Failed to load video');
            }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (isPdfFile(filename)) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <iframe
            src={fileUrl}
            title={filename}
            className="w-full h-full rounded-lg shadow-2xl bg-white"
            style={{ 
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease-in-out'
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError('Failed to load PDF');
            }}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-white/60">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-lg mb-2">Preview not available</p>
        <p className="text-sm text-white/40">This file type cannot be previewed</p>
        <button
          onClick={handleDownload}
          className="mt-4 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
        >
          Download to view
        </button>
      </div>
    );
  };

  const showZoomControls = isImageFile(filename) || isPdfFile(filename);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div 
        className="relative w-full h-full max-w-7xl max-h-screen flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-black/50 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <svg className="w-5 h-5 text-white/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <h2 className="text-white font-medium truncate">{filename}</h2>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 ml-4">
            {showZoomControls && (
              <>
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 25}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Zoom out"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                  </svg>
                </button>
                
                <span className="text-white/60 text-sm min-w-[60px] text-center">
                  {zoom}%
                </span>
                
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 300}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Zoom in"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                </button>
                
                <button
                  onClick={handleZoomReset}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Reset zoom"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>

                <div className="w-px h-6 bg-white/10 mx-2" />
              </>
            )}

            <button
              onClick={handleDownload}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Download"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-black/50 to-black/30">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <p className="text-white/60 text-sm">Loading preview...</p>
              </div>
            </div>
          )}
          {renderPreview()}
        </div>

        {/* Footer with file info */}
        <div className="px-6 py-3 bg-black/50 backdrop-blur-xl border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>Press ESC to close</span>
            <span className="capitalize">{mimeType || 'Unknown type'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
