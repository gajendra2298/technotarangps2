import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface Milestone {
  title: string;
  description: string;
  amount: number;
  status: string;
}

export function MilestoneTimeline({ milestones }: { milestones: Milestone[] }) {
  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
      {milestones.map((m, index) => (
        <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          {/* Dot */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-card shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
            {m.status === 'APPROVED' ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : m.status === 'SUBMITTED' ? (
              <Clock className="w-5 h-5 text-purple-500 animate-pulse" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          {/* Card */}
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border glass">
            <div className="flex items-center justify-between space-x-2 mb-1">
              <div className="font-bold text-foreground">{m.title}</div>
              <StatusBadge status={m.status} />
            </div>
            <div className="text-sm text-muted-foreground">{m.description}</div>
            <div className="mt-2 text-xs font-mono text-primary">
              {(m.amount / 1e18).toFixed(2)} ETH
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
