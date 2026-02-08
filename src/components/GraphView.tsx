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
    type: 'hierarchy' | 'document-link' | 'tag';
    tagId?: string;
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
    };
}

const edgeTypes = {
    hierarchy: { color: '#94a3b8', strokeWidth: 2, style: 'solid' },
    'document-link': { color: '#8b5cf6', strokeWidth: 3, style: 'solid' },
    tag: { color: '#10b981', strokeWidth: 1, style: 'dashed' },
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
    });

    const loadGraph = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const data: GraphData = await editorApi.getVaultGraph(vaultId);
            
            console.log('GraphView: Loaded graph data', data);
            console.log('GraphView: Nodes count:', data.nodes?.length);
            console.log('GraphView: Edges count:', data.edges?.length);
            console.log('GraphView: First 3 nodes:', data.nodes?.slice(0, 3));
            console.log('GraphView: Stats:', data.stats);
            
            // Convert to React Flow format
            const flowNodes: Node[] = data.nodes.map((node, index) => {
                // Calculate position in a circular layout
                const angle = (index / data.nodes.length) * 2 * Math.PI;
                const radius = Math.max(300, data.nodes.length * 20);
                
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
                        background: node.isFolder ? '#1e293b' : '#0f172a',
                        border: `2px solid ${node.tags[0]?.color || '#475569'}`,
                        borderRadius: '12px',
                        padding: '10px',
                        width: 'auto',
                        minWidth: '150px',
                    },
                };
            });

            const flowEdges: Edge[] = data.edges.map(edge => {
                const edgeStyle = edgeTypes[edge.type];
                return {
                    id: edge.id,
                    source: edge.source,
                    target: edge.target,
                    type: 'smoothstep',
                    animated: edge.type === 'document-link',
                    style: {
                        stroke: edgeStyle.color,
                        strokeWidth: edgeStyle.strokeWidth,
                        strokeDasharray: edgeStyle.style === 'dashed' ? '5,5' : undefined,
                    },
                    markerEnd: {
                        type: edge.type === 'document-link' ? MarkerType.ArrowClosed : MarkerType.Arrow,
                        color: edgeStyle.color,
                    },
                    label: edge.type === 'document-link' ? '🔗' : undefined,
                    labelStyle: { fontSize: 16 },
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
    }, [vaultId, setNodes, setEdges]);

    useEffect(() => {
        loadGraph();
    }, [loadGraph]);

    // Filter edges based on selected filters
    useEffect(() => {
        if (!stats) return;

        editorApi.getVaultGraph(vaultId).then((data: GraphData) => {
            const filteredEdges = data.edges.filter(edge => {
                if (edge.type === 'hierarchy' && !filter.showHierarchy) return false;
                if (edge.type === 'document-link' && !filter.showDocumentLinks) return false;
                if (edge.type === 'tag' && !filter.showTags) return false;
                return true;
            });

            const flowEdges: Edge[] = filteredEdges.map(edge => {
                const edgeStyle = edgeTypes[edge.type];
                return {
                    id: edge.id,
                    source: edge.source,
                    target: edge.target,
                    type: 'smoothstep',
                    animated: edge.type === 'document-link',
                    style: {
                        stroke: edgeStyle.color,
                        strokeWidth: edgeStyle.strokeWidth,
                        strokeDasharray: edgeStyle.style === 'dashed' ? '5,5' : undefined,
                    },
                    markerEnd: {
                        type: edge.type === 'document-link' ? MarkerType.ArrowClosed : MarkerType.Arrow,
                        color: edgeStyle.color,
                    },
                    label: edge.type === 'document-link' ? '🔗' : undefined,
                    labelStyle: { fontSize: 16 },
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
                    </div>
                </Panel>
            </ReactFlow>
        </div>
    );
}
