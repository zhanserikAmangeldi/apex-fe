export interface Vault {
    id: string;
    owner_id: number;
    name: string;
    description?: string;
    icon: string;
    color: string;
    document_count?: number;
    user_permission?: 'owner' | 'read' | 'write' | 'admin' | 'none';
    owner_username?: string;
    owner_email?: string;
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
    snapshot_size_bytes?: number | null;
    snapshot_storage?: string | null;
    last_snapshot_at?: string | null;
    user_permission?: 'owner' | 'read' | 'write' | 'admin' | 'none';
    owner_username?: string;
    owner_email?: string;
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

export interface Attachment {
    id: string;
    document_id: string;
    owner_id: number;
    filename: string;
    mime_type: string;
    size_bytes: number;
    minio_path: string;
    created_at: string;
    is_deleted: boolean;
}

export interface Collaborator {
    user_id: number;
    permission: 'read' | 'write' | 'admin';
    created_at: string;
}

export interface Session {
    id: string;
    user_id: number;
    refresh_token: string;
    user_agent?: string;
    ip_address?: string;
    created_at: string;
    expires_at: string;
}

export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    checks: {
        database?: { status: string; error?: string };
        redis?: { status: string; error?: string };
        minio?: { status: string; error?: string };
        authService?: { status: string; url?: string; error?: string };
        snapshotWorker?: { status: string; error?: string };
    };
}

export interface Tag {
    id: string;
    name: string;
    color: string;
    vault_id: string;
    created_at: string;
    updated_at: string;
}

export interface CreateTagRequest {
    name: string;
    color?: string;
}
