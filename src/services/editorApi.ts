import { api } from './api';
import type {AppDocument, CreateDocumentRequest, CreateVaultRequest, Vault} from "../types/editor.ts";


class EditorApiService {
    private getAuthToken(): string | null {
        return api.getAccessToken() || localStorage.getItem('access_token');
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        // Handle 401 Unauthorized - token expired, try to refresh
        if (response.status === 401) {
            console.log('Token expired in editorApi, attempting to refresh...');
            
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    // Try to refresh the token
                    const authResponse = await api.refreshToken(refreshToken);
                    localStorage.setItem('access_token', authResponse.access_token);
                    localStorage.setItem('refresh_token', authResponse.refresh_token);
                    api.setAccessToken(authResponse.access_token);
                    
                    // Token refreshed, but we can't retry here - let the caller retry
                    throw new Error('TOKEN_REFRESHED');
                } catch (error) {
                    console.error('Failed to refresh token in editorApi:', error);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    api.setAccessToken(null);
                    window.location.href = '/login';
                    throw new Error('Unauthorized');
                }
            } else {
                localStorage.removeItem('access_token');
                api.setAccessToken(null);
                window.location.href = '/login';
                throw new Error('Unauthorized');
            }
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Request failed with status ${response.status}`);
        }

        return response.json();
    }

    async getVaults(): Promise<Vault[]> {
        const response = await fetch('http://localhost:8000/api/editor-service/api/v1/vaults', {
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
        });

        const data = await this.handleResponse<any>(response);
        return data.vaults || data;
    }

    async getSharedVaults(): Promise<Vault[]> {
        const response = await fetch('http://localhost:8000/api/editor-service/api/v1/vaults/shared', {
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
        });

        const data = await this.handleResponse<any>(response);
        return data.vaults || data;
    }

    async getVault(id: string): Promise<Vault> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/vaults/${id}`, {
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
        });

        return this.handleResponse<Vault>(response);
    }

    async createVault(data: CreateVaultRequest): Promise<Vault> {
        const response = await fetch('http://localhost:8000/api/editor-service/api/v1/vaults', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
            body: JSON.stringify(data),
        });

        return this.handleResponse<Vault>(response);
    }

    async updateVault(id: string, data: Partial<CreateVaultRequest>): Promise<Vault> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/vaults/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
            body: JSON.stringify(data),
        });

        return this.handleResponse<Vault>(response);
    }

    async deleteVault(id: string): Promise<void> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/vaults/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
        });

        await this.handleResponse<void>(response);
    }

    async shareVault(id: string, emailOrUserId: string, permission: 'read' | 'write' | 'admin'): Promise<any> {
        const isEmail = emailOrUserId.includes('@');
        const body = isEmail 
            ? { email: emailOrUserId, permission }
            : { userId: emailOrUserId, permission };

        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/vaults/${id}/share`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
            body: JSON.stringify(body),
        });

        return this.handleResponse<any>(response);
    }

    async shareDocument(id: string, emailOrUserId: string, permission: 'read' | 'write' | 'admin'): Promise<any> {
        const isEmail = emailOrUserId.includes('@');
        const body = isEmail 
            ? { email: emailOrUserId, permission }
            : { userId: emailOrUserId, permission };

        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/documents/${id}/share`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
            body: JSON.stringify(body),
        });

        return this.handleResponse<any>(response);
    }

    async getDocumentCollaborators(id: string): Promise<any[]> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/documents/${id}/collaborators`, {
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
        });

        return this.handleResponse<any[]>(response);
    }

    async getVaultCollaborators(id: string): Promise<any[]> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/vaults/${id}/collaborators`, {
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
        });

        return this.handleResponse<any[]>(response);
    }

    async updateDocumentPermission(documentId: string, userId: string, permission: 'read' | 'write' | 'admin'): Promise<any> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/documents/${documentId}/share/${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
            body: JSON.stringify({ permission }),
        });

        if (!response.ok) {
            throw new Error('Failed to update permission');
        }

        return response.json();
    }

    async removeDocumentAccess(documentId: string, userId: string): Promise<void> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/documents/${documentId}/share/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to remove access');
        }
    }

    async updateVaultPermission(vaultId: string, userId: string, permission: 'read' | 'write' | 'admin'): Promise<any> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/vaults/${vaultId}/share/${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
            body: JSON.stringify({ permission }),
        });

        if (!response.ok) {
            throw new Error('Failed to update permission');
        }

        return response.json();
    }

    async removeVaultAccess(vaultId: string, userId: string): Promise<void> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/vaults/${vaultId}/share/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to remove access');
        }
    }

    async getAllDocuments(): Promise<AppDocument[]> {
        const response = await fetch('http://localhost:8000/api/editor-service/api/v1/documents', {
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch documents');
        }

        const data = await response.json();
        return data.documents || data;
    }

    async getSharedDocuments(): Promise<AppDocument[]> {
        const response = await fetch('http://localhost:8000/api/editor-service/api/v1/documents/shared', {
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch shared documents');
        }

        const data = await response.json();
        return data.documents || data;
    }

    async getDocument(id: string): Promise<AppDocument> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/documents/${id}`, {
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch document');
        }

        return response.json();
    }

    async initiateAttachmentUpload(documentId: string, filename: string, mimeType: string, size: number): Promise<{ attachmentId: string; uploadUrl: string }> {
        const response = await fetch('http://localhost:8000/api/editor-service/api/v1/attachments/initiate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
            body: JSON.stringify({ 
                documentId, 
                filename, 
                mimeType, 
                size 
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Initiate upload error:', errorData);
            throw new Error(errorData.message || 'Failed to initiate upload');
        }

        return response.json();
    }

    async uploadAttachment(uploadUrl: string, file: File): Promise<void> {
        // If URL is relative, make it absolute through the gateway
        const fullUrl = uploadUrl.startsWith('http') 
            ? uploadUrl 
            : `http://localhost:8000${uploadUrl}`;

        const response = await fetch(fullUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
                'Content-Type': file.type,
            },
            body: file,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Upload failed:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData
            });
            throw new Error(errorData.message || 'Failed to upload file');
        }
    }

    async getAttachment(id: string): Promise<any> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/attachments/${id}`, {
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch attachment');
        }

        return response.json();
    }

    async getDocumentAttachments(documentId: string): Promise<any[]> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/documents/${documentId}/attachments`, {
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch attachments');
        }

        const data = await response.json();
        return data.attachments || [];
    }

    async getHealth(): Promise<any> {
        const response = await fetch('http://localhost:8000/api/editor-service/health');

        if (!response.ok) {
            throw new Error('Failed to fetch health status');
        }

        return response.json();
    }

    async getVaultDocuments(vaultId: string): Promise<AppDocument[]> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/vaults/${vaultId}/documents`, {
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch documents');
        }

        const data = await response.json();
        return data.documents || data;
    }

    async createDocument(vaultId: string, data: CreateDocumentRequest): Promise<AppDocument> {
        // Конвертируем snake_case в camelCase для бэкенда
        const requestBody = {
            title: data.title,
            parentId: data.parent_id || null,
            isFolder: data.is_folder || false,
            icon: data.icon || null,
        };

        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/vaults/${vaultId}/documents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to create document');
        }

        return response.json();
    }

    async updateDocument(id: string, data: { title?: string; icon?: string }): Promise<AppDocument> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/documents/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to update document');
        }

        return response.json();
    }

    async deleteDocument(id: string): Promise<void> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/documents/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to delete document');
        }
    }

    async moveDocument(id: string, parentId: string | null): Promise<AppDocument> {
        // Конвертируем snake_case в camelCase для бэкенда
        const requestBody = {
            parentId: parentId,
        };

        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/documents/${id}/move`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to move document');
        }

        return response.json();
    }

    // Tag Management
    async getVaultTags(vaultId: string): Promise<any[]> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/vaults/${vaultId}/tags`, {
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch tags');
        }

        return response.json();
    }

    async createTag(vaultId: string, name: string, color?: string): Promise<any> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/vaults/${vaultId}/tags`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
            body: JSON.stringify({ name, color }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to create tag');
        }

        return response.json();
    }

    async updateTag(tagId: string, name: string, color: string): Promise<any> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/tags/${tagId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
            body: JSON.stringify({ name, color }),
        });

        if (!response.ok) {
            throw new Error('Failed to update tag');
        }

        return response.json();
    }

    async deleteTag(tagId: string): Promise<void> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/tags/${tagId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete tag');
        }
    }

    async getDocumentTags(documentId: string): Promise<any[]> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/documents/${documentId}/tags`, {
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch document tags');
        }

        return response.json();
    }

    async addTagToDocument(documentId: string, tagId: string): Promise<void> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/documents/${documentId}/tags/${tagId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to add tag to document');
        }
    }

    async removeTagFromDocument(documentId: string, tagId: string): Promise<void> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/documents/${documentId}/tags/${tagId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to remove tag from document');
        }
    }

    // Document Search
    async searchDocuments(query: string, vaultId?: string, limit: number = 10): Promise<AppDocument[]> {
        const params = new URLSearchParams();
        params.append('query', query);
        params.append('limit', limit.toString());
        
        if (vaultId) {
            params.append('vaultId', vaultId);
        }

        const url = `http://localhost:8000/api/editor-service/api/v1/search/documents?${params.toString()}`;
        console.log('EditorAPI: Searching documents', { url, query, vaultId, token: this.getAuthToken()?.substring(0, 20) + '...' });

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
        });

        console.log('EditorAPI: Search response', { status: response.status, ok: response.ok });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('EditorAPI: Search failed', { status: response.status, error: errorText });
            throw new Error('Failed to search documents');
        }

        const data = await response.json();
        console.log('EditorAPI: Search result', data);
        return data.documents || [];
    }

    // Graph View
    async getVaultGraph(vaultId: string): Promise<any> {
        // Add timestamp to bypass cache
        const timestamp = Date.now();
        const response = await fetch(`http://localhost:8000/api/editor-service/api/v1/vaults/${vaultId}/graph?t=${timestamp}`, {
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch graph data');
        }

        return response.json();
    }
}

export const editorApi = new EditorApiService();
