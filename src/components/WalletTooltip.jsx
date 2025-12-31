/**
 * Tooltip component for displaying wallet details
 */
function WalletTooltip({ node, position, onClose }) {
  if (!node) return null;

  const { data } = node;
  const { address, isRoot, stats } = data;

  return (
    <div
      className="fixed z-50 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg shadow-xl p-4 min-w-[300px] max-w-[400px]"
      style={{
        left: position.x + 10,
        top: position.y + 10,
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Header */}
      <div className="mb-3">
        <p className="text-xs text-gray-400 mb-1">
          {isRoot ? 'Root Wallet' : 'Counterparty Wallet'}
        </p>
        <p className="text-white font-mono text-sm break-all">
          {address}
        </p>
      </div>

      {/* Stats */}
      {stats && !isRoot && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-xs text-gray-400">Total Sent</p>
              <p className="text-red-500 font-semibold">
                -{stats.totalSent.toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Received</p>
              <p className="text-green-500 font-semibold">
                +{stats.totalReceived.toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Net Flow</p>
              <p className={`font-semibold ${stats.netFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.netFlow >= 0 ? '+' : ''}{stats.netFlow.toFixed(4)}
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
              {new Date(stats.firstInteraction * 1000).toLocaleDateString()} 
              {' — '}
              {new Date(stats.lastInteraction * 1000).toLocaleDateString()}
            </p>
          </div>

          {/* Tokens */}
          {stats.tokensInvolved && stats.tokensInvolved.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Tokens</p>
              <div className="flex flex-wrap gap-1">
                {stats.tokensInvolved.map((token) => (
                  <span 
                    key={token}
                    className="px-2 py-0.5 bg-[#1a1a1a] rounded text-xs text-gray-300"
                  >
                    {token}
                  </span>
                ))}
              </div>
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

