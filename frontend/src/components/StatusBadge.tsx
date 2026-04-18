import { cn } from "./ui";

export const MilestoneStatus = {
  PENDING: 'PENDING',
  FUNDED: 'FUNDED',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  DISPUTED: 'DISPUTED',
  RESOLVED: 'RESOLVED',
} as const;

export type MilestoneStatusType = typeof MilestoneStatus[keyof typeof MilestoneStatus];

const statusStyles: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  OPEN: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  FUNDED: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  IN_PROGRESS: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
  SUBMITTED: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  APPROVED: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  COMPLETED: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  DISPUTED: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  RESOLVED: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <div className={cn(
      "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
      statusStyles[status] || statusStyles.PENDING
    )}>
      {status}
    </div>
  );
}
