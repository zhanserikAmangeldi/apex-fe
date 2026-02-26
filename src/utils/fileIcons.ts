import {
  getMaterialFileIcon,
  getMaterialFolderIcon,
} from 'file-extension-icon-js';

export const getFileIcon = (filename: string, customIcon?: string | null): string => {
  if (customIcon) {
    return customIcon;
  }
  return getMaterialFileIcon(filename);
};

export const getFolderIcon = (
  folderName: string,
  isOpen: boolean = false,
  customIcon?: string | null
): string => {
  if (customIcon) {
    return customIcon;
  }
  return getMaterialFolderIcon(folderName, isOpen ? 1 : 0);
};

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

export const isImageFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext || '');
};

export const isVideoFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv'].includes(ext || '');
};

export const isPdfFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext === 'pdf';
};

export const isPreviewableFile = (filename: string): boolean => {
  return isImageFile(filename) || isVideoFile(filename) || isPdfFile(filename);
};

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const getMimeType = (filename: string): string => {
  const ext = getFileExtension(filename);
  
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'video/ogg',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'mkv': 'video/x-matroska',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'md': 'text/markdown',
    'json': 'application/json',
    'xml': 'application/xml',
    'js': 'text/javascript',
    'ts': 'text/typescript',
    'jsx': 'text/jsx',
    'tsx': 'text/tsx',
    'html': 'text/html',
    'css': 'text/css',
    'py': 'text/x-python',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    'tar': 'application/x-tar',
    'gz': 'application/gzip',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
};
