import { useState } from 'react';
import SearchBar from './SearchBar';
import WalletTree from './WalletTree';
import { fetchWalletTransactions, HeliusApiError } from '../services/heliusApi';
import { processTransactions } from '../utils/processTransactions';

function HomePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [treeData, setTreeData] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [showStats, setShowStats] = useState(false);

  const handleSearch = async (address) => {
    setLoading(true);
    setError(null);
    setTreeData(null);
    setWalletAddress(address);

    try {
      console.log('Fetching transactions for:', address);
      const transactions = await fetchWalletTransactions(address);
      console.log('Transactions fetched:', transactions.length);
      
      // Process transactions into tree structure
      const processed = processTransactions(transactions, address);
      console.log('Processed tree data:', processed);
      setTreeData(processed);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      if (err instanceof HeliusApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-[var(--color-text)]">
            SolTree
          </h1>
          <p className="text-[var(--color-text-muted)] text-lg">
            Visualize wallet interactions on Solana
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex justify-center mb-8">
          <SearchBar onSearch={handleSearch} disabled={loading} />
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[var(--color-text)]">Loading transactions...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Results */}
        {treeData && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard 
                label="Wallets" 
                value={treeData.stats.totalCounterparties} 
              />
              <StatCard 
                label="Transactions" 
                value={treeData.stats.totalTransactions} 
              />
              <StatCard 
                label="Sent" 
                value={treeData.stats.totalSent.toFixed(2)} 
                color="text-red-500"
              />
              <StatCard 
                label="Received" 
                value={treeData.stats.totalReceived.toFixed(2)} 
                color="text-green-500"
              />
              <StatCard 
                label="Net Flow" 
                value={`${treeData.stats.netFlow >= 0 ? '+' : ''}${treeData.stats.netFlow.toFixed(2)}`}
                color={treeData.stats.netFlow >= 0 ? 'text-green-500' : 'text-red-500'}
              />
            </div>

            {/* Tree Visualization */}
            <WalletTree treeData={treeData} />

            {/* Toggle Stats Button */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowStats(!showStats)}
                className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
              >
                {showStats ? 'Hide Details' : 'Show Details'}
              </button>
            </div>

            {/* Detailed Stats */}
            {showStats && (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6">
                {/* Tokens Involved */}
                {treeData.stats.tokensInvolved.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-[var(--color-text)] font-semibold mb-2">Tokens Involved</h3>
                    <div className="flex flex-wrap gap-2">
                      {treeData.stats.tokensInvolved.map((token) => (
                        <span 
                          key={token}
                          className="px-3 py-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded-full text-sm text-[var(--color-text)]"
                        >
                          {token}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Counterparty List */}
                <h3 className="text-[var(--color-text)] font-semibold mb-4">
                  All Counterparties ({treeData.nodes.length - 1})
                </h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {treeData.nodes
                    .filter(node => !node.isRoot)
                    .map((node) => (
                      <div
                        key={node.id}
                        className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-3"
                      >
                        <div className="flex justify-between items-center">
                          <p className="text-[var(--color-text)] font-mono text-sm truncate max-w-[300px]">
                            {node.address}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-red-500">-{node.stats.totalSent.toFixed(4)}</span>
                            <span className="text-green-500">+{node.stats.totalReceived.toFixed(4)}</span>
                            <span className="text-[var(--color-text-muted)]">{node.stats.transactionCount} tx</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!treeData && !loading && !error && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl flex items-center justify-center">
              <svg
                className="w-10 h-10 text-[var(--color-text)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
            </div>
            <p className="text-[var(--color-text-muted)]">
              Enter a Solana wallet address to visualize its transaction network
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'text-[var(--color-text)]' }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
      <p className="text-[var(--color-text-muted)] text-sm mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default HomePage;
