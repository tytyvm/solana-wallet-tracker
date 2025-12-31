// Utility helper functions
// Will be expanded in future phases

/**
 * Validates a Solana wallet address
 * @param {string} address - The wallet address to validate
 * @returns {boolean} - Whether the address is valid
 */
export const isValidSolanaAddress = (address) => {
  // Solana addresses are base58 encoded and typically 32-44 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
};

/**
 * Truncates a wallet address for display
 * @param {string} address - The full wallet address
 * @param {number} startChars - Number of characters to show at start
 * @param {number} endChars - Number of characters to show at end
 * @returns {string} - Truncated address
 */
export const truncateAddress = (address, startChars = 4, endChars = 4) => {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

