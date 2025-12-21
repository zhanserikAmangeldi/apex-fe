export interface Vault {
    id: string;
    owner_id: number;
    name: string;
    description?: string;
    icon: string;
    color: string;
    document_count?: number;
    created_at: string;
    updated_at: string;
}

export interface AppDocument {
    id: string;
    vault_id: string;
    parent_id: string | null;
    owner_id: number;
    title: string;
    is_folder: boolean;
    icon?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateVaultRequest {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
}

export interface CreateDocumentRequest {
    title: string;
    parent_id?: string | null;
    is_folder?: boolean;
    icon?: string;
}
