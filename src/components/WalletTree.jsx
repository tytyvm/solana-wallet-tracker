import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import WalletNode from './WalletNode';
import WalletTooltip from './WalletTooltip';

// Custom node types
const nodeTypes = {
  wallet: WalletNode,
};

/**
 * Converts tree data to React Flow nodes and edges
 */
function convertToFlowElements(treeData, maxNodes = 50) {
  if (!treeData || !treeData.nodes || treeData.nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Limit nodes for performance
  const limitedNodes = treeData.nodes.slice(0, maxNodes);
  const limitedNodeIds = new Set(limitedNodes.map(n => n.id));

  // Calculate max transaction count for sizing
  const maxTxCount = Math.max(
    1,
    ...limitedNodes
      .filter(n => !n.isRoot)
      .map(n => n.stats?.transactionCount || 1)
  );

  // Position nodes in a radial layout
  const centerX = 400;
  const centerY = 300;
  const radius = 250;
  const childNodes = limitedNodes.filter(n => !n.isRoot);
  const angleStep = (2 * Math.PI) / Math.max(childNodes.length, 1);

  // Create flow nodes
  const flowNodes = limitedNodes.map((node, index) => {
    let x, y;
    
    if (node.isRoot) {
      x = centerX;
      y = centerY;
    } else {
      const childIndex = childNodes.findIndex(n => n.id === node.id);
      const angle = childIndex * angleStep - Math.PI / 2; // Start from top
      x = centerX + radius * Math.cos(angle);
      y = centerY + radius * Math.sin(angle);
    }

    // Calculate size based on transaction count (normalized 0-30)
    const txCount = node.stats?.transactionCount || 1;
    const size = node.isRoot ? 30 : (txCount / maxTxCount) * 30;

    return {
      id: node.id,
      type: 'wallet',
      position: { x, y },
      data: {
        ...node,
        size,
      },
    };
  });

  // Create flow edges with colors based on flow direction
  const flowEdges = treeData.edges
    .filter(edge => limitedNodeIds.has(edge.source) && limitedNodeIds.has(edge.target))
    .map((edge) => {
      const { primaryDirection, isBidirectional, netFlow } = edge.data;
      
      // Determine edge color based on net flow direction
      let strokeColor;
      if (isBidirectional) {
        // For bidirectional, use the primary direction
        strokeColor = netFlow >= 0 ? '#22c55e' : '#ef4444'; // green or red
      } else {
        strokeColor = primaryDirection === 'inflow' ? '#22c55e' : '#ef4444';
      }

      // Edge thickness based on transaction count (min 1, max 5)
      const strokeWidth = Math.max(1, Math.min(5, edge.data.transactionCount / 5));

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        style: {
          stroke: strokeColor,
          strokeWidth,
        },
        data: edge.data,
      };
    });

  return { nodes: flowNodes, edges: flowEdges };
}

/**
 * WalletTree component - visualizes wallet interactions as a network graph
 */
function WalletTree({ treeData }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Convert tree data to React Flow format
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => convertToFlowElements(treeData),
    [treeData]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes/edges when treeData changes
  useMemo(() => {
    const { nodes: newNodes, edges: newEdges } = convertToFlowElements(treeData);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [treeData, setNodes, setEdges]);

  // Handle node click
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  }, []);

  // Handle background click to close tooltip
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  if (!treeData || treeData.nodes.length === 0) {
    return (
      <div className="w-full h-[600px] bg-[#1a1a1a] rounded-lg flex items-center justify-center">
        <p className="text-gray-400">No transaction data to display</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] bg-[#1a1a1a] rounded-lg border border-[#3a3a3a] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'default',
        }}
      >
        <Background color="#3a3a3a" gap={20} />
        <Controls 
          className="!bg-[#2a2a2a] !border-[#3a3a3a] !rounded-lg"
          showInteractive={false}
        />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-3">
        <p className="text-xs text-gray-400 mb-2">Edge Colors</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-green-500"></div>
            <span className="text-xs text-white">Inflow</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500"></div>
            <span className="text-xs text-white">Outflow</span>
          </div>
        </div>
      </div>

      {/* Node count indicator */}
      <div className="absolute top-4 left-4 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-3 py-2">
        <p className="text-xs text-white">
          {treeData.nodes.length - 1} wallets connected
        </p>
      </div>

      {/* Tooltip */}
      {selectedNode && (
        <WalletTooltip
          node={selectedNode}
          position={tooltipPosition}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}

export default WalletTree;

