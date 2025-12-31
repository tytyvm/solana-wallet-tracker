import { useState } from 'react';
import { getCexInfo } from '../utils/walletFilters';

/**
 * WalletAddress component with truncation, copy button, Solscan link, and CEX badge
 */
function WalletAddress({ 
  address, 
  truncate = true, 
  showCopy = true, 
  showSolscan = true, 
  showCexBadge = true,
  className = '' 
}) {
  const [copied, setCopied] = useState(false);
  const cexInfo = getCexInfo(address);

  const truncatedAddress = truncate 
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : address;

  const solscanUrl = `https://solscan.io/account/${address}`;

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 flex-wrap ${className}`}>
      {/* CEX Badge */}
      {showCexBadge && cexInfo && (
        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-xs font-semibold rounded-full border border-yellow-500/30">
          {cexInfo.name}
        </span>
      )}
      
      <span className="font-mono text-sm" title={address}>
        {cexInfo ? cexInfo.label : truncatedAddress}
      </span>
      
      {showCopy && (
        <button
          onClick={handleCopy}
          className="p-1 hover:bg-[var(--color-border)] rounded transition-colors"
          title={copied ? 'Copied!' : 'Copy address'}
        >
          {copied ? (
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      )}

      {showSolscan && (
        <a
          href={solscanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 hover:bg-[var(--color-border)] rounded transition-colors"
          title="View on Solscan"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}
    </div>
  );
}

export default WalletAddress;
