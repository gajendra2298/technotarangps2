import { useWriteContract, useWaitForTransactionReceipt, useConfig } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { abi } from '../lib/abi';
import { toast } from 'sonner';

// Default to a placeholder if not in env
const ESCROW_ADDRESS = (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS as `0x${string}`) || '0x62803b9487a315487a315487a315487a315487a3'; 

export function useEscrow() {
  const config = useConfig();
  const { writeContractAsync, data: hash, isPending: isWritePending, error: writeError } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createAndFundProject = async (
    freelancer: `0x${string}`,
    descriptions: string[],
    amounts: bigint[],
    totalAmount: bigint
  ) => {
    try {
      const hash = await writeContractAsync({
        address: ESCROW_ADDRESS,
        abi,
        functionName: 'createAndFundProject',
        args: [freelancer, descriptions, amounts],
        value: totalAmount,
      });
      toast.info('Deployment & Funding transaction sent. Waiting for confirmation...');
      await waitForTransactionReceipt(config, { hash });
      toast.success('Project deployed and funded!');
      return hash;
    } catch (err: any) {
      toast.error(err.message || 'Failed to create and fund project');
      throw err;
    }
  };

  const fundProject = async (projectId: number, amount: bigint) => {
    try {
      const hash = await writeContractAsync({
        address: ESCROW_ADDRESS,
        abi,
        functionName: 'fundProject',
        args: [BigInt(projectId)],
        value: amount,
      });
      toast.info('Funding transaction sent. Waiting for confirmation...');
      await waitForTransactionReceipt(config, { hash });
      toast.success('Funding confirmed!');
      return hash;
    } catch (err: any) {
      toast.error(err.message || 'Failed to fund project');
      throw err;
    }
  };

  const assignFreelancer = async (projectId: number, freelancerAddress: `0x${string}`) => {
    try {
      const hash = await writeContractAsync({
        address: ESCROW_ADDRESS,
        abi,
        functionName: 'assignFreelancer',
        args: [BigInt(projectId), freelancerAddress],
      });
      toast.info('Assignment transaction sent. Waiting for confirmation...');
      await waitForTransactionReceipt(config, { hash });
      toast.success('Freelancer assigned on-chain!');
      return hash;
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign freelancer');
      throw err;
    }
  };

  const releasePayment = async (projectId: number, milestoneId: number) => {
    try {
      const hash = await writeContractAsync({
        address: ESCROW_ADDRESS,
        abi,
        functionName: 'releasePayment',
        args: [BigInt(projectId), BigInt(milestoneId)],
      });
      toast.info('Release transaction sent. Waiting for confirmation...');
      await waitForTransactionReceipt(config, { hash });
      toast.success('Payment released!');
      return hash;
    } catch (err: any) {
      toast.error(err.message || 'Failed to release payment');
      throw err;
    }
  };

  return {
    createAndFundProject,
    fundProject,
    assignFreelancer,
    releasePayment,
    isPending: isWritePending || isTxLoading,
    isSuccess: isTxSuccess,
    hash,
    error: writeError,
  };
}


