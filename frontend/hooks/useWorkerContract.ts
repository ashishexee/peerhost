// React hook for interacting with ExecutionCoordinator contract
import { useState, useCallback } from 'react';
import { ethers, BrowserProvider, Contract } from 'ethers';
import ExecutionCoordinatorABI from '../abi/ExecutionCoordinator.json';

const CONTRACT_ADDRESS = process.env.VITE_EXECUTION_CONTRACT_ADDRESS || '';
const MIN_STAKE_WEI = ethers.parseEther('2'); // 2 POL

export interface WorkerStakeInfo {
    stakedAmount: bigint;
    isBlacklisted: boolean;
    probationCount: bigint;
    penaltyDeposited: bigint;
}

interface ContractError {
    code?: string;
    message: string;
    reason?: string;
}

export const useWorkerContract = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getContract = useCallback(async (withSigner = true) => {
        if (!window.ethereum) {
            throw new Error('No ethereum wallet found. Please install MetaMask.');
        }

        const provider = new BrowserProvider(window.ethereum);
        const signer = withSigner ? await provider.getSigner() : null;

        return new Contract(
            CONTRACT_ADDRESS,
            ExecutionCoordinatorABI,
            signer || provider
        );
    }, []);

    const handleError = useCallback((err: unknown) => {
        const error = err as ContractError;
        console.error('Contract error:', error);

        // Parse common error messages
        if (error.message?.includes('user rejected')) {
            setError('Transaction rejected by user');
        } else if (error.reason) {
            setError(error.reason);
        } else if (error.message) {
            setError(error.message);
        } else {
            setError('An unexpected error occurred');
        }
    }, []);

    const registerWorker = async (workerAddress: string): Promise<string> => {
        setIsLoading(true);
        setError(null);

        try {
            const contract = await getContract(true);
            const tx = await contract.registerWorker(workerAddress);

            console.log('Register worker tx:', tx.hash);
            await tx.wait();

            return tx.hash;
        } catch (err) {
            handleError(err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const stakeForWorker = async (
        workerAddress: string,
        amountPOL: string
    ): Promise<string> => {
        setIsLoading(true);
        setError(null);

        try {
            const amount = ethers.parseEther(amountPOL);

            if (amount < MIN_STAKE_WEI) {
                throw new Error('Stake amount must be at least 2 POL');
            }

            const contract = await getContract(true);
            const tx = await contract.stake(workerAddress, { value: amount });

            console.log('Stake tx:', tx.hash);
            await tx.wait();

            return tx.hash;
        } catch (err) {
            handleError(err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const getUserWorkers = async (userAddress: string): Promise<string[]> => {
        setIsLoading(true);
        setError(null);

        try {
            const contract = await getContract(false);
            const workers = await contract.getUserWorkers(userAddress);
            return workers;
        } catch (err) {
            handleError(err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const getWorkerStakeInfo = async (
        workerAddress: string
    ): Promise<WorkerStakeInfo> => {
        setIsLoading(true);
        setError(null);

        try {
            const contract = await getContract(false);
            const info = await contract.workerStakes(workerAddress);

            return {
                stakedAmount: info[0],
                isBlacklisted: info[1],
                probationCount: info[2],
                penaltyDeposited: info[3]
            };
        } catch (err) {
            handleError(err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const withdrawStake = async (
        workerAddress: string,
        amountPOL: string
    ): Promise<string> => {
        setIsLoading(true);
        setError(null);

        try {
            const amount = ethers.parseEther(amountPOL);
            const contract = await getContract(true);
            const tx = await contract.withdrawStake(workerAddress, amount);

            console.log('Withdraw stake tx:', tx.hash);
            await tx.wait();

            return tx.hash;
        } catch (err) {
            handleError(err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const getMinStake = async (): Promise<bigint> => {
        try {
            const contract = await getContract(false);
            return await contract.MIN_STAKE();
        } catch (err) {
            handleError(err);
            return MIN_STAKE_WEI;
        }
    };

    return {
        registerWorker,
        stakeForWorker,
        getUserWorkers,
        getWorkerStakeInfo,
        withdrawStake,
        getMinStake,
        isLoading,
        error,
        clearError: () => setError(null)
    };
};
