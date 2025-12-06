
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';

interface WalletContextType {
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);

  const connect = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const addr = await signer.getAddress();
        setAddress(addr);
        localStorage.setItem('walletAddress', addr);
      } catch (err) {
        console.error("User rejected request", err);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const disconnect = () => {
    setAddress(null);
    localStorage.removeItem('walletAddress');
  };

  // Auto-connect if potential previously connected
  useEffect(() => {
    const saved = localStorage.getItem('walletAddress');
    if (saved) {
        // Verify if still connected
        if (window.ethereum) {
            new BrowserProvider(window.ethereum).listAccounts().then(accounts => {
                if (accounts.length > 0) {
                    setAddress(accounts[0].address);
                } else {
                    localStorage.removeItem('walletAddress');
                }
            }).catch(() => localStorage.removeItem('walletAddress'));
        }
    }
  }, []);

  return (
    <WalletContext.Provider value={{ address, connect, disconnect, isConnected: !!address }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
