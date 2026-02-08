/**
 * File and folder icon utilities using VS Code Material Icon Theme
 * Uses file-extension-icon-js for professional VS Code-like icons
 */

import {
  getMaterialFileIcon,
  getMaterialFolderIcon,
} from 'file-extension-icon-js';

/**
 * Get file icon URL based on filename
 * @param filename - Name of the file (e.g., "index.tsx", "README.md")
 * @param customIcon - Optional custom icon emoji/string
 * @returns URL to the icon image
 */
export const getFileIcon = (filename: string, customIcon?: string | null): string => {
  // If custom icon is set, return it (for user-customized icons)
  if (customIcon) {
    return customIcon;
  }

  // Get Material Design icon from file-extension-icon-js
  return getMaterialFileIcon(filename);
};

/**
 * Get folder icon URL based on folder name and state
 * @param folderName - Name of the folder
 * @param isOpen - Whether the folder is expanded (1) or collapsed (0)
 * @param customIcon - Optional custom icon emoji/string
 * @returns URL to the icon image
 */
export const getFolderIcon = (
  folderName: string,
  isOpen: boolean = false,
  customIcon?: string | null
): string => {
  // If custom icon is set, return it
  if (customIcon) {
    return customIcon;
  }

  // Get Material Design folder icon
  // Second parameter: 1 = open, 0 = closed
  return getMaterialFolderIcon(folderName, isOpen ? 1 : 0);
};

/**
 * Get icon for a document/file item
 * Handles both files and folders
 */
export const getDocumentIcon = (
  title: string,
  isFolder: boolean,
  isOpen: boolean = false,
  customIcon?: string | null
): string => {
  if (isFolder) {
    return getFolderIcon(title, isOpen, customIcon);
  }
  return getFileIcon(title, customIcon);
};

/**
 * Check if a file is an image based on extension
 */
export const isImageFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext || '');
};

/**
 * Check if a file is a video based on extension
 */
export const isVideoFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv'].includes(ext || '');
};

/**
 * Check if a file is a PDF
 */
export const isPdfFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext === 'pdf';
};

/**
 * Check if a file can be previewed (image, video, or PDF)
 */
export const isPreviewableFile = (filename: string): boolean => {
  return isImageFile(filename) || isVideoFile(filename) || isPdfFile(filename);
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Get MIME type from filename
 */
export const getMimeType = (filename: string): string => {
  const ext = getFileExtension(filename);
  
  const mimeTypes: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon',
    
    // Videos
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'video/ogg',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'mkv': 'video/x-matroska',
    
    // Documents
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'md': 'text/markdown',
    'json': 'application/json',
    'xml': 'application/xml',
    
    // Code
    'js': 'text/javascript',
    'ts': 'text/typescript',
    'jsx': 'text/jsx',
    'tsx': 'text/tsx',
    'html': 'text/html',
    'css': 'text/css',
    'py': 'text/x-python',
    
    // Archives
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    'tar': 'application/x-tar',
    'gz': 'application/gzip',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
};
