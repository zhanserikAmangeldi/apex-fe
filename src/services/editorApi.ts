import { httpClient, rawRequest, getAccessToken } from './httpClient';
import type { AppDocument, CreateDocumentRequest, CreateVaultRequest, Vault } from '../types/editor';

const EDITOR_BASE = 'editor-service/api/v1';

class EditorApiService {
    async getVaults(): Promise<Vault[]> {
        const data = await httpClient.get<any>(`${EDITOR_BASE}/vaults`);
        return data.vaults || data;
    }

    async getSharedVaults(): Promise<Vault[]> {
        const data = await httpClient.get<any>(`${EDITOR_BASE}/vaults/shared`);
        return data.vaults || data;
    }

    async getVault(id: string): Promise<Vault> {
        return httpClient.get<Vault>(`${EDITOR_BASE}/vaults/${id}`);
    }

    async createVault(data: CreateVaultRequest): Promise<Vault> {
        return httpClient.post<Vault>(`${EDITOR_BASE}/vaults`, data);
    }

    async updateVault(id: string, data: Partial<CreateVaultRequest>): Promise<Vault> {
        return httpClient.patch<Vault>(`${EDITOR_BASE}/vaults/${id}`, data);
    }

    async deleteVault(id: string): Promise<void> {
        await httpClient.delete(`${EDITOR_BASE}/vaults/${id}`);
    }

    async shareVault(id: string, emailOrUserId: string, permission: 'read' | 'write' | 'admin'): Promise<any> {
        const isEmail = emailOrUserId.includes('@');
        const body = isEmail
            ? { email: emailOrUserId, permission }
            : { userId: emailOrUserId, permission };
        return httpClient.post<any>(`${EDITOR_BASE}/vaults/${id}/share`, body);
    }

    async shareDocument(id: string, emailOrUserId: string, permission: 'read' | 'write' | 'admin'): Promise<any> {
        const isEmail = emailOrUserId.includes('@');
        const body = isEmail
            ? { email: emailOrUserId, permission }
            : { userId: emailOrUserId, permission };
        return httpClient.post<any>(`${EDITOR_BASE}/documents/${id}/share`, body);
    }

    async getDocumentCollaborators(id: string): Promise<any[]> {
        return httpClient.get<any[]>(`${EDITOR_BASE}/documents/${id}/collaborators`);
    }

    async getVaultCollaborators(id: string): Promise<any[]> {
        return httpClient.get<any[]>(`${EDITOR_BASE}/vaults/${id}/collaborators`);
    }

    async updateDocumentPermission(documentId: string, userId: string, permission: 'read' | 'write' | 'admin'): Promise<any> {
        return httpClient.patch<any>(`${EDITOR_BASE}/documents/${documentId}/share/${userId}`, { permission });
    }

    async removeDocumentAccess(documentId: string, userId: string): Promise<void> {
        await httpClient.delete(`${EDITOR_BASE}/documents/${documentId}/share/${userId}`);
    }

    async updateVaultPermission(vaultId: string, userId: string, permission: 'read' | 'write' | 'admin'): Promise<any> {
        return httpClient.patch<any>(`${EDITOR_BASE}/vaults/${vaultId}/share/${userId}`, { permission });
    }

    async removeVaultAccess(vaultId: string, userId: string): Promise<void> {
        await httpClient.delete(`${EDITOR_BASE}/vaults/${vaultId}/share/${userId}`);
    }

    async getAllDocuments(): Promise<AppDocument[]> {
        const data = await httpClient.get<any>(`${EDITOR_BASE}/documents`);
        return data.documents || data;
    }

    async getSharedDocuments(): Promise<AppDocument[]> {
        const data = await httpClient.get<any>(`${EDITOR_BASE}/documents/shared`);
        return data.documents || data;
    }

    async getDocument(id: string): Promise<AppDocument> {
        return httpClient.get<AppDocument>(`${EDITOR_BASE}/documents/${id}`);
    }

    async initiateAttachmentUpload(documentId: string, filename: string, mimeType: string, size: number): Promise<{ attachmentId: string; uploadUrl: string }> {
        return httpClient.post<{ attachmentId: string; uploadUrl: string }>(`${EDITOR_BASE}/attachments/initiate`, {
            documentId, filename, mimeType, size,
        });
    }

    async uploadAttachment(uploadUrl: string, file: File): Promise<void> {
        const fullUrl = uploadUrl.startsWith('http') ? uploadUrl : `http://localhost:8000${uploadUrl}`;
        const token = getAccessToken();
        const response = await fetch(fullUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': file.type,
            },
            body: file,
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to upload file');
        }
    }

    async getAttachment(id: string): Promise<any> {
        return httpClient.get<any>(`${EDITOR_BASE}/attachments/${id}`);
    }

    async getDocumentAttachments(documentId: string): Promise<any[]> {
        const data = await httpClient.get<any>(`${EDITOR_BASE}/documents/${documentId}/attachments`);
        return data.attachments || [];
    }

    async getHealth(): Promise<any> {
        return httpClient.get<any>('editor-service/health', { skipAuth: true });
    }

    async getVaultDocuments(vaultId: string): Promise<AppDocument[]> {
        const data = await httpClient.get<any>(`${EDITOR_BASE}/vaults/${vaultId}/documents`);
        return data.documents || data;
    }

    async createDocument(vaultId: string, data: CreateDocumentRequest): Promise<AppDocument> {
        return httpClient.post<AppDocument>(`${EDITOR_BASE}/vaults/${vaultId}/documents`, {
            title: data.title,
            parentId: data.parent_id || null,
            isFolder: data.is_folder || false,
            icon: data.icon || null,
        });
    }

    async updateDocument(id: string, data: { title?: string; icon?: string }): Promise<AppDocument> {
        return httpClient.patch<AppDocument>(`${EDITOR_BASE}/documents/${id}`, data);
    }

    async deleteDocument(id: string): Promise<void> {
        await httpClient.delete(`${EDITOR_BASE}/documents/${id}`);
    }

    async moveDocument(id: string, parentId: string | null): Promise<AppDocument> {
        return httpClient.post<AppDocument>(`${EDITOR_BASE}/documents/${id}/move`, { parentId });
    }

    // Tags
    async getVaultTags(vaultId: string): Promise<any[]> {
        return httpClient.get<any[]>(`${EDITOR_BASE}/vaults/${vaultId}/tags`);
    }

    async createTag(vaultId: string, name: string, color?: string): Promise<any> {
        return httpClient.post<any>(`${EDITOR_BASE}/vaults/${vaultId}/tags`, { name, color });
    }

    async updateTag(tagId: string, name: string, color: string): Promise<any> {
        return httpClient.put<any>(`${EDITOR_BASE}/tags/${tagId}`, { name, color });
    }

    async deleteTag(tagId: string): Promise<void> {
        await httpClient.delete(`${EDITOR_BASE}/tags/${tagId}`);
    }

    async getDocumentTags(documentId: string): Promise<any[]> {
        return httpClient.get<any[]>(`${EDITOR_BASE}/documents/${documentId}/tags`);
    }

    async addTagToDocument(documentId: string, tagId: string): Promise<void> {
        await httpClient.post(`${EDITOR_BASE}/documents/${documentId}/tags/${tagId}`);
    }

    async removeTagFromDocument(documentId: string, tagId: string): Promise<void> {
        await httpClient.delete(`${EDITOR_BASE}/documents/${documentId}/tags/${tagId}`);
    }

    // Search
    async searchDocuments(query: string, vaultId?: string, limit: number = 10): Promise<AppDocument[]> {
        const params = new URLSearchParams({ query, limit: limit.toString() });
        if (vaultId) params.append('vaultId', vaultId);
        const data = await httpClient.get<any>(`${EDITOR_BASE}/search/documents?${params}`);
        return data.documents || [];
    }

    // Graph
    async getVaultGraph(vaultId: string): Promise<any> {
        const t = Date.now();
        return httpClient.get<any>(`${EDITOR_BASE}/vaults/${vaultId}/graph?t=${t}`);
    }
}

export const editorApi = new EditorApiService();
