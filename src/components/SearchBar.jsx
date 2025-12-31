import { useState } from 'react';

function SearchBar({ onSearch, disabled = false }) {
  const [walletAddress, setWalletAddress] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (walletAddress.trim()) {
      onSearch(walletAddress.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="relative flex flex-col sm:flex-row gap-2 sm:gap-0">
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="Enter Solana wallet address..."
          disabled={disabled}
          className="w-full px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl sm:rounded-r-none text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-text)] transition-colors duration-200 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !walletAddress.trim()}
          className="sm:absolute sm:right-0 sm:top-0 sm:bottom-0 px-6 py-3 sm:py-4 sm:rounded-l-none bg-[var(--color-text)] text-[var(--color-background)] font-semibold rounded-2xl hover:opacity-80 transition-opacity duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {disabled ? 'Loading...' : 'Track'}
        </button>
      </div>
    </form>
  );
}

export default SearchBar;
