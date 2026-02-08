import React from 'react';
import { getDocumentIcon } from '../../utils/fileIcons';

interface FileIconProps {
  filename: string;
  isFolder?: boolean;
  isOpen?: boolean;
  customIcon?: string | null;
  size?: number;
  className?: string;
}

/**
 * FileIcon component - displays VS Code Material Theme icons for files and folders
 * Uses file-extension-icon-js library for professional icon rendering
 */
export const FileIcon: React.FC<FileIconProps> = ({
  filename,
  isFolder = false,
  isOpen = false,
  customIcon,
  size = 20,
  className = '',
}) => {
  const iconUrl = getDocumentIcon(filename, isFolder, isOpen, customIcon);

  // If it's a custom emoji/text icon, render as text
  if (customIcon && !customIcon.startsWith('http') && !customIcon.startsWith('/')) {
    return (
      <span
        className={`inline-flex items-center justify-center ${className}`}
        style={{ fontSize: size }}
      >
        {customIcon}
      </span>
    );
  }

  // Otherwise render as image
  return (
    <img
      src={iconUrl}
      alt={`${filename} icon`}
      width={size}
      height={size}
      className={`inline-block ${className}`}
      style={{ minWidth: size, minHeight: size }}
      onError={(e) => {
        // Fallback to emoji if icon fails to load
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        const fallback = document.createElement('span');
        fallback.textContent = isFolder ? '📁' : '📄';
        fallback.style.fontSize = `${size}px`;
        target.parentNode?.insertBefore(fallback, target);
      }}
    />
  );
};

export default FileIcon;
