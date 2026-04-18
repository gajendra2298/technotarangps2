import { useState } from 'react';
import { 
  X, Plus, Trash2,
  Briefcase, 
  Loader2, Sparkles,
  ChevronRight
} from 'lucide-react';
import { Button, Card, CardContent } from './ui';
import { projectsApi } from '../lib/api';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { fetchProjects } from '../redux/slices/projectsSlice';
import { useEscrow } from '../hooks/useEscrow';
import { parseEther } from 'viem';
import { useAccount } from 'wagmi';

interface CreateProjectModalProps {
  onClose: () => void;
}

export function CreateProjectModal({ onClose }: CreateProjectModalProps) {
  const dispatch = useAppDispatch();
  const { address } = useAccount();
  const { user } = useAppSelector(state => state.auth);
  const { createAndFundProject } = useEscrow();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scope: '',
    deadline: '',
    budget: '',
  });

  const [milestones, setMilestones] = useState([
    { title: '', description: '', amount: '', deadline: '' }
  ]);

  const addMilestone = () => {
    setMilestones([...milestones, { title: '', description: '', amount: '', deadline: '' }]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length === 1) return;
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: string, value: string) => {
    const newMilestones = [...milestones];
    (newMilestones[index] as any)[field] = value;
    setMilestones(newMilestones);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      return toast.error("Please provide a project title");
    }

    if (milestones.some(m => !m.title || !m.amount)) {
      return toast.error("Please fill in milestone details");
    }

    if (!address) {
      return toast.error("Please connect your wallet first");
    }

    setLoading(true);
    try {
      const descriptions = milestones.map(m => m.description || m.title);
      const amounts = milestones.map(m => parseEther(m.amount || '0'));
      const totalAmountWei = amounts.reduce((acc, curr) => acc + curr, 0n);

      // 1. On-chain Transaction
      // Since it's an "OPEN" project, we use address(0) as placeholder for freelancer
      const hash = await createAndFundProject(
        "0x0000000000000000000000000000000000000000", 
        descriptions, 
        amounts, 
        totalAmountWei
      );
      // 2. Backend Sync
      const payload = {
        title: formData.title,
        description: formData.description,
        scope: formData.scope,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
        budget: formData.budget ? parseFloat(formData.budget) : 0,
        clientId: user?._id,
        clientAddress: address,
        contractAddress: import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || "0x62803b9487a315487a315487a315487a315487a3",
        blockchainId: Date.now(), // This would be fetched from logs in real app
        milestones: milestones.map(m => ({
          ...m,
          amount: parseEther(m.amount).toString(), // Store as string (wei)
          deadline: m.deadline ? new Date(m.deadline).toISOString() : undefined,
          status: 'FUNDED'
        }))
      };

      await projectsApi.createAndFund(hash, payload);
      toast.success("Project funded and deployed successfully! 🔒");
      dispatch(fetchProjects());
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create project");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60]  flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar border-primary/20 bg-card/50 shadow-2xl animate-in zoom-in-95 duration-300 rounded-3xl">
        <div className="sticky top-0 bg-card/80 backdrop-blur-md p-6 border-b z-10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-black tracking-tight">Initialize Workstream</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
              <Briefcase className="w-3 h-3" /> Project Metadata
            </div>
            <div className="grid gap-4">
              <input 
                placeholder="Project Title (e.g. AI Dashboard Backend)"
                className="w-full bg-secondary/30 border border-border/50 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
              <textarea 
                placeholder="Brief overview..."
                className="w-full bg-secondary/30 border border-border/50 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[80px]"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
              <textarea 
                placeholder="Detailed scope of work and requirements..."
                className="w-full bg-secondary/30 border border-border/50 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[100px]"
                value={formData.scope}
                onChange={(e) => setFormData({...formData, scope: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1 mb-1 block">Project Deadline</label>
                  <input 
                    type="date"
                    className="w-full bg-secondary/30 border border-border/50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all text-muted-foreground"
                    value={formData.deadline}
                    onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1 mb-1 block">Total Budget Estimate (ETH)</label>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5.0"
                    className="w-full bg-secondary/30 border border-border/50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>


          {/* Milestones */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                <ChevronRight className="w-3 h-3" /> Smart Milestones
              </div>
              <Button type="button" onClick={addMilestone} variant="ghost" size="sm" className="h-8 gap-1 text-primary hover:bg-primary/10 rounded-full px-3">
                <Plus className="w-3.5 h-3.5" /> Add Step
              </Button>
            </div>

            <div className="space-y-4">
              {milestones.map((m, idx) => (
                <div key={idx} className="relative group">
                  <Card className="border-border/40 bg-secondary/10 group-hover:border-primary/30 transition-colors rounded-2xl overflow-hidden">
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                      <div className="md:col-span-1 hidden md:flex items-center justify-center pt-2">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black">
                          {idx + 1}
                        </span>
                      </div>
                      <div className="md:col-span-8 space-y-3">
                        <input 
                          placeholder="Milestone Title"
                          className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 outline-none"
                          value={m.title}
                          onChange={(e) => updateMilestone(idx, 'title', e.target.value)}
                        />
                        <input 
                          placeholder="Short description of requirements"
                          className="w-full bg-transparent border-none p-0 text-xs text-muted-foreground focus:ring-0 outline-none"
                          value={m.description}
                          onChange={(e) => updateMilestone(idx, 'description', e.target.value)}
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground">Due:</label>
                          <input 
                            type="date"
                            className="bg-background/50 border border-border/50 rounded p-1 text-xs text-muted-foreground outline-none"
                            value={m.deadline}
                            onChange={(e) => updateMilestone(idx, 'deadline', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <div className="relative">
                          <input 
                            placeholder="0.0"
                            type="number"
                            step="0.01"
                            className="w-full bg-background/50 border border-border/50 rounded-lg p-2 text-sm font-black focus:ring-2 focus:ring-primary/20 outline-none text-right pr-10"
                            value={m.amount}
                            onChange={(e) => updateMilestone(idx, 'amount', e.target.value)}
                          />
                          <span className="absolute right-3 top-2 text-[10px] font-bold text-muted-foreground">ETH</span>
                        </div>
                      </div>
                      <div className="md:col-span-1 flex justify-end">
                        <Button 
                          type="button" 
                          onClick={() => removeMilestone(idx)} 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-full"
                          disabled={milestones.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-14 rounded-2xl font-bold">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-[2] h-14 bg-primary text-white text-lg font-black shadow-2xl shadow-primary/30 rounded-2xl hover:scale-[1.02] transition-transform active:scale-95"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : "Create & Fund Project 💸"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
