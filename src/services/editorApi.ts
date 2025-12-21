import { api } from './api';
import type {AppDocument, CreateDocumentRequest, CreateVaultRequest, Vault} from "../types/editor.ts";


class EditorApiService {

    async getVaults(): Promise<Vault[]> {
        const response = await fetch('http://localhost:8000/api/editor-service/api/vaults', {
            headers: {
                'Authorization': `Bearer ${api['accessToken']}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch vaults');
        }

        return response.json();
    }

    async getVault(id: string): Promise<Vault> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/vaults/${id}`, {
            headers: {
                'Authorization': `Bearer ${api['accessToken']}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch vault');
        }

        return response.json();
    }

    async createVault(data: CreateVaultRequest): Promise<Vault> {
        const response = await fetch('http://localhost:8000/api/editor-service/api/vaults', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${api['accessToken']}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to create vault');
        }

        return response.json();
    }

    async updateVault(id: string, data: Partial<CreateVaultRequest>): Promise<Vault> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/vaults/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${api['accessToken']}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to update vault');
        }

        return response.json();
    }

    async deleteVault(id: string): Promise<void> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/vaults/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${api['accessToken']}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete vault');
        }
    }

    async getVaultDocuments(vaultId: string): Promise<AppDocument[]> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/vaults/${vaultId}/documents`, {
            headers: {
                'Authorization': `Bearer ${api['accessToken']}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch documents');
        }

        return response.json();
    }

    async createDocument(vaultId: string, data: CreateDocumentRequest): Promise<AppDocument> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/vaults/${vaultId}/documents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${api['accessToken']}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to create document');
        }

        return response.json();
    }

    async updateDocument(id: string, data: { title?: string }): Promise<AppDocument> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/documents/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${api['accessToken']}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to update document');
        }

        return response.json();
    }

    async deleteDocument(id: string): Promise<void> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/documents/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${api['accessToken']}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete document');
        }
    }

    async moveDocument(id: string, parentId: string | null): Promise<AppDocument> {
        const response = await fetch(`http://localhost:8000/api/editor-service/api/documents/${id}/move`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${api['accessToken']}`,
            },
            body: JSON.stringify({ parent_id: parentId }),
        });

        if (!response.ok) {
            throw new Error('Failed to move document');
        }

        return response.json();
    }
}

export const editorApi = new EditorApiService();
