// Utility functions for generating and managing worker burner wallets
import { ethers } from 'ethers';

export interface BurnerWallet {
    address: string;
    privateKey: string;
    mnemonic: string | null;
}

/**
 * Generates a new random burner wallet for worker nodes
 * Similar to EthPrivateKey.createRandom() in Flutter app
 */
export const generateBurnerWallet = (): BurnerWallet => {
    const wallet = ethers.Wallet.createRandom();

    return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic?.phrase || null
    };
};

/**
 * Validates if a string is a valid Ethereum private key
 */
export const isValidPrivateKey = (key: string): boolean => {
    try {
        new ethers.Wallet(key);
        return true;
    } catch {
        return false;
    }
};

/**
 * Downloads worker credentials as a JSON file
 */
export const downloadCredentials = (wallet: BurnerWallet) => {
    const credentials = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic,
        generatedAt: new Date().toISOString(),
        warning: 'KEEP THIS FILE SECURE! Anyone with this private key can control this worker.'
    };

    const blob = new Blob([JSON.stringify(credentials, null, 2)], {
        type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `peerhost-worker-${wallet.address.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Formats an address for display (0x1234...5678)
 */
export const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Formats POL amount with proper decimals
 */
export const formatPOL = (wei: bigint | string): string => {
    try {
        const value = typeof wei === 'string' ? BigInt(wei) : wei;
        return ethers.formatEther(value);
    } catch {
        return '0';
    }
};

/**
 * Parses POL amount to wei
 */
export const parsePOL = (amount: string): bigint => {
    try {
        return ethers.parseEther(amount);
    } catch {
        return BigInt(0);
    }
};
