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

  const approveMilestone = async (projectId: number, milestoneId: number) => {
    try {
      const hash = await writeContractAsync({
        address: ESCROW_ADDRESS,
        abi,
        functionName: 'approveMilestone',
        args: [BigInt(projectId), BigInt(milestoneId)],
      });
      toast.info('Approval transaction sent. Waiting for confirmation...');
      await waitForTransactionReceipt(config, { hash });
      toast.success('Approval confirmed!');
      return hash;
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve milestone');
      throw err;
    }
  };

  return {
    fundProject,
    approveMilestone,
    isPending: isWritePending || isTxLoading,
    isSuccess: isTxSuccess,
    hash,
    error: writeError,
  };
}

