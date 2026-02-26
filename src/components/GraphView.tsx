import { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
    type Node,
    type Edge,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    MarkerType,
    Panel,
    MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { editorApi } from '../services/editorApi';
import { aiApi } from '../services/aiApi';
import type { TopicCluster } from '../services/aiApi';
import './GraphView.css';

interface GraphViewProps {
    vaultId: string;
    onNodeClick?: (documentId: string) => void;
    onClose?: () => void;
}

interface GraphNode {
    id: string;
    title: string;
    icon: string;
    isFolder: boolean;
    parentId: string | null;
    tags: Array<{ id: string; name: string; color: string }>;
}

interface GraphEdge {
    id: string;
    source: string;
    target: string;
    type: 'hierarchy' | 'document-link' | 'tag' | 'connection';
    tagId?: string;
    connectionType?: string;
    description?: string;
}

interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
    stats: {
        totalNodes: number;
        totalEdges: number;
        hierarchyEdges: number;
        documentLinkEdges: number;
        tagEdges: number;
        connectionEdges: number;
    };
}

const edgeTypes = {
    hierarchy: { color: '#94a3b8', strokeWidth: 2, style: 'solid' },
    'document-link': { color: '#8b5cf6', strokeWidth: 3, style: 'solid' },
    tag: { color: '#10b981', strokeWidth: 1, style: 'dashed' },
    connection: { color: '#f59e0b', strokeWidth: 2, style: 'solid' },
};

export function GraphView({ vaultId, onNodeClick, onClose }: GraphViewProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<GraphData['stats'] | null>(null);
    const [filter, setFilter] = useState({
        showHierarchy: true,
        showDocumentLinks: true,
        showTags: true,
        showConnections: true,
    });
    const [topicClusters, setTopicClusters] = useState<TopicCluster[]>([]);
    const [showTopics, setShowTopics] = useState(false);
    const [topicsLoading, setTopicsLoading] = useState(false);

    const loadGraph = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const data: GraphData = await editorApi.getVaultGraph(vaultId);
            
            const flowNodes: Node[] = data.nodes.map((node, index) => {
                const angle = (index / data.nodes.length) * 2 * Math.PI;
                const radius = Math.max(300, data.nodes.length * 20);

                let clusterColor: string | null = null;
                if (showTopics && topicClusters.length > 0) {
                    for (const cluster of topicClusters) {
                        if (cluster.documents.find(d => d.document_id === node.id)) {
                            clusterColor = cluster.color;
                            break;
                        }
                    }
                }
                
                return {
                    id: node.id,
                    type: 'default',
                    position: {
                        x: Math.cos(angle) * radius + 500,
                        y: Math.sin(angle) * radius + 400,
                    },
                    data: {
                        label: (
                            <div className="graph-node">
                                <div className="graph-node-icon">{node.icon}</div>
                                <div className="graph-node-title">{node.title}</div>
                                {node.tags.length > 0 && (
                                    <div className="graph-node-tags">
                                        {node.tags.map(tag => (
                                            <span
                                                key={tag.id}
                                                className="graph-node-tag"
                                                style={{ backgroundColor: tag.color }}
                                            >
                                                {tag.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ),
                    },
                    style: {
                        background: clusterColor ? `${clusterColor}20` : (node.isFolder ? '#1e293b' : '#0f172a'),
                        border: `2px solid ${clusterColor || node.tags[0]?.color || '#475569'}`,
                        borderRadius: '12px',
                        padding: '10px',
                        width: 'auto',
                        minWidth: '150px',
                    },
                };
            });

            const flowEdges: Edge[] = data.edges.map(edge => {
                const edgeStyle = edgeTypes[edge.type] || edgeTypes.connection;
                return {
                    id: edge.id,
                    source: edge.source,
                    target: edge.target,
                    type: 'smoothstep',
                    animated: edge.type === 'document-link' || edge.type === 'connection',
                    style: {
                        stroke: edgeStyle.color,
                        strokeWidth: edgeStyle.strokeWidth,
                        strokeDasharray: edgeStyle.style === 'dashed' ? '5,5' : undefined,
                    },
                    markerEnd: {
                        type: (edge.type === 'document-link' || edge.type === 'connection') ? MarkerType.ArrowClosed : MarkerType.Arrow,
                        color: edgeStyle.color,
                    },
                };
            });

            setNodes(flowNodes);
            setEdges(flowEdges);
            setStats(data.stats);
        } catch (err) {
            console.error('Failed to load graph:', err);
            setError('Failed to load graph data');
        } finally {
            setLoading(false);
        }
    }, [vaultId, setNodes, setEdges, showTopics, topicClusters]);

    useEffect(() => {
        loadGraph();
    }, [loadGraph]);

    useEffect(() => {
        if (!stats) return;

        editorApi.getVaultGraph(vaultId).then((data: GraphData) => {
            const filteredEdges = data.edges.filter(edge => {
                if (edge.type === 'hierarchy' && !filter.showHierarchy) return false;
                if (edge.type === 'document-link' && !filter.showDocumentLinks) return false;
                if (edge.type === 'tag' && !filter.showTags) return false;
                if (edge.type === 'connection' && !filter.showConnections) return false;
                return true;
            });

            const flowEdges: Edge[] = filteredEdges.map(edge => {
                const edgeStyle = edgeTypes[edge.type] || edgeTypes.connection;
                return {
                    id: edge.id,
                    source: edge.source,
                    target: edge.target,
                    type: 'smoothstep',
                    animated: edge.type === 'document-link' || edge.type === 'connection',
                    style: {
                        stroke: edgeStyle.color,
                        strokeWidth: edgeStyle.strokeWidth,
                        strokeDasharray: edgeStyle.style === 'dashed' ? '5,5' : undefined,
                    },
                    markerEnd: {
                        type: (edge.type === 'document-link' || edge.type === 'connection') ? MarkerType.ArrowClosed : MarkerType.Arrow,
                        color: edgeStyle.color,
                    },
                };
            });

            setEdges(flowEdges);
        });
    }, [filter, vaultId, setEdges, stats]);

    const handleNodeClick = useCallback(
        (_event: React.MouseEvent, node: Node) => {
            if (onNodeClick) {
                onNodeClick(node.id);
            }
        },
        [onNodeClick]
    );

    if (loading) {
        return (
            <div className="graph-view-loading">
                <div className="spinner"></div>
                <p>Loading graph...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="graph-view-error">
                <p>{error}</p>
                <button onClick={loadGraph}>Retry</button>
            </div>
        );
    }

    return (
        <div className="graph-view-container">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                fitView
                attributionPosition="bottom-left"
            >
                <Background />
                <Controls />
                <MiniMap
                    nodeColor={(node) => {
                        const border = node.style?.border as string;
                        return border?.match(/#[0-9a-f]{6}/i)?.[0] || '#475569';
                    }}
                    maskColor="rgba(0, 0, 0, 0.6)"
                />
                
                <Panel position="top-left" className="graph-panel">
                    <div className="graph-header">
                        <h3>📊 Graph View</h3>
                        {onClose && (
                            <button onClick={onClose} className="graph-close-btn">
                                ✕
                            </button>
                        )}
                    </div>
                    
                    {stats && (
                        <div className="graph-stats">
                            <div className="stat">
                                <span className="stat-label">Nodes:</span>
                                <span className="stat-value">{stats.totalNodes}</span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">Connections:</span>
                                <span className="stat-value">{stats.totalEdges}</span>
                            </div>
                        </div>
                    )}

                    <div className="graph-filters">
                        <h4>Show Connections:</h4>
                        <label className="filter-checkbox">
                            <input
                                type="checkbox"
                                checked={filter.showHierarchy}
                                onChange={(e) =>
                                    setFilter({ ...filter, showHierarchy: e.target.checked })
                                }
                            />
                            <span className="filter-color" style={{ background: '#94a3b8' }}></span>
                            Hierarchy ({stats?.hierarchyEdges || 0})
                        </label>
                        <label className="filter-checkbox">
                            <input
                                type="checkbox"
                                checked={filter.showDocumentLinks}
                                onChange={(e) =>
                                    setFilter({ ...filter, showDocumentLinks: e.target.checked })
                                }
                            />
                            <span className="filter-color" style={{ background: '#8b5cf6' }}></span>
                            Document Links ({stats?.documentLinkEdges || 0})
                        </label>
                        <label className="filter-checkbox">
                            <input
                                type="checkbox"
                                checked={filter.showTags}
                                onChange={(e) =>
                                    setFilter({ ...filter, showTags: e.target.checked })
                                }
                            />
                            <span className="filter-color" style={{ background: '#10b981' }}></span>
                            Tags ({stats?.tagEdges || 0})
                        </label>
                        <label className="filter-checkbox">
                            <input
                                type="checkbox"
                                checked={filter.showConnections}
                                onChange={(e) =>
                                    setFilter({ ...filter, showConnections: e.target.checked })
                                }
                            />
                            <span className="filter-color" style={{ background: '#f59e0b' }}></span>
                            Connections ({stats?.connectionEdges || 0})
                        </label>
                    </div>

                    <div className="graph-legend">
                        <h4>Legend:</h4>
                        <div className="legend-item">
                            <div className="legend-line" style={{ borderTop: '2px solid #94a3b8' }}></div>
                            <span>Parent-Child</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-line" style={{ borderTop: '3px solid #8b5cf6' }}></div>
                            <span>Document Link [[]]</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-line" style={{ borderTop: '1px dashed #10b981' }}></div>
                            <span>Same Tag</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-line" style={{ borderTop: '2px solid #f59e0b' }}></div>
                            <span>Zettelkasten Link</span>
                        </div>
                    </div>

                    <div className="graph-topics" style={{ marginTop: '12px' }}>
                        <button
                            onClick={async () => {
                                if (showTopics) {
                                    setShowTopics(false);
                                    setTopicClusters([]);
                                } else {
                                    try {
                                        setTopicsLoading(true);
                                        const data = await aiApi.getTopicClusters();
                                        setTopicClusters(data.clusters);
                                        setShowTopics(true);
                                    } catch (err) {
                                        console.error('Failed to load topic clusters:', err);
                                    } finally {
                                        setTopicsLoading(false);
                                    }
                                }
                            }}
                            disabled={topicsLoading}
                            style={{
                                width: '100%',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: showTopics ? '1px solid #8b5cf6' : '1px solid #475569',
                                background: showTopics ? '#8b5cf620' : 'transparent',
                                color: showTopics ? '#c4b5fd' : '#94a3b8',
                                fontSize: '12px',
                                cursor: topicsLoading ? 'wait' : 'pointer',
                            }}
                        >
                            {topicsLoading ? 'Loading...' : showTopics ? '✨ Topics ON' : '✨ Color by Topic'}
                        </button>
                        {showTopics && topicClusters.length > 0 && (
                            <div style={{ marginTop: '8px' }}>
                                {topicClusters.map(cluster => (
                                    <div key={cluster.cluster_id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: cluster.color, flexShrink: 0 }} />
                                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                            {cluster.documents.length} docs
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Panel>
            </ReactFlow>
        </div>
    );
}
