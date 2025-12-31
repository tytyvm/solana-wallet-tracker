import { getCexInfo } from './walletFilters';

// Price constants for value filtering
const SOL_PRICE_USD = 200; // Approximate SOL price in USD
const MIN_VALUE_USD = 2; // Minimum transaction value in USD
const MIN_SOL_VALUE = MIN_VALUE_USD / SOL_PRICE_USD; // = 0.01 SOL

/**
 * Processes raw transaction data and structures it for tree visualization
 * Filters applied:
 * 1. Minimum $2 USD value per transaction
 * 2. Known program blocklist (via accountsInfo)
 * 3. ATA/Token accounts (via accountsInfo)
 * 
 * @param {Array} transactions - Array of parsed transactions from heliusApi
 * @param {string} rootWalletAddress - The wallet address being tracked
 * @param {Map} accountsInfo - Map of address -> account info from Helius API
 * @returns {Object} - Tree-structured data for visualization
 */
export function processTransactions(transactions, rootWalletAddress, accountsInfo = new Map()) {
  if (!transactions || transactions.length === 0) {
    return createEmptyTreeData(rootWalletAddress);
  }

  // Group transactions by counterparty
  const counterpartyMap = new Map();
  let filteredByValue = 0;
  let filteredByAccountType = 0;

  for (const tx of transactions) {
    // Process all transfers in the transaction
    for (const transfer of tx.transfers) {
      const { counterparty, direction, amount, token, tokenMint } = transfer;

      if (!counterparty) continue;

      // FILTER 1: Minimum value filter ($2 USD = 0.01 SOL)
      if (amount < MIN_SOL_VALUE) {
        filteredByValue++;
        continue;
      }

      // FILTER 2: Check account type from Helius API
      // Filters out: programs, programData, token accounts, ATAs
      const accountInfo = accountsInfo.get(counterparty);
      if (accountInfo && !accountInfo.isValid) {
        filteredByAccountType++;
        console.log(`Filtered: ${counterparty.slice(0, 8)}... (${accountInfo.accountType})`);
        continue;
      }

      // Initialize counterparty entry if not exists
      if (!counterpartyMap.has(counterparty)) {
        const cexInfo = getCexInfo(counterparty);
        
        counterpartyMap.set(counterparty, {
          address: counterparty,
          totalSent: 0,
          totalReceived: 0,
          transactionCount: 0,
          transactions: [],
          tokensSent: new Map(),
          tokensReceived: new Map(),
          tokensInvolved: new Set(),
          firstInteraction: tx.timestamp,
          lastInteraction: tx.timestamp,
          // CEX wallet info
          isCex: !!cexInfo,
          cexName: cexInfo?.name || null,
          cexLabel: cexInfo?.label || null,
          // Account type from Helius
          accountType: accountInfo?.accountType || 'unknown',
        });
      }

      const counterpartyData = counterpartyMap.get(counterparty);

      // Update stats based on direction
      if (direction === 'outflow') {
        counterpartyData.totalSent += amount;
        addTokenAmount(counterpartyData.tokensSent, token, tokenMint, amount);
      } else if (direction === 'inflow') {
        counterpartyData.totalReceived += amount;
        addTokenAmount(counterpartyData.tokensReceived, token, tokenMint, amount);
      }

      // Track tokens involved
      counterpartyData.tokensInvolved.add(token);

      // Update timestamps
      if (tx.timestamp < counterpartyData.firstInteraction) {
        counterpartyData.firstInteraction = tx.timestamp;
      }
      if (tx.timestamp > counterpartyData.lastInteraction) {
        counterpartyData.lastInteraction = tx.timestamp;
      }

      // Add transaction reference (avoid duplicates)
      if (!counterpartyData.transactions.find(t => t.signature === tx.signature)) {
        counterpartyData.transactions.push({
          signature: tx.signature,
          timestamp: tx.timestamp,
          direction,
          amount,
          token,
        });
        counterpartyData.transactionCount++;
      }
    }
  }

  // Log summary
  const totalFiltered = filteredByValue + filteredByAccountType;
  console.log(`\n📊 Filtering Summary:`);
  console.log(`   Filtered by value (<$${MIN_VALUE_USD}): ${filteredByValue} transfers`);
  console.log(`   Filtered by account type: ${filteredByAccountType} addresses`);
  console.log(`   Showing: ${counterpartyMap.size} wallets\n`);

  // Convert to tree structure with filter stats
  const treeData = buildTreeData(rootWalletAddress, counterpartyMap);
  
  // Add filter stats
  treeData.stats.filteredByValue = filteredByValue;
  treeData.stats.filteredByAccountType = filteredByAccountType;
  treeData.stats.totalFiltered = totalFiltered;
  treeData.stats.minValueUsd = MIN_VALUE_USD;
  treeData.stats.solPriceUsd = SOL_PRICE_USD;

  return treeData;
}

/**
 * Creates an empty tree data structure
 * @param {string} rootWalletAddress - The root wallet address
 * @returns {Object} - Empty tree structure
 */
function createEmptyTreeData(rootWalletAddress) {
  return {
    root: {
      id: rootWalletAddress,
      address: rootWalletAddress,
      label: truncateAddress(rootWalletAddress),
      isRoot: true,
    },
    nodes: [{
      id: rootWalletAddress,
      address: rootWalletAddress,
      label: truncateAddress(rootWalletAddress),
      isRoot: true,
    }],
    edges: [],
    stats: {
      totalCounterparties: 0,
      totalTransactions: 0,
      totalSent: 0,
      totalReceived: 0,
      tokensInvolved: ['SOL'],
      cexCount: 0,
      filteredByValue: 0,
      filteredByAccountType: 0,
      totalFiltered: 0,
    },
  };
}

/**
 * Builds the tree data structure from counterparty map
 * @param {string} rootWalletAddress - The root wallet address
 * @param {Map} counterpartyMap - Map of counterparty data
 * @returns {Object} - Tree structure for visualization
 */
function buildTreeData(rootWalletAddress, counterpartyMap) {
  const nodes = [];
  const edges = [];
  let totalSent = 0;
  let totalReceived = 0;
  let totalTransactions = 0;
  let cexCount = 0;
  const allTokens = new Set();

  // Create root node
  const rootNode = {
    id: rootWalletAddress,
    address: rootWalletAddress,
    label: truncateAddress(rootWalletAddress),
    isRoot: true,
  };
  nodes.push(rootNode);

  // Create child nodes and edges for each counterparty
  for (const [address, data] of counterpartyMap) {
    // Calculate net flow
    const netFlow = data.totalReceived - data.totalSent;
    
    // Convert token maps to arrays
    const tokensSentArray = mapToTokenArray(data.tokensSent);
    const tokensReceivedArray = mapToTokenArray(data.tokensReceived);

    // Count CEX wallets
    if (data.isCex) cexCount++;

    // Create child node
    const childNode = {
      id: address,
      address: address,
      label: data.isCex ? data.cexName : truncateAddress(address),
      isRoot: false,
      isCex: data.isCex,
      cexName: data.cexName,
      cexLabel: data.cexLabel,
      accountType: data.accountType,
      stats: {
        totalSent: data.totalSent,
        totalReceived: data.totalReceived,
        netFlow,
        transactionCount: data.transactionCount,
        tokensInvolved: Array.from(data.tokensInvolved),
        tokensSent: tokensSentArray,
        tokensReceived: tokensReceivedArray,
        firstInteraction: data.firstInteraction,
        lastInteraction: data.lastInteraction,
        firstInteractionDate: new Date(data.firstInteraction * 1000).toISOString(),
        lastInteractionDate: new Date(data.lastInteraction * 1000).toISOString(),
      },
      transactions: data.transactions.sort((a, b) => b.timestamp - a.timestamp),
    };
    nodes.push(childNode);

    // Create edge from root to child
    const edge = {
      id: `${rootWalletAddress}-${address}`,
      source: rootWalletAddress,
      target: address,
      data: {
        totalSent: data.totalSent,
        totalReceived: data.totalReceived,
        netFlow,
        transactionCount: data.transactionCount,
        tokensSent: tokensSentArray,
        tokensReceived: tokensReceivedArray,
        // Direction indicates primary flow direction
        primaryDirection: netFlow >= 0 ? 'inflow' : 'outflow',
        // Bidirectional if both sent and received
        isBidirectional: data.totalSent > 0 && data.totalReceived > 0,
      },
    };
    edges.push(edge);

    // Update totals
    totalSent += data.totalSent;
    totalReceived += data.totalReceived;
    totalTransactions += data.transactionCount;
    data.tokensInvolved.forEach(token => allTokens.add(token));
  }

  // Sort nodes by transaction count (most active first, root always first)
  nodes.sort((a, b) => {
    if (a.isRoot) return -1;
    if (b.isRoot) return 1;
    return (b.stats?.transactionCount || 0) - (a.stats?.transactionCount || 0);
  });

  // Sort edges by transaction count
  edges.sort((a, b) => b.data.transactionCount - a.data.transactionCount);

  return {
    root: rootNode,
    nodes,
    edges,
    stats: {
      totalCounterparties: counterpartyMap.size,
      totalTransactions,
      totalSent,
      totalReceived,
      netFlow: totalReceived - totalSent,
      tokensInvolved: Array.from(allTokens),
      cexCount,
    },
  };
}

/**
 * Adds token amount to a token map
 * @param {Map} tokenMap - Map of token -> { symbol, mint, amount }
 * @param {string} symbol - Token symbol
 * @param {string} mint - Token mint address
 * @param {number} amount - Amount to add
 */
function addTokenAmount(tokenMap, symbol, mint, amount) {
  const key = mint || symbol;
  if (!tokenMap.has(key)) {
    tokenMap.set(key, {
      symbol,
      mint,
      amount: 0,
    });
  }
  tokenMap.get(key).amount += amount;
}

/**
 * Converts a token map to an array
 * @param {Map} tokenMap - Map of token data
 * @returns {Array} - Array of token objects
 */
function mapToTokenArray(tokenMap) {
  return Array.from(tokenMap.values()).sort((a, b) => b.amount - a.amount);
}

/**
 * Truncates a wallet address for display
 * @param {string} address - Full wallet address
 * @param {number} startChars - Characters to show at start
 * @param {number} endChars - Characters to show at end
 * @returns {string} - Truncated address
 */
function truncateAddress(address, startChars = 4, endChars = 4) {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Gets the top N counterparties by transaction count
 * @param {Object} treeData - Processed tree data
 * @param {number} limit - Maximum number of counterparties to return
 * @returns {Array} - Top counterparty nodes
 */
export function getTopCounterparties(treeData, limit = 10) {
  return treeData.nodes
    .filter(node => !node.isRoot)
    .slice(0, limit);
}

/**
 * Filters tree data by token
 * @param {Object} treeData - Processed tree data
 * @param {string} token - Token symbol to filter by
 * @returns {Object} - Filtered tree data
 */
export function filterByToken(treeData, token) {
  const filteredNodes = treeData.nodes.filter(node => {
    if (node.isRoot) return true;
    return node.stats?.tokensInvolved?.includes(token);
  });

  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = treeData.edges.filter(edge => 
    filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
  );

  return {
    ...treeData,
    nodes: filteredNodes,
    edges: filteredEdges,
  };
}

/**
 * Filters tree data by minimum transaction count
 * @param {Object} treeData - Processed tree data
 * @param {number} minCount - Minimum transaction count
 * @returns {Object} - Filtered tree data
 */
export function filterByMinTransactions(treeData, minCount) {
  const filteredNodes = treeData.nodes.filter(node => {
    if (node.isRoot) return true;
    return (node.stats?.transactionCount || 0) >= minCount;
  });

  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = treeData.edges.filter(edge => 
    filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
  );

  return {
    ...treeData,
    nodes: filteredNodes,
    edges: filteredEdges,
  };
}

/**
 * Gets only CEX wallets from the tree data
 * @param {Object} treeData - Processed tree data
 * @returns {Array} - CEX wallet nodes
 */
export function getCexWallets(treeData) {
  return treeData.nodes.filter(node => node.isCex);
}

/**
 * Filters wallets based on account info validity
 * @param {Array} addresses - Array of addresses
 * @param {Map} accountsInfo - Map of address -> account info
 * @returns {Array} - Valid addresses only
 */
export function filterValidWallets(addresses, accountsInfo) {
  return addresses.filter(addr => {
    const info = accountsInfo.get(addr);
    return !info || info.isValid;
  });
}

// Export constants for UI display
export { MIN_VALUE_USD, SOL_PRICE_USD, MIN_SOL_VALUE };
