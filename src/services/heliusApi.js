const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY;
const HELIUS_BASE_URL = 'https://api.helius.xyz/v0';

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
 * Fetches all transactions for a wallet address from the past 30 days
 * @param {string} walletAddress - The Solana wallet address
 * @returns {Promise<Array>} - Array of parsed transaction data
 */
export async function fetchWalletTransactions(walletAddress) {
  if (!HELIUS_API_KEY || HELIUS_API_KEY === 'your_helius_api_key_here') {
    throw new HeliusApiError('Helius API key is not configured. Please add your API key to the .env file.');
  }

  if (!walletAddress) {
    throw new HeliusApiError('Wallet address is required');
  }

  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
  const allTransactions = [];
  let beforeSignature = null;
  let hasMore = true;

  try {
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
        
        // Stop if we've gone past 30 days
        if (timestamp < thirtyDaysAgo) {
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

  // Parse native SOL transfers
  if (tx.nativeTransfers && tx.nativeTransfers.length > 0) {
    for (const transfer of tx.nativeTransfers) {
      const fromAddress = transfer.fromUserAccount || '';
      const toAddress = transfer.toUserAccount || '';
      const amount = transfer.amount / 1e9; // Convert lamports to SOL

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

      if (direction !== 'unknown' && amount > 0) {
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
  }

  // Parse SPL token transfers
  if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
    for (const transfer of tx.tokenTransfers) {
      const fromAddress = transfer.fromUserAccount || '';
      const toAddress = transfer.toUserAccount || '';
      const amount = transfer.tokenAmount || 0;
      const tokenMint = transfer.mint || 'Unknown';
      const tokenSymbol = transfer.tokenStandard === 'Fungible' 
        ? (transfer.symbol || tokenMint.slice(0, 8)) 
        : 'NFT';

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

      if (direction !== 'unknown') {
        parsed.transfers.push({
          token: tokenSymbol,
          tokenMint,
          amount,
          direction,
          counterparty,
          fromAddress,
          toAddress,
        });
      }
    }
  }

  // Only return transactions that have relevant transfers
  if (parsed.transfers.length === 0) {
    return null;
  }

  // Add summary fields for convenience
  parsed.primaryTransfer = parsed.transfers[0];
  parsed.direction = parsed.primaryTransfer.direction;
  parsed.counterparty = parsed.primaryTransfer.counterparty;
  parsed.amount = parsed.primaryTransfer.amount;
  parsed.token = parsed.primaryTransfer.token;

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

