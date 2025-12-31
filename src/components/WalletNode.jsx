import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { getSolscanUrl } from '../utils/formatters';

/**
 * Custom node component for wallet visualization
 */
function WalletNode({ data, selected }) {
  const { label, isRoot, size, stats, address, isCex, cexName } = data;
  
  // Calculate node dimensions based on size (min 60, max 120)
  const nodeDimension = Math.max(60, Math.min(120, 60 + size * 2));
  
  const handleSolscanClick = (e) => {
    e.stopPropagation();
    window.open(getSolscanUrl(address), '_blank', 'noopener,noreferrer');
  };
  
  // CEX wallets get a special yellow color
  const getNodeStyles = () => {
    if (isRoot) {
      return 'bg-white text-[#1a1a1a] border-4 border-white';
    }
    if (isCex) {
      return 'bg-yellow-500/20 text-yellow-500 border-2 border-yellow-500/50';
    }
    return 'bg-[#2a2a2a] text-white border-2 border-[#3a3a3a]';
  };
  
  return (
    <div
      className={`
        relative flex items-center justify-center rounded-full cursor-pointer
        transition-all duration-200 group
        ${getNodeStyles()}
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
          {isCex ? cexName : label}
        </p>
        {!isRoot && stats && (
          <p className={`text-[10px] mt-0.5 ${isCex ? 'text-yellow-500/70' : 'text-gray-400'}`}>
            {stats.transactionCount} tx
          </p>
        )}
        {isCex && (
          <p className="text-[8px] text-yellow-500/70 mt-0.5">CEX</p>
        )}
      </div>

      {/* Solscan link - appears on hover */}
      <button
        onClick={handleSolscanClick}
        className={`
          absolute -bottom-1 -right-1 w-6 h-6 rounded-full 
          flex items-center justify-center
          opacity-0 group-hover:opacity-100 transition-opacity
          ${isRoot ? 'bg-[#1a1a1a] text-white' : isCex ? 'bg-yellow-500 text-[#1a1a1a]' : 'bg-white text-[#1a1a1a]'}
          hover:scale-110
        `}
        title="View on Solscan"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </button>
    </div>
  );
}

export default memo(WalletNode);
