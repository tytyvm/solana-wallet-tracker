/**
 * Known Wallets Database
 * Contains program blocklist, CEX wallets, and wallet identification functions
 */

/**
 * Known Solana program addresses to filter out
 * These are not user wallets and should be excluded from the tree
 */
export const PROGRAM_BLOCKLIST = [
  // Core System Programs
  { address: '11111111111111111111111111111111', name: 'System Program' },
  { address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', name: 'Token Program' },
  { address: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb', name: 'Token-2022 Program' },
  { address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL', name: 'Associated Token Program' },
  { address: 'ComputeBudget111111111111111111111111111111', name: 'Compute Budget Program' },
  { address: 'Vote111111111111111111111111111111111111111', name: 'Vote Program' },
  { address: 'Stake11111111111111111111111111111111111111', name: 'Stake Program' },
  { address: 'Config1111111111111111111111111111111111111', name: 'Config Program' },
  { address: 'BPFLoader1111111111111111111111111111111111', name: 'BPF Loader' },
  { address: 'BPFLoader2111111111111111111111111111111111', name: 'BPF Loader 2' },
  { address: 'BPFLoaderUpgradeab1e11111111111111111111111', name: 'BPF Upgradeable Loader' },
  
  // Sysvar Accounts
  { address: 'SysvarRent111111111111111111111111111111111', name: 'Rent Sysvar' },
  { address: 'SysvarC1ock11111111111111111111111111111111', name: 'Clock Sysvar' },
  { address: 'SysvarFees111111111111111111111111111111111', name: 'Fees Sysvar' },
  { address: 'SysvarRecentB1ockHashes11111111111111111111', name: 'Recent Blockhashes' },
  { address: 'SysvarS1otHashes111111111111111111111111111', name: 'Slot Hashes' },
  { address: 'SysvarStakeHistory1111111111111111111111111', name: 'Stake History' },
  { address: 'SysvarEpochSchewordu1e111111111111111111111', name: 'Epoch Schedule' },
  { address: 'SysvarInstructions1111111111111111111111111', name: 'Instructions Sysvar' },
  
  // DEX Programs
  { address: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', name: 'Jupiter v6' },
  { address: 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB', name: 'Jupiter v4' },
  { address: 'JUP3c2Uh3WA4Ng34tw6kPd2G4C5BB21Xo36Je1s32Ph', name: 'Jupiter v3' },
  { address: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc', name: 'Orca Whirlpool' },
  { address: '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP', name: 'Orca Swap v2' },
  { address: 'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX', name: 'Serum DEX v3' },
  { address: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', name: 'Raydium AMM' },
  { address: 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK', name: 'Raydium CLMM' },
  { address: 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo', name: 'Meteora DLMM' },
  
  // NFT & Metaplex Programs
  { address: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s', name: 'Metaplex Token Metadata' },
  { address: 'p1exdMJcjVao65QdewkaZRUnU6VPSXhus9n2GzWfh98', name: 'Metaplex Core' },
  { address: 'AUTH9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg', name: 'Metaplex Auth Rules' },
  { address: 'BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY', name: 'Metaplex Bubblegum' },
  { address: 'cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK', name: 'SPL Account Compression' },
  { address: 'TSWAPaqyCSx2KABk68Shruf4rp7CxcNi8hAsbdwmHbN', name: 'Tensor Swap' },
  { address: 'TCMPhJdwDryooaGtiocG1u3xcYbRpiJzb283XfCZsDp', name: 'Tensor cNFT' },
  { address: 'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K', name: 'Magic Eden v2' },
  { address: 'hausS13jsjafwWwGqZTUQRmWyvyxn9EQpqMwV1PBBmk', name: 'Metaplex Auction House' },
  
  // Lending & DeFi Programs
  { address: 'MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA', name: 'Marginfi' },
  { address: 'So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo', name: 'Solend' },
  { address: 'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1', name: 'Drift' },
  { address: 'JD3bq9hGdy38PuWQ4h2YJpELmHVGPPfFSuFkpzAd9zfu', name: 'Mango v4' },
  
  // Staking Programs
  { address: 'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD', name: 'Marinade' },
  { address: 'SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy', name: 'Stake Pool' },
  
  // Bridge Programs
  { address: 'worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth', name: 'Wormhole Token Bridge' },
  { address: 'WnFt12ZrnzZrFZkt2xsNsaNWoQribnuQ5B5FrDbwDhD', name: 'Wormhole NFT Bridge' },
  
  // Other Common Programs
  { address: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr', name: 'Memo Program' },
  { address: 'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo', name: 'Memo Program v1' },
  { address: 'namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX', name: 'Name Service' },
  { address: 'cndyAnrLdpjq1Ssp1z8xxDsB8dxe7u4HL5Nxi2K5WXZ', name: 'Candy Machine v2' },
  { address: 'cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ', name: 'Candy Machine v1' },
  { address: 'Guard1JwRhJkVH6XZhzoYxeBVQe872VH6QggF4BWmS9g', name: 'Candy Guard' },
  { address: 'DeJBGdMFa1uynnnKiwrVioatTuHmNLpyFKnmB5kaFdzQ', name: 'Phantom' },

  // Trading Bot & Aggregator Fee Wallets
  { address: 'AxiomRXZAq1Jgjj9pHmNqVP7Lhu67wLXZJZbaK87TTSk', name: 'Axiom Fee' },
  { address: 'AqhMydRvBH3nPdpsQVEJKoTTZCT2UMbBoMRZcVFL8vBy', name: 'ATA/Swap Account' },
];

// Create a Set for O(1) lookup
const PROGRAM_ADDRESS_SET = new Set(PROGRAM_BLOCKLIST.map(p => p.address));

// Create a Map for name lookup
const PROGRAM_NAME_MAP = new Map(PROGRAM_BLOCKLIST.map(p => [p.address, p.name]));

/**
 * Known CEX (Centralized Exchange) wallet addresses
 * Maps address -> exchange name
 */
export const CEX_WALLETS = {
  // Binance
  '5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9': 'Binance',
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM': 'Binance',
  '2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S': 'Binance',
  'AC5RDfQFmDS1deWZos921JfqscXdByf8BKHs5ACWjtW2': 'Binance',
  '3yFwqXBfZY4jBVUafQ1YEXw189y2dN3V5KQq9uzBDy1E': 'Binance',
  '6ZRCB7AAqGre6c72PRz3MHLC73VMYvJ8bi9KHf1HFpNk': 'Binance',
  
  // Coinbase
  'H8sMJSCQxfKiFTCfDR3DUMLPwcRbM61LGFJ8N4dK3WjS': 'Coinbase',
  'GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE': 'Coinbase',
  '2AQdpHJ2JpcEgPiATUXjQxA8QmafFegfQwSLWSprPicm': 'Coinbase',
  
  // Kraken
  'FWznbcNXWQuHTawe9RxvQ2LdCENssh12dsznf4RiouN5': 'Kraken',
  'krakloR7BhPV3WQXt1i5FBPWbfpGRfMj1JKwbCn8jC7': 'Kraken',
  
  // OKX
  '5VCwKtCXgCJ6kit5FybXjvriW3xELsFDhYrPSqtJNmcD': 'OKX',
  'ASTyfSima4LLAdDgoFGkgqoKowG1LZFDr9fAQrg7iaJZ': 'OKX',
  '5vZ8GEqoqSiDJkLxyXJCeggwfPyzMyKQdMJLKCG1MPNP': 'OKX',
  
  // Bybit
  'AC5RDfQFmDS1deWZos921JfqscXdByf8BKHs5ACWjtW3': 'Bybit',
  'BybitHoT1111111111111111111111111111111111': 'Bybit',
  
  // KuCoin
  'BmFdpraQhkiDQE6SnfG5omcA1VwzqfXrwtNYBwWTymy6': 'KuCoin',
  
  // Gate.io
  '7GgPYjS5Dza89wV6FpZ23kUJRG5vbQ1GM25ezspYFSoE': 'Gate.io',
  'u6PJ8DtQuPFnfmwHbGFULQ4u4EgjDiyYKjVEsynXq2w': 'Gate.io',
  
  // Huobi / HTX
  '88xTWZMeKfiTgbfEmPLdsUCQcZinwUfk25EBQZ21XMAZ': 'HTX',
  
  // Crypto.com
  '6FEVkH17P9y8Q9aCkDdPcMDjvj7SVxrTETaYEm8f51Jy': 'Crypto.com',
  'AobVSwdW9BbpMdJvTqeCN4hPAmh4rHm7vwLnQ5ATSyrS': 'Crypto.com',
  
  // Gemini
  'GeminiHoT11111111111111111111111111111111': 'Gemini',
  
  // Bitfinex
  'BC1YLhS6Gp8fJYsWvVvdpYK9JxYJ6GxVV5hWxBKiS3VD': 'Bitfinex',
  
  // Bitstamp
  'BitstampH0T111111111111111111111111111111': 'Bitstamp',
  
  // FTX (historical - defunct)
  'FTX7omXs6QPKgjr4GYb2BnMZL9jzNitXpC5mJC8nzp5': 'FTX (Defunct)',
};

/**
 * Identifies a wallet address and returns its type and name
 * @param {string} address - The wallet address to identify
 * @returns {Object} - { type: 'cex' | 'program' | 'user', name: string | null }
 */
export function identifyWallet(address) {
  if (!address || typeof address !== 'string') {
    return { type: 'unknown', name: null };
  }

  // Check if it's a known CEX wallet
  if (address in CEX_WALLETS) {
    return { type: 'cex', name: CEX_WALLETS[address] };
  }

  // Check if it's a known program
  if (PROGRAM_ADDRESS_SET.has(address)) {
    return { type: 'program', name: PROGRAM_NAME_MAP.get(address) };
  }

  // Check if it matches program patterns
  if (matchesProgramPattern(address)) {
    return { type: 'program', name: 'Unknown Program' };
  }

  // It's likely a regular user wallet
  return { type: 'user', name: null };
}

/**
 * Checks if an address matches known program patterns
 * @param {string} address - The address to check
 * @returns {boolean} - True if it matches program patterns
 */
export function matchesProgramPattern(address) {
  if (!address || typeof address !== 'string') return true;
  
  // Check if address ends with "1111" (common program suffix)
  if (address.endsWith('1111')) return true;
  
  // Check if address is all 1s
  if (/^1+$/.test(address)) return true;
  
  // Check if address has 8+ consecutive 1s
  if (/1{8,}/.test(address)) return true;
  
  // Check if starts with known program prefixes
  const programPrefixes = [
    'Sysvar', 'BPF', 'Vote1', 'Stake1', 'Config1', 
    'Token', 'AToken', 'Compute', 'Memo'
  ];
  for (const prefix of programPrefixes) {
    if (address.startsWith(prefix)) return true;
  }
  
  return false;
}

/**
 * Checks if an address is a known program
 * @param {string} address - The address to check
 * @returns {boolean}
 */
export function isProgram(address) {
  return PROGRAM_ADDRESS_SET.has(address) || matchesProgramPattern(address);
}

/**
 * Checks if an address is a known CEX wallet
 * @param {string} address - The address to check
 * @returns {boolean}
 */
export function isCex(address) {
  return address in CEX_WALLETS;
}

/**
 * Gets the CEX name for an address
 * @param {string} address - The address to check
 * @returns {string|null} - The exchange name or null
 */
export function getCexName(address) {
  return CEX_WALLETS[address] || null;
}

/**
 * Gets the program name for an address
 * @param {string} address - The address to check
 * @returns {string|null} - The program name or null
 */
export function getProgramName(address) {
  return PROGRAM_NAME_MAP.get(address) || null;
}

/**
 * Checks if an address is likely a user wallet (not a program or CEX)
 * @param {string} address - The address to check
 * @returns {boolean}
 */
export function isLikelyUserWallet(address) {
  if (!address || typeof address !== 'string') return false;
  if (address.length < 32 || address.length > 44) return false;
  
  const { type } = identifyWallet(address);
  return type === 'user';
}

