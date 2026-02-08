export const getFileIcon = (filename: string, isFolder: boolean): string => {
    if (isFolder) return '📁';
    
    const ext = filename.split('.').pop()?.toLowerCase();
    
    const iconMap: Record<string, string> = {
        // Documents
        'txt': '📝',
        'doc': '📄',
        'docx': '📄',
        'pdf': '📕',
        'md': '📋',
        
        // Code
        'js': '📜',
        'ts': '📘',
        'jsx': '⚛️',
        'tsx': '⚛️',
        'py': '🐍',
        'java': '☕',
        'cpp': '⚙️',
        'c': '⚙️',
        'go': '🔷',
        'rs': '🦀',
        'php': '🐘',
        'rb': '💎',
        
        // Web
        'html': '🌐',
        'css': '🎨',
        'scss': '🎨',
        'json': '📊',
        'xml': '📋',
        
        // Images
        'jpg': '🖼️',
        'jpeg': '🖼️',
        'png': '🖼️',
        'gif': '🎞️',
        'svg': '🎨',
        'ico': '🎯',
        
        // Media
        'mp4': '🎬',
        'avi': '🎬',
        'mov': '🎬',
        'mp3': '🎵',
        'wav': '🎵',
        
        // Archives
        'zip': '📦',
        'rar': '📦',
        'tar': '📦',
        'gz': '📦',
        
        // Config
        'env': '⚙️',
        'config': '⚙️',
        'yml': '⚙️',
        'yaml': '⚙️',
        'toml': '⚙️',
    };
    
    return iconMap[ext || ''] || '📄';
};

export const getFolderIcon = (isOpen: boolean): string => {
    return isOpen ? '📂' : '📁';
};
