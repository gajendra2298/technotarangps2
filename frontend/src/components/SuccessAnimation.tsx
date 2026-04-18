import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

export function SuccessAnimation() {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-gradient-to-b from-green-500/20 to-transparent rounded-[3rem] border border-green-500/20 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-green-500/5 blur-3xl rounded-full animate-pulse" />
      
      {/* Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{ 
            opacity: [0, 1, 0], 
            scale: [0, 1, 0.5],
            x: (i % 2 === 0 ? 1 : -1) * (Math.random() * 100),
            y: (i < 3 ? 1 : -1) * (Math.random() * 100)
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            delay: i * 0.2,
            ease: "easeOut" 
          }}
          className="absolute"
        >
          <Sparkles className="w-4 h-4 text-green-400" />
        </motion.div>
      ))}

      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
        className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.5)] relative z-10"
      >
        <Check className="w-12 h-12 text-white" strokeWidth={4} />
      </motion.div>

      <div className="relative z-10 text-center">
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-black mt-6 bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent"
        >
          TRANSACTION SECURED
        </motion.h3>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm font-bold text-muted-foreground mt-2 uppercase tracking-widest"
        >
          Funds successfully released to freelancer
        </motion.p>
      </div>
    </div>
  );
}
