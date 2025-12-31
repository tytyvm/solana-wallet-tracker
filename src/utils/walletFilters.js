/**
 * Wallet filtering utilities
 * Re-exports from knownWallets.js and adds validation helpers
 */

import { 
  PROGRAM_BLOCKLIST, 
  CEX_WALLETS, 
  identifyWallet, 
  matchesProgramPattern,
  isProgram,
  isCex,
  getCexName,
  isLikelyUserWallet 
} from './knownWallets';

// Re-export everything from knownWallets
export { 
  PROGRAM_BLOCKLIST, 
  CEX_WALLETS, 
  identifyWallet, 
  matchesProgramPattern,
  isProgram,
  isCex,
  getCexName,
  isLikelyUserWallet 
};

// Minimum SOL amount to consider (filters dust/spam)
export const MIN_SOL_THRESHOLD = 0.001; // 1,000,000 lamports

/**
 * Checks if a SOL amount is above the dust threshold
 * @param {number} amount - Amount in SOL
 * @returns {boolean} - True if above threshold
 */
export function isAboveDustThreshold(amount) {
  return Math.abs(amount) >= MIN_SOL_THRESHOLD;
}

/**
 * Gets CEX info for an address if it's a known exchange wallet
 * @param {string} address - The address to check
 * @returns {Object|null} - CEX info { name, label } or null
 */
export function getCexInfo(address) {
  const name = CEX_WALLETS[address];
  if (!name) return null;
  
  return {
    name,
    label: `${name} Hot Wallet`,
  };
}

/**
 * Checks if an address is a known CEX wallet
 * @param {string} address - The address to check
 * @returns {boolean} - True if it's a CEX wallet
 */
export function isCexWallet(address) {
  return address in CEX_WALLETS;
}

/**
 * Filters and validates a counterparty address
 * @param {string} address - The address to validate
 * @param {number} amount - The transaction amount in SOL
 * @returns {boolean} - True if the address and amount are valid
 */
export function isValidCounterparty(address, amount) {
  // Must be above dust threshold
  if (!isAboveDustThreshold(amount)) return false;
  
  // Must be a likely user wallet (not a program)
  if (!isLikelyUserWallet(address)) return false;
  
  return true;
}
