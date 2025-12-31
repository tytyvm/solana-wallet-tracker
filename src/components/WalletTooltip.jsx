import WalletAddress from './WalletAddress';
import { formatAmount, formatDateRange } from '../utils/formatters';

/**
 * Tooltip component for displaying wallet details
 */
function WalletTooltip({ node, position, onClose }) {
  if (!node) return null;

  const { data } = node;
  const { address, isRoot, stats, isCex, cexName, cexLabel } = data;

  // Adjust position to keep tooltip on screen
  const adjustedPosition = {
    x: Math.min(position.x + 10, window.innerWidth - 340),
    y: Math.min(position.y + 10, window.innerHeight - 300),
  };

  return (
    <div
      className="fixed z-50 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg shadow-xl p-4 w-[320px] max-w-[calc(100vw-20px)]"
      style={{
        left: Math.max(10, adjustedPosition.x),
        top: Math.max(10, adjustedPosition.y),
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-white p-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Header */}
      <div className="mb-3 pr-6">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs text-gray-400">
            {isRoot ? 'Root Wallet' : isCex ? 'Exchange Wallet' : 'Counterparty Wallet'}
          </p>
          {isCex && (
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-xs font-semibold rounded-full border border-yellow-500/30">
              {cexName}
            </span>
          )}
        </div>
        {isCex && cexLabel && (
          <p className="text-yellow-500 text-sm font-semibold mb-1">{cexLabel}</p>
        )}
        <WalletAddress 
          address={address}
          truncate={false}
          showCopy={true}
          showSolscan={true}
          showCexBadge={false}
          className="text-white"
        />
      </div>

      {/* Stats */}
      {stats && !isRoot && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-xs text-gray-400">Total Sent</p>
              <p className="text-red-500 font-semibold">
                -{formatAmount(stats.totalSent)} SOL
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Received</p>
              <p className="text-green-500 font-semibold">
                +{formatAmount(stats.totalReceived)} SOL
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Net Flow</p>
              <p className={`font-semibold ${stats.netFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.netFlow >= 0 ? '+' : ''}{formatAmount(stats.netFlow)} SOL
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Transactions</p>
              <p className="text-white font-semibold">
                {stats.transactionCount}
              </p>
            </div>
          </div>

          {/* Date range */}
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-1">Interaction Period</p>
            <p className="text-white text-sm">
              {formatDateRange(stats.firstInteraction, stats.lastInteraction)}
            </p>
          </div>

          {/* CEX Notice */}
          {isCex && (
            <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
              <p className="text-yellow-500 text-xs">
                This is a known {cexName} hot wallet address.
              </p>
            </div>
          )}
        </>
      )}

      {/* Root wallet message */}
      {isRoot && (
        <p className="text-gray-400 text-sm">
          This is the wallet you searched for.
        </p>
      )}
    </div>
  );
}

export default WalletTooltip;
