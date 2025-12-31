import { 
  isLikelyUserWallet,
  MIN_SOL_THRESHOLD 
} from '../utils/walletFilters';

const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY;
const HELIUS_BASE_URL = 'https://api.helius.xyz/v0';

// Cache for account info to avoid redundant API calls
const accountInfoCache = new Map();

/**
 * Custom error class for Helius API errors
 */
class HeliusApiError extends Error {
  constructor(message, statusCode = null, details = null) {
    super(message);
    this.name = 'HeliusApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Fetches all transactions for a wallet address from the past N days
 * Only includes native SOL transfers, filters out programs and dust
 * @param {string} walletAddress - The Solana wallet address
 * @param {number} days - Number of days to look back (default 30)
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Promise<Array>} - Array of parsed transaction data
 */
export async function fetchWalletTransactions(walletAddress, days = 30, onProgress = null) {
  if (!HELIUS_API_KEY || HELIUS_API_KEY === 'your_helius_api_key_here') {
    throw new HeliusApiError('Helius API key is not configured. Please add your API key to the .env file.');
  }

  if (!walletAddress) {
    throw new HeliusApiError('Wallet address is required');
  }

  const cutoffTime = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
  const allTransactions = [];
  let beforeSignature = null;
  let hasMore = true;

  try {
    if (onProgress) onProgress('Fetching transactions...');

    // Paginate through all transactions
    while (hasMore) {
      const url = buildApiUrl(walletAddress, beforeSignature);
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new HeliusApiError(
          `Helius API request failed: ${response.statusText}`,
          response.status,
          errorText
        );
      }

      const transactions = await response.json();

      if (!transactions || transactions.length === 0) {
        hasMore = false;
        break;
      }

      // Filter and parse transactions
      for (const tx of transactions) {
        const timestamp = tx.timestamp;
        
        // Stop if we've gone past the cutoff time
        if (timestamp < cutoffTime) {
          hasMore = false;
          break;
        }

        const parsedTx = parseTransaction(tx, walletAddress);
        if (parsedTx) {
          allTransactions.push(parsedTx);
        }
      }

      // Set up pagination for next request
      if (hasMore && transactions.length > 0) {
        beforeSignature = transactions[transactions.length - 1].signature;
      }

      // Safety limit to prevent infinite loops
      if (allTransactions.length > 10000) {
        console.warn('Transaction limit reached (10,000). Some older transactions may not be included.');
        hasMore = false;
      }
    }

    return allTransactions;
  } catch (error) {
    if (error instanceof HeliusApiError) {
      throw error;
    }
    throw new HeliusApiError(
      `Failed to fetch transactions: ${error.message}`,
      null,
      error
    );
  }
}

/**
 * Fetches account info for multiple addresses using Helius API
 * @param {string[]} addresses - Array of addresses to check
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Promise<Map>} - Map of address -> account info
 */
export async function fetchAccountsInfo(addresses, onProgress = null) {
  if (!HELIUS_API_KEY) {
    throw new HeliusApiError('Helius API key is not configured.');
  }

  if (!addresses || addresses.length === 0) {
    return new Map();
  }

  // Filter out addresses we already have cached
  const uncachedAddresses = addresses.filter(addr => !accountInfoCache.has(addr));
  
  if (uncachedAddresses.length === 0) {
    // All addresses are cached, return from cache
    const result = new Map();
    addresses.forEach(addr => {
      result.set(addr, accountInfoCache.get(addr));
    });
    return result;
  }

  if (onProgress) onProgress(`Analyzing ${uncachedAddresses.length} wallets...`);

  // Batch addresses in chunks of 100 (API limit)
  const BATCH_SIZE = 100;
  const batches = [];
  for (let i = 0; i < uncachedAddresses.length; i += BATCH_SIZE) {
    batches.push(uncachedAddresses.slice(i, i + BATCH_SIZE));
  }

  try {
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      if (onProgress && batches.length > 1) {
        onProgress(`Analyzing wallets... (${i + 1}/${batches.length})`);
      }

      // Build URL with addresses as query params
      const url = new URL(`${HELIUS_BASE_URL}/addresses`);
      url.searchParams.append('api-key', HELIUS_API_KEY);
      batch.forEach(addr => url.searchParams.append('addresses', addr));

      const response = await fetch(url.toString());

      if (!response.ok) {
        // If this endpoint fails, fall back to basic filtering
        console.warn('Account info API failed, using basic filtering');
        batch.forEach(addr => {
          accountInfoCache.set(addr, { accountType: 'unknown', isValid: true });
        });
        continue;
      }

      const accountsData = await response.json();

      // Process results and cache them
      if (Array.isArray(accountsData)) {
        accountsData.forEach((account, index) => {
          const addr = batch[index];
          const accountType = account?.accountType || 'unknown';
          const isProgram = ['program', 'programData', 'programExecutable'].includes(accountType);
          const isToken = ['token', 'tokenAccount', 'mint'].includes(accountType);
          
          accountInfoCache.set(addr, {
            accountType,
            isProgram,
            isToken,
            isValid: !isProgram && !isToken,
            raw: account,
          });
        });
      } else if (typeof accountsData === 'object') {
        // Handle object response format
        Object.entries(accountsData).forEach(([addr, account]) => {
          const accountType = account?.accountType || 'unknown';
          const isProgram = ['program', 'programData', 'programExecutable'].includes(accountType);
          const isToken = ['token', 'tokenAccount', 'mint'].includes(accountType);
          
          accountInfoCache.set(addr, {
            accountType,
            isProgram,
            isToken,
            isValid: !isProgram && !isToken,
            raw: account,
          });
        });
      }

      // Small delay between batches to avoid rate limiting
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  } catch (error) {
    console.warn('Error fetching account info:', error);
    // On error, mark uncached addresses as unknown but valid
    uncachedAddresses.forEach(addr => {
      if (!accountInfoCache.has(addr)) {
        accountInfoCache.set(addr, { accountType: 'unknown', isValid: true });
      }
    });
  }

  // Return results for requested addresses
  const result = new Map();
  addresses.forEach(addr => {
    result.set(addr, accountInfoCache.get(addr) || { accountType: 'unknown', isValid: true });
  });
  return result;
}

/**
 * Checks if an address is a valid user wallet based on cached account info
 * @param {string} address - The address to check
 * @returns {boolean} - True if it's a valid user wallet
 */
export function isValidWalletFromCache(address) {
  const cached = accountInfoCache.get(address);
  if (!cached) return true; // If not cached, assume valid
  return cached.isValid;
}

/**
 * Gets cached account type for an address
 * @param {string} address - The address to check
 * @returns {string|null} - The account type or null
 */
export function getCachedAccountType(address) {
  const cached = accountInfoCache.get(address);
  return cached?.accountType || null;
}

/**
 * Clears the account info cache
 */
export function clearAccountCache() {
  accountInfoCache.clear();
}

/**
 * Builds the API URL with query parameters
 * @param {string} walletAddress - The wallet address
 * @param {string|null} beforeSignature - Pagination cursor
 * @returns {string} - The complete API URL
 */
function buildApiUrl(walletAddress, beforeSignature = null) {
  const url = new URL(`${HELIUS_BASE_URL}/addresses/${walletAddress}/transactions`);
  url.searchParams.append('api-key', HELIUS_API_KEY);
  
  if (beforeSignature) {
    url.searchParams.append('before', beforeSignature);
  }

  return url.toString();
}

/**
 * Parses a raw transaction into a structured format
 * ONLY includes native SOL transfers, filters out SPL tokens, programs, and dust
 * @param {Object} tx - Raw transaction from Helius API
 * @param {string} walletAddress - The wallet address we're tracking
 * @returns {Object|null} - Parsed transaction or null if not relevant
 */
function parseTransaction(tx, walletAddress) {
  const walletAddressLower = walletAddress.toLowerCase();
  
  // Extract basic transaction info
  const parsed = {
    signature: tx.signature,
    timestamp: tx.timestamp,
    date: new Date(tx.timestamp * 1000).toISOString(),
    type: tx.type || 'UNKNOWN',
    fee: tx.fee || 0,
    feePayer: tx.feePayer || null,
    transfers: [],
  };

  // ONLY parse native SOL transfers - ignore tokenTransfers completely
  if (tx.nativeTransfers && tx.nativeTransfers.length > 0) {
    for (const transfer of tx.nativeTransfers) {
      const fromAddress = transfer.fromUserAccount || '';
      const toAddress = transfer.toUserAccount || '';
      const amount = transfer.amount / 1e9; // Convert lamports to SOL

      // Skip if amount is below dust threshold
      if (amount < MIN_SOL_THRESHOLD) continue;

      // Determine direction relative to tracked wallet
      let direction = 'unknown';
      let counterparty = null;

      if (fromAddress.toLowerCase() === walletAddressLower) {
        direction = 'outflow';
        counterparty = toAddress;
      } else if (toAddress.toLowerCase() === walletAddressLower) {
        direction = 'inflow';
        counterparty = fromAddress;
      }

      // Skip if no valid direction
      if (direction === 'unknown') continue;

      // Basic pattern check (detailed check happens later with account info)
      if (!isLikelyUserWallet(counterparty)) continue;

      parsed.transfers.push({
        token: 'SOL',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount,
        direction,
        counterparty,
        fromAddress,
        toAddress,
      });
    }
  }

  // Only return transactions that have relevant SOL transfers
  if (parsed.transfers.length === 0) {
    return null;
  }

  // Add summary fields for convenience
  parsed.primaryTransfer = parsed.transfers[0];
  parsed.direction = parsed.primaryTransfer.direction;
  parsed.counterparty = parsed.primaryTransfer.counterparty;
  parsed.amount = parsed.primaryTransfer.amount;
  parsed.token = 'SOL'; // Always SOL now

  return parsed;
}

/**
 * Fetches a single transaction by signature
 * @param {string} signature - The transaction signature
 * @returns {Promise<Object>} - The transaction data
 */
export async function fetchTransaction(signature) {
  if (!HELIUS_API_KEY || HELIUS_API_KEY === 'your_helius_api_key_here') {
    throw new HeliusApiError('Helius API key is not configured.');
  }

  const url = `${HELIUS_BASE_URL}/transactions/?api-key=${HELIUS_API_KEY}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactions: [signature],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new HeliusApiError(
        `Failed to fetch transaction: ${response.statusText}`,
        response.status,
        errorText
      );
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    if (error instanceof HeliusApiError) {
      throw error;
    }
    throw new HeliusApiError(
      `Failed to fetch transaction: ${error.message}`,
      null,
      error
    );
  }
}

export { HeliusApiError };
