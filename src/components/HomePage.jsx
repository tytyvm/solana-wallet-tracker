import { useState } from 'react';
import SearchBar from './SearchBar';
import WalletTree from './WalletTree';
import SummaryPanel from './SummaryPanel';
import WalletAddress from './WalletAddress';
import { fetchWalletTransactions, fetchAccountsInfo, HeliusApiError } from '../services/heliusApi';
import { processTransactions, filterValidWallets } from '../utils/processTransactions';

const DATE_FILTER_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
];

function HomePage() {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);
  const [treeData, setTreeData] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [rawTransactions, setRawTransactions] = useState([]);
  const [dateFilter, setDateFilter] = useState(30);

  const handleSearch = async (address, days = dateFilter) => {
    setLoading(true);
    setLoadingMessage('Fetching transactions...');
    setError(null);
    setTreeData(null);
    setWalletAddress(address);
    setRawTransactions([]);

    try {
      // Step 1: Fetch transactions
      console.log('Fetching transactions for:', address, 'days:', days);
      const transactions = await fetchWalletTransactions(address, days, setLoadingMessage);
      console.log('Transactions fetched:', transactions.length);
      
      // Check if wallet has no transactions
      if (!transactions || transactions.length === 0) {
        setError({
          type: 'no_transactions',
          message: `No transactions found for this wallet in the past ${days} days.`,
        });
        setLoading(false);
        return;
      }

      setRawTransactions(transactions);
      
      // Step 2: Get unique counterparty addresses
      const uniqueAddresses = new Set();
      transactions.forEach(tx => {
        tx.transfers.forEach(transfer => {
          if (transfer.counterparty) {
            uniqueAddresses.add(transfer.counterparty);
          }
        });
      });

      // Step 3: Fetch account info for all counterparties
      const addressList = Array.from(uniqueAddresses);
      console.log('Checking', addressList.length, 'unique counterparties');
      
      let accountsInfo = new Map();
      if (addressList.length > 0) {
        setLoadingMessage(`Analyzing ${addressList.length} wallets...`);
        accountsInfo = await fetchAccountsInfo(addressList, setLoadingMessage);
      }

      // Step 4: Process transactions with account info filtering
      setLoadingMessage('Processing data...');
      const processed = processTransactions(transactions, address, accountsInfo);
      console.log('Processed tree data:', processed);
      
      // Check if no counterparties found after filtering
      if (processed.stats.totalCounterparties === 0) {
        setError({
          type: 'no_counterparties',
          message: 'No wallet interactions found after filtering. This wallet may only interact with programs.',
        });
        setLoading(false);
        return;
      }
      
      setTreeData(processed);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      if (err instanceof HeliusApiError) {
        setError({
          type: 'api_error',
          message: err.message,
          details: err.details,
        });
      } else {
        setError({
          type: 'unknown_error',
          message: 'An unexpected error occurred. Please try again.',
        });
      }
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleDateFilterChange = (newDays) => {
    setDateFilter(newDays);
    if (walletAddress) {
      handleSearch(walletAddress, newDays);
    }
  };

  const handleClear = () => {
    setTreeData(null);
    setError(null);
    setWalletAddress('');
    setRawTransactions([]);
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] px-3 sm:px-4 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 text-[var(--color-text)]">
            SolTree
          </h1>
          <p className="text-[var(--color-text-muted)] text-base sm:text-lg">
            Visualize wallet interactions on Solana
          </p>
        </div>

        {/* Search Bar & Controls */}
        <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <SearchBar onSearch={handleSearch} disabled={loading} />
          
          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => handleDateFilterChange(Number(e.target.value))}
            disabled={loading}
            className="px-4 py-3 sm:py-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-[var(--color-text)] focus:outline-none focus:border-[var(--color-text)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {DATE_FILTER_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {(treeData || error) && (
            <button
              onClick={handleClear}
              className="px-6 py-3 sm:py-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Currently viewing indicator */}
        {walletAddress && (treeData || loading) && (
          <div className="flex flex-col items-center justify-center gap-1 mb-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 mx-auto max-w-md">
            <p className="text-[var(--color-text-muted)] text-sm">
              Viewing wallet:
            </p>
            <WalletAddress 
              address={walletAddress} 
              truncate={false}
              className="text-[var(--color-text)]"
            />
          </div>
        )}

        {/* Loading state */}
        {loading && <LoadingSpinner message={loadingMessage} />}

        {/* Error state */}
        {error && <ErrorDisplay error={error} onRetry={() => handleSearch(walletAddress)} />}

        {/* Results */}
        {treeData && (
          <div className="space-y-4 sm:space-y-6">
            {/* Summary Panel */}
            <SummaryPanel treeData={treeData} transactionCount={rawTransactions.length} />

            {/* Tree Visualization */}
            <WalletTree treeData={treeData} />

            {/* Counterparty List */}
            <CounterpartyList nodes={treeData.nodes} />
          </div>
        )}

        {/* Empty state */}
        {!treeData && !loading && !error && <EmptyState />}
      </div>
    </div>
  );
}

function LoadingSpinner({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-20">
      <div className="relative w-16 h-16 mb-6">
        {/* Outer ring */}
        <div className="absolute inset-0 border-4 border-[var(--color-border)] rounded-full"></div>
        {/* Spinning ring */}
        <div className="absolute inset-0 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
        {/* Inner dot */}
        <div className="absolute inset-4 bg-white rounded-full animate-pulse"></div>
      </div>
      <p className="text-[var(--color-text)] text-lg mb-2">
        {message || 'Loading...'}
      </p>
      <p className="text-[var(--color-text-muted)] text-sm text-center px-4">
        This may take a moment for active wallets
      </p>
    </div>
  );
}

function ErrorDisplay({ error, onRetry }) {
  const getErrorIcon = () => {
    switch (error.type) {
      case 'no_transactions':
        return (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        );
      case 'api_error':
        return (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
      <div className="w-20 h-20 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl flex items-center justify-center text-[var(--color-text-muted)] mb-6">
        {getErrorIcon()}
      </div>
      <p className="text-[var(--color-text)] text-lg mb-2 text-center">{error.message}</p>
      {error.type === 'api_error' && (
        <button
          onClick={onRetry}
          className="mt-4 px-6 py-2 bg-white text-[var(--color-background)] font-semibold rounded-lg hover:opacity-80 transition-opacity"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-4">
      <div className="w-20 sm:w-24 h-20 sm:h-24 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl flex items-center justify-center mb-6">
        <svg
          className="w-10 sm:w-12 h-10 sm:h-12 text-[var(--color-text)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <p className="text-[var(--color-text)] text-lg sm:text-xl mb-2 text-center">
        Enter a Solana wallet address
      </p>
      <p className="text-[var(--color-text-muted)] text-center max-w-md text-sm sm:text-base">
        Paste any wallet address to visualize its transaction network and see all the wallets it has interacted with
      </p>
    </div>
  );
}

function CounterpartyList({ nodes }) {
  const [expanded, setExpanded] = useState(false);
  const counterparties = nodes.filter(node => !node.isRoot);
  const displayNodes = expanded ? counterparties : counterparties.slice(0, 10);

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <h3 className="text-[var(--color-text)] font-semibold">
          All Counterparties ({counterparties.length})
        </h3>
        {counterparties.length > 10 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            {expanded ? 'Show Less' : `Show All (${counterparties.length})`}
          </button>
        )}
      </div>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {displayNodes.map((node) => (
          <div
            key={node.id}
            className={`bg-[var(--color-background)] border rounded-lg p-3 ${node.isCex ? 'border-yellow-500/30' : 'border-[var(--color-border)]'}`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <WalletAddress 
                address={node.address}
                className="text-[var(--color-text)]"
              />
              <div className="flex items-center gap-3 sm:gap-4 text-sm">
                <span className="text-red-500">-{node.stats.totalSent.toFixed(4)}</span>
                <span className="text-green-500">+{node.stats.totalReceived.toFixed(4)}</span>
                <span className="text-[var(--color-text-muted)]">{node.stats.transactionCount} tx</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HomePage;
