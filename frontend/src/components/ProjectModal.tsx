import { useState, useEffect } from 'react';
import { 
  X, Target, ShieldCheck, 
  ExternalLink, Loader2,
  Send, CheckCircle, BrainCircuit
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from './ui';
import { StatusBadge } from './StatusBadge';
import { AIReview } from './AIReview';
import { useEscrow } from '../hooks/useEscrow';
import { projectsApi, bidsApi } from '../lib/api';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { fetchProjects } from '../redux/slices/projectsSlice';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { ProfileCard } from './ProfileCard';

interface ProjectModalProps {
  project: any;
  onClose: () => void;
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  const dispatch = useAppDispatch();
  const { role } = useAppSelector(state => state.auth);
  const { fundProject, approveMilestone, isPending } = useEscrow();
  
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  
  // Bidding states
  const [bids, setBids] = useState<any[]>([]);
  const [bidForm, setBidForm] = useState({ amount: '', message: '' });
  const [isBidding, setIsBidding] = useState(false);

  // Updates states
  const [updates, setUpdates] = useState<any[]>([]);
  const [updateForm, setUpdateForm] = useState({ description: '', fileUrl: '' });
  const [isPostingUpdate, setIsPostingUpdate] = useState(false);

  useEffect(() => {
    if (project.status === 'OPEN' || project.status === 'IN_PROGRESS') {
      const fetchData = async () => {
        try {
          if (project.status === 'OPEN') {
            const res = await bidsApi.getForProject(project._id);
            setBids(res.data);
          } else {
            const res = await projectsApi.getUpdates(project._id);
            setUpdates(res.data);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchData();
    }
  }, [project._id, project.status]);

  const handleSubmitBid = async () => {
    if (!bidForm.amount || !bidForm.message) return toast.error('Fill all fields');
    setIsBidding(true);
    try {
      await bidsApi.create({
        projectId: project._id,
        proposedAmount: parseFloat(bidForm.amount) * 1e18,
        message: bidForm.message,
      });
      toast.success('Bid submitted successfully!');
      const res = await bidsApi.getForProject(project._id);
      setBids(res.data);
      setBidForm({ amount: '', message: '' });
    } catch (e: any) {
      // toast error is handled globally if 400
    } finally {
      setIsBidding(false);
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    try {
      await bidsApi.accept(bidId);
      toast.success('Bid accepted! The project is now IN_PROGRESS.');
      dispatch(fetchProjects());
      onClose(); // Close modal to refresh or show newly assigned project
    } catch (e: any) {
    }
  };

  const handlePostUpdate = async () => {
    if (!updateForm.description) return toast.error('Description required');
    setIsPostingUpdate(true);
    try {
      await projectsApi.addUpdate(project._id, {
        description: updateForm.description,
        files: updateForm.fileUrl ? [updateForm.fileUrl] : [],
      });
      toast.success('Update posted!');
      setUpdateForm({ description: '', fileUrl: '' });
      const res = await projectsApi.getUpdates(project._id);
      setUpdates(res.data);
    } catch (e: any) {
    } finally {
      setIsPostingUpdate(false);
    }
  };

  const handleFund = async () => {
    try {
      const totalAmount = project.milestones.reduce((acc: number, m: any) => acc + m.amount, 0);
      const tx = await fundProject(project.blockchainId, BigInt(totalAmount));
      
      // tx should contain the hash if it's from wagmi/viem
      const hash = typeof tx === 'string' ? tx : (tx as any)?.hash || (tx as any)?.transactionHash;

      await projectsApi.fund(project._id, (totalAmount / 1e18).toString(), hash);
      toast.success('Project funded on-chain!');
      dispatch(fetchProjects());
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitWork = async (index: number) => {
    if (!submissionContent.trim()) return toast.error('Please provide some evidence or link');
    
    setSubmitting(index);
    try {
      await projectsApi.submitMilestone(project._id, index, submissionContent);
      toast.success('Work submitted! AI is reviewing...');
      setSubmissionContent('');
      dispatch(fetchProjects());
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(null);
    }
  };

  const handleApprove = async (index: number) => {
    try {
      const tx = await approveMilestone(project.blockchainId, index);
      
      const hash = typeof tx === 'string' ? tx : (tx as any)?.hash || (tx as any)?.transactionHash;

      await projectsApi.approveMilestone(project._id, index, hash);
      toast.success('Milestone approved and funds released!');
      dispatch(fetchProjects());
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-3xl shadow-2xl glass animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/50 backdrop-blur-xl border-b p-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold tracking-tight">{project.title}</h2>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-muted-foreground text-sm max-w-xl line-clamp-2">
              {project.description}
            </p>
            {project.scope && (
              <div className="mt-4 p-3 bg-secondary/20 rounded-xl text-sm border border-border/50">
                <span className="font-bold block mb-1">Scope of Work:</span>
                <span className="text-muted-foreground">{project.scope}</span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* BIDDING SECTION */}
            {project.status === 'OPEN' && (
              <section className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Bids & Proposals
                </h3>
                
                {role === 'FREELANCER' && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-base">Submit Your Bid</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex gap-4">
                        <input
                          type="number"
                          placeholder="Proposed Amount (ETH)"
                          value={bidForm.amount}
                          onChange={e => setBidForm({...bidForm, amount: e.target.value})}
                          className="w-1/3 bg-background border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Why are you the best fit?"
                          value={bidForm.message}
                          onChange={e => setBidForm({...bidForm, message: e.target.value})}
                          className="flex-1 bg-background border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                      </div>
                      <Button 
                        onClick={handleSubmitBid} 
                        disabled={isBidding}
                        className="w-full h-11 bg-primary text-white"
                      >
                        {isBidding ? <Loader2 className="animate-spin w-4 h-4" /> : "Submit Proposal"}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {bids.length > 0 ? (
                  <div className="space-y-3">
                    {bids.map(bid => (
                      <Card key={bid._id} className={cn("transition-all", bid.status === 'ACCEPTED' ? "border-green-500/50 bg-green-500/5" : "")}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-bold">{bid.freelancerId?.name || 'Freelancer'}</p>
                            <p className="text-xs text-muted-foreground mt-1">{bid.message}</p>
                            <div className="mt-2"><StatusBadge status={bid.status} /></div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2">
                            <span className="font-black text-primary">{(bid.proposedAmount / 1e18).toFixed(2)} ETH</span>
                            {role === 'CLIENT' && bid.status === 'PENDING' && (
                              <Button size="sm" onClick={() => handleAcceptBid(bid._id)} className="bg-green-600 hover:bg-green-700">Accept Bid</Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No bids yet on this project.</p>
                )}
              </section>
            )}

            {/* UPDATES SECTION */}
            {project.status === 'IN_PROGRESS' && (
              <section className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-primary" />
                  Project Activity & Updates
                </h3>
                
                {role === 'FREELANCER' && (
                  <Card className="bg-muted border-border">
                    <CardContent className="p-4 space-y-3">
                      <textarea
                        placeholder="What's the latest progress?"
                        value={updateForm.description}
                        onChange={e => setUpdateForm({...updateForm, description: e.target.value})}
                        className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        rows={2}
                      />
                      <input
                        type="url"
                        placeholder="File URL (optional)"
                        value={updateForm.fileUrl}
                        onChange={e => setUpdateForm({...updateForm, fileUrl: e.target.value})}
                        className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                      <Button 
                        onClick={handlePostUpdate} 
                        disabled={isPostingUpdate}
                        className="w-full"
                      >
                        {isPostingUpdate ? <Loader2 className="animate-spin w-4 h-4" /> : "Post Update"}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  {updates.map(update => (
                    <div key={update._id} className="p-4 border rounded-2xl bg-card">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground font-black mb-2">
                        {new Date(update.createdAt).toLocaleString()}
                      </p>
                      <p className="text-sm">{update.description}</p>
                      {update.files?.length > 0 && (
                        <div className="mt-3 flex gap-2">
                          {update.files.map((file: string, i: number) => (
                            <a key={i} href={file} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" /> View Attachment
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Project Milestones
              </h3>
              
              <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {project.milestones.map((m: any, idx: number) => (
                  <div key={idx} className="relative pl-12">
                    <div className={cn(
                      "absolute left-0 top-1 w-9 h-9 rounded-full border flex items-center justify-center z-10 transition-colors",
                      m.status === 'APPROVED' ? "bg-green-500/10 border-green-500/20 text-green-500" :
                      m.status === 'SUBMITTED' ? "bg-primary/10 border-primary/20 text-primary" :
                      "bg-muted border-border text-muted-foreground"
                    )}>
                      {m.status === 'APPROVED' ? <CheckCircle className="w-5 h-5" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                    </div>
                    
                    <Card className={cn(
                      "transition-all duration-300",
                      m.status === 'SUBMITTED' && "border-primary/30 ring-1 ring-primary/10"
                    )}>
                      <CardHeader className="py-4 px-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base font-bold">{m.title}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                            {m.deadline && <p className="text-[10px] text-primary mt-1 border border-primary/20 bg-primary/10 inline-block px-2 py-0.5 rounded-full">Due: {new Date(m.deadline).toLocaleDateString()}</p>}
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-primary">{(m.amount / 1e18).toFixed(2)} ETH</span>
                            <div className="mt-1"><StatusBadge status={m.status} /></div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {(m.aiFeedback || m.status === 'SUBMITTED') && (
                        <CardContent className="px-5 pb-5 space-y-4">
                          {m.submissionContent && (
                            <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-xs font-mono">
                              <span className="text-muted-foreground block mb-1 uppercase tracking-widest font-bold">Freelancer Submission:</span>
                              {m.submissionContent}
                            </div>
                          )}
                          
                          {submitting === idx && (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex flex-col items-center justify-center p-8 border border-primary/20 bg-primary/5 rounded-3xl gap-4"
                            >
                              <div className="relative">
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                <BrainCircuit className="w-5 h-5 text-primary absolute inset-0 m-auto animate-pulse" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-black text-primary uppercase tracking-[0.2em]">🤖 AI Agent Analyzing</p>
                                <p className="text-[10px] text-muted-foreground mt-1">Cross-referencing deliverables with requirements...</p>
                              </div>
                            </motion.div>
                          )}

                          {m.aiFeedback && (
                            <AIReview 
                              confidence={m.aiConfidence} 
                              feedback={m.aiFeedback} 
                              onRaiseDispute={() => toast.warning("Dispute Request Sent", {
                                description: "The decentralized arbitration court has been notified."
                              })}
                            />
                          )}

                          {/* Action Buttons for Client */}
                          {role === 'CLIENT' && m.status === 'SUBMITTED' && (
                            <Button 
                              onClick={() => handleApprove(idx)}
                              disabled={isPending}
                              className="w-full h-11 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20 rounded-xl"
                            >
                              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Approve & Release Payment"}
                            </Button>
                          )}

                          {/* Action Form for Freelancer */}
                          {role === 'FREELANCER' && m.status === 'FUNDED' && (
                            <div className="space-y-3 pt-2">
                              <textarea 
                                className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-h-[80px]"
                                placeholder="Paste your work link or description here..."
                                value={submissionContent}
                                onChange={(e) => setSubmissionContent(e.target.value)}
                              />
                              <Button 
                                onClick={() => handleSubmitWork(idx)}
                                disabled={submitting === idx}
                                className="w-full h-11 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl gap-2"
                              >
                                {submitting === idx ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Submit Work</>}
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <section className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Participants</h4>
              <div className="space-y-3">
                <ProfileCard profile={project.clientId} role="CLIENT" />
                <ProfileCard profile={project.freelancerId} role="FREELANCER" />
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Network & Security</h4>
              <Card className="bg-primary/5 border-primary/10">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Verified Contract
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background/50 border border-border text-[10px] font-mono break-all leading-tight">
                    {project.contractAddress}
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Financial Overview</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl border bg-card/50">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Total</p>
                  <p className="text-lg font-black">{(project.milestones.reduce((a: any, b: any) => a + b.amount, 0) / 1e18).toFixed(2)} ETH</p>
                </div>
                <div className="p-4 rounded-2xl border bg-card/50">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Blockchain ID</p>
                  <p className="text-lg font-black"># {project.blockchainId}</p>
                </div>
              </div>
            </section>

            {project.deadline && (
              <section className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Target Deadline</h4>
                <Card className="bg-secondary/20 border-border/50">
                  <CardContent className="p-4 flex items-center justify-center font-bold text-sm">
                    {new Date(project.deadline).toLocaleDateString()}
                  </CardContent>
                </Card>
              </section>
            )}

            {role === 'CLIENT' && project.status === 'PENDING' && (
              <Button 
                onClick={handleFund}
                disabled={isPending}
                className="w-full h-14 bg-primary text-white text-lg font-bold shadow-2xl shadow-primary/30 rounded-2xl"
              >
                {isPending ? <Loader2 className="animate-spin mr-2" /> : "Fund Project"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
