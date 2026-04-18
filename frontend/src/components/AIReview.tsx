import { AlertTriangle, Scale, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui';
import { motion } from 'framer-motion';

interface AIReviewProps {
  confidence: number;
  feedback: string;
  className?: string;
  onRaiseDispute?: () => void;
}

export function AIReview({ confidence, feedback, className, onRaiseDispute }: AIReviewProps) {
  const isHighConfidence = confidence >= 0.8;
  const isRisky = confidence < 0.6;
  const percentage = Math.round(confidence * 100);

  // Split feedback into reasoning points for better UX
  const reasoningPoints = feedback.split('.').filter(p => p.trim().length > 5);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-6 rounded-3xl border transition-all duration-700 relative overflow-hidden",
        isHighConfidence 
          ? "bg-green-500/5 border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]" 
          : isRisky
            ? "bg-red-500/5 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
            : "bg-amber-500/5 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]",
        className
      )}
    >
      {/* Dynamic Glow Background */}
      <div className={cn(
        "absolute -right-12 -top-12 w-32 h-32 blur-3xl rounded-full opacity-20 animate-pulse",
        isHighConfidence ? "bg-green-500" : isRisky ? "bg-red-500" : "bg-amber-500"
      )} />

      <div className="flex items-start gap-5 relative z-10">
        <div className={cn(
          "p-3 rounded-2xl border shadow-inner",
          isHighConfidence 
            ? "bg-green-500/10 border-green-500/20 text-green-500" 
            : isRisky
              ? "bg-red-500/10 border-red-500/20 text-red-500"
              : "bg-amber-500/10 border-amber-500/20 text-amber-500"
        )}>
          {isHighConfidence ? <Scale className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-black text-xs tracking-[0.2em] uppercase text-muted-foreground">
                SMART ARBITRATOR VERDICT
              </h4>
              <p className={cn(
                "text-xl font-black tracking-tight",
                isHighConfidence ? "text-green-500" : isRisky ? "text-red-500" : "text-amber-500"
              )}>
                {isHighConfidence ? "VERIFIED & SAFE" : isRisky ? "HIGH RISK DETECTED" : "MANUAL REVIEW SUGGESTED"}
              </p>
            </div>
            <div className={cn(
              "px-4 py-2 rounded-2xl text-xs font-black border backdrop-blur-md",
              isHighConfidence 
                ? "bg-green-500/20 border-green-500/30 text-green-400" 
                : isRisky
                  ? "bg-red-500/20 border-red-500/30 text-red-400"
                  : "bg-amber-500/20 border-amber-500/30 text-amber-400"
            )}>
              {percentage}% CONFIDENCE
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
               <p className="text-sm font-bold text-foreground/90">AI Observations:</p>
               <ul className="space-y-2">
                 {reasoningPoints.map((point, i) => (
                   <li key={i} className="flex gap-2 text-sm text-muted-foreground bg-secondary/30 p-2.5 rounded-xl border border-white/5">
                     <div className={cn("mt-1.5 w-1.5 h-1.5 rounded-full shrink-0", isHighConfidence ? "bg-green-500" : "bg-amber-500")} />
                     {point.trim()}
                   </li>
                 ))}
               </ul>
            </div>
            
            {/* Confidence Progress Bar */}
            <div className="space-y-2 pt-2">
              <div className="h-2 w-full bg-foreground/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={cn(
                    "h-full relative",
                    isHighConfidence ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : isRisky ? "bg-red-500" : "bg-amber-500"
                  )}
                />
              </div>
            </div>

            {isRisky && (
              <div className="pt-2 flex flex-col gap-3">
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-400 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  AI suggests raising a dispute for this submission.
                </div>
                <Button 
                  onClick={onRaiseDispute}
                  variant="destructive" 
                  className="w-full h-11 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 shadow-2xl shadow-red-500/20"
                >
                  <ShieldAlert className="w-4 h-4" /> Raise Official Dispute
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
