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
      <div className="relative">
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="Enter Solana wallet address..."
          className="w-full px-6 py-4 text-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-text)] transition-colors duration-200"
        />
        <button
          type="submit"
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-[var(--color-text)] text-[var(--color-background)] font-semibold rounded-xl hover:opacity-80 transition-opacity duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {disabled ? 'Loading...' : 'Track'}
        </button>
      </div>
    </form>
  );
}

export default SearchBar;
