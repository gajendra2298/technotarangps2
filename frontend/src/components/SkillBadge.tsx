import { cn } from './ui';

export function SkillBadge({ skill, className }: { skill: string; className?: string }) {
  return (
    <span 
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20",
        className
      )}
    >
      {skill}
    </span>
  );
}
