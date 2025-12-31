import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

/**
 * Custom node component for wallet visualization
 */
function WalletNode({ data, selected }) {
  const { label, isRoot, size, stats } = data;
  
  // Calculate node dimensions based on size (min 60, max 120)
  const nodeDimension = Math.max(60, Math.min(120, 60 + size * 2));
  
  return (
    <div
      className={`
        flex items-center justify-center rounded-full cursor-pointer
        transition-all duration-200
        ${isRoot 
          ? 'bg-white text-[#1a1a1a] border-4 border-white' 
          : 'bg-[#2a2a2a] text-white border-2 border-[#3a3a3a]'
        }
        ${selected ? 'ring-4 ring-white/50' : ''}
        hover:scale-110
      `}
      style={{
        width: nodeDimension,
        height: nodeDimension,
      }}
    >
      {/* Handles for edges */}
      <Handle
        type="target"
        position={Position.Top}
        className="opacity-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0"
      />
      
      {/* Node content */}
      <div className="text-center p-2">
        <p className="text-xs font-mono font-semibold truncate" style={{ maxWidth: nodeDimension - 16 }}>
          {label}
        </p>
        {!isRoot && stats && (
          <p className="text-[10px] text-gray-400 mt-0.5">
            {stats.transactionCount} tx
          </p>
        )}
      </div>
    </div>
  );
}

export default memo(WalletNode);

