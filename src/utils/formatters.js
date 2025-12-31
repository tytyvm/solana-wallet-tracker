/**
 * Formatting utility functions
 */

/**
 * Formats a number for display with appropriate precision
 * @param {number} num - The number to format
 * @param {string} token - The token symbol (for context)
 * @returns {string} - Formatted number string
 */
export function formatAmount(num, token = 'SOL') {
  if (num === 0) return '0';
  
  const absNum = Math.abs(num);
  
  if (absNum >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (absNum >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  if (absNum >= 1) {
    return num.toFixed(2);
  }
  if (absNum >= 0.0001) {
    return num.toFixed(4);
  }
  return num.toExponential(2);
}

/**
 * Formats an amount with token symbol
 * @param {number} amount - The amount
 * @param {string} token - The token symbol
 * @returns {string} - Formatted string like "1.5 SOL"
 */
export function formatTokenAmount(amount, token = 'SOL') {
  return `${formatAmount(amount)} ${token}`;
}

/**
 * Truncates a wallet address
 * @param {string} address - Full wallet address
 * @param {number} startChars - Characters to show at start
 * @param {number} endChars - Characters to show at end
 * @returns {string} - Truncated address
 */
export function truncateAddress(address, startChars = 4, endChars = 4) {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Formats a date for display
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string} - Formatted date string
 */
export function formatDate(timestamp) {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats a date range
 * @param {number} startTimestamp - Start unix timestamp
 * @param {number} endTimestamp - End unix timestamp
 * @returns {string} - Formatted date range
 */
export function formatDateRange(startTimestamp, endTimestamp) {
  const start = formatDate(startTimestamp);
  const end = formatDate(endTimestamp);
  return start === end ? start : `${start} - ${end}`;
}

/**
 * Returns Solscan URL for an address
 * @param {string} address - Wallet address
 * @returns {string} - Solscan URL
 */
export function getSolscanUrl(address) {
  return `https://solscan.io/account/${address}`;
}

/**
 * Returns Solscan URL for a transaction
 * @param {string} signature - Transaction signature
 * @returns {string} - Solscan URL
 */
export function getSolscanTxUrl(signature) {
  return `https://solscan.io/tx/${signature}`;
}

