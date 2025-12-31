import WalletAddress from './WalletAddress';
import { formatAmount } from '../utils/formatters';

/**
 * Summary panel showing key wallet statistics
 */
function SummaryPanel({ treeData, transactionCount }) {
  const { stats, nodes } = treeData;
  
  // Find most frequent counterparty (node with highest transaction count)
  const mostFrequent = nodes
    .filter(node => !node.isRoot)
    .sort((a, b) => (b.stats?.transactionCount || 0) - (a.stats?.transactionCount || 0))[0];

  // Find largest volume counterparty
  const largestVolume = nodes
    .filter(node => !node.isRoot)
    .sort((a, b) => {
      const volumeA = (a.stats?.totalSent || 0) + (a.stats?.totalReceived || 0);
      const volumeB = (b.stats?.totalSent || 0) + (b.stats?.totalReceived || 0);
      return volumeB - volumeA;
    })[0];

  // Get CEX wallets
  const cexWallets = nodes.filter(node => node.isCex);

  // Calculate filtered count
  const totalFiltered = stats.filteredByAccountType || 0;

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 sm:p-6">
      {/* Filter Summary Banner */}
      {totalFiltered > 0 && (
        <div className="mb-4 p-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-[var(--color-text)] text-sm">
                Showing <span className="font-semibold">{stats.totalCounterparties}</span> wallets
                <span className="text-[var(--color-text-muted)]"> ({totalFiltered} programs filtered)</span>
              </span>
            </div>
            <div className="text-[var(--color-text-muted)] text-xs">
              Min: ${stats.minValueUsd || 2} USD
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard
          label="Unique Wallets"
          value={stats.totalCounterparties}
          icon={
            <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          label="Transactions"
          value={transactionCount}
          icon={
            <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          }
        />
        <StatCard
          label="Total Sent"
          value={`${formatAmount(stats.totalSent)} SOL`}
          color="text-red-500"
          icon={
            <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          }
        />
        <StatCard
          label="Total Received"
          value={`${formatAmount(stats.totalReceived)} SOL`}
          color="text-green-500"
          icon={
            <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          }
        />
        <StatCard
          label="CEX Wallets"
          value={cexWallets.length}
          color="text-yellow-500"
          icon={
            <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
      </div>

      {/* Net Flow */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 py-3 sm:py-4 border-t border-b border-[var(--color-border)] mb-4 sm:mb-6">
        <span className="text-[var(--color-text-muted)] text-sm sm:text-base">Net Flow:</span>
        <span className={`text-xl sm:text-2xl font-bold ${stats.netFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {stats.netFlow >= 0 ? '+' : ''}{formatAmount(stats.netFlow)} SOL
        </span>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Most Frequent Counterparty */}
        {mostFrequent && (
          <div className={`bg-[var(--color-background)] border rounded-lg p-3 sm:p-4 ${mostFrequent.isCex ? 'border-yellow-500/30' : 'border-[var(--color-border)]'}`}>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-[var(--color-text-muted)] text-sm">Most Frequent</span>
              {mostFrequent.isCex && (
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-xs font-semibold rounded-full">
                  {mostFrequent.cexName}
                </span>
              )}
            </div>
            <WalletAddress 
              address={mostFrequent.address}
              showCexBadge={false}
              className="text-[var(--color-text)] mb-1"
            />
            <p className="text-[var(--color-text-muted)] text-sm">
              {mostFrequent.stats.transactionCount} transactions
            </p>
          </div>
        )}

        {/* Largest Volume Counterparty */}
        {largestVolume && (
          <div className={`bg-[var(--color-background)] border rounded-lg p-3 sm:p-4 ${largestVolume.isCex ? 'border-yellow-500/30' : 'border-[var(--color-border)]'}`}>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[var(--color-text-muted)] text-sm">Largest Volume</span>
              {largestVolume.isCex && (
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-xs font-semibold rounded-full">
                  {largestVolume.cexName}
                </span>
              )}
            </div>
            <WalletAddress 
              address={largestVolume.address}
              showCexBadge={false}
              className="text-[var(--color-text)] mb-1"
            />
            <p className="text-[var(--color-text-muted)] text-sm">
              {formatAmount((largestVolume.stats.totalSent || 0) + (largestVolume.stats.totalReceived || 0))} SOL total volume
            </p>
          </div>
        )}
      </div>

      {/* CEX Wallets Section */}
      {cexWallets.length > 0 && (
        <div className="mt-4 sm:mt-6 pt-4 border-t border-[var(--color-border)]">
          <p className="text-[var(--color-text-muted)] text-sm mb-2">Exchange Interactions</p>
          <div className="flex flex-wrap gap-2">
            {cexWallets.map((wallet) => (
              <div
                key={wallet.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
              >
                <span className="text-yellow-500 font-semibold text-sm">{wallet.cexName}</span>
                <span className="text-[var(--color-text-muted)] text-xs">
                  {wallet.stats.transactionCount} tx
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color = 'text-[var(--color-text)]', icon }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
        <span className="text-[var(--color-text-muted)]">{icon}</span>
        <span className="text-[var(--color-text-muted)] text-xs sm:text-sm">{label}</span>
      </div>
      <p className={`text-base sm:text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default SummaryPanel;
