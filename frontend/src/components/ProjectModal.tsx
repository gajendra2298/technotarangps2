import { useState, useEffect } from "react";
import {
  X,
  Target,
  ShieldCheck,
  ExternalLink,
  Loader2,
  Send,
  CheckCircle,
  BrainCircuit,
  GitBranch,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Download,
  AlertTriangle,
} from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent } from "./ui";
import { StatusBadge } from "./StatusBadge";
import { AIReview } from "./AIReview";
import { useEscrow } from "../hooks/useEscrow";
import { projectsApi, bidsApi } from "../lib/api";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { fetchProjects } from "../redux/slices/projectsSlice";
import { cn } from "../lib/utils";
import { motion } from "framer-motion";
import { ProfileCard } from "./ProfileCard";

interface ProjectModalProps {
  project: any;
  onClose: () => void;
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  const dispatch = useAppDispatch();
  const { role } = useAppSelector((state) => state.auth);
  const { fundProject, assignFreelancer, releasePayment, releaseAllPayments, isPending } =
    useEscrow();

  const [submitting, setSubmitting] = useState<number | null>(null);
  const [submissionContent, setSubmissionContent] = useState("");

  // Bidding states
  const [bids, setBids] = useState<any[]>([]);
  const [bidForm, setBidForm] = useState({ amount: "", message: "" });
  const [isBidding, setIsBidding] = useState(false);

  // Updates states
  const [updates, setUpdates] = useState<any[]>([]);
  const [updateForm, setUpdateForm] = useState({
    description: "",
    fileUrl: "",
  });
  const [isPostingUpdate, setIsPostingUpdate] = useState(false);

  // Final Submission states
  const [finalSubmissionForm, setFinalSubmissionForm] = useState({
    description: "",
    github: "",
    zipUrl: "",
    images: [] as string[],
    docs: [] as string[],
  });
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [isApprovingFinal, setIsApprovingFinal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [docUrlInput, setDocUrlInput] = useState("");

  useEffect(() => {
    if (project.status === "OPEN" || project.status === "IN_PROGRESS") {
      const fetchData = async () => {
        try {
          if (project.status === "OPEN") {
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
    if (!bidForm.amount || !bidForm.message)
      return toast.error("Fill all fields");
    setIsBidding(true);
    try {
      await bidsApi.create({
        projectId: project._id,
        proposedAmount: parseFloat(bidForm.amount) * 1e18,
        message: bidForm.message,
      });
      toast.success("Bid submitted successfully!");
      const res = await bidsApi.getForProject(project._id);
      setBids(res.data);
      setBidForm({ amount: "", message: "" });
    } catch (e: any) {
      // toast error is handled globally if 400
    } finally {
      setIsBidding(false);
    }
  };

  const handleAcceptBid = async (bid: any) => {
    try {
      if (!bid.freelancerId?.address) {
        return toast.error("Freelancer does not have a wallet address linked.");
      }

      // 1. Assign on-chain
      await assignFreelancer(project.blockchainId, bid.freelancerId.address);

      // 2. Sync backend
      await bidsApi.accept(bid._id);
      toast.success("Bid accepted and freelancer assigned on-chain! 🚀");
      dispatch(fetchProjects());
      onClose();
    } catch (e: any) {
      console.error(e);
    }
  };

  const handlePostUpdate = async () => {
    if (!updateForm.description) return toast.error("Description required");
    setIsPostingUpdate(true);
    try {
      await projectsApi.addUpdate(project._id, {
        description: updateForm.description,
        files: updateForm.fileUrl ? [updateForm.fileUrl] : [],
      });
      toast.success("Update posted!");
      setUpdateForm({ description: "", fileUrl: "" });
      const res = await projectsApi.getUpdates(project._id);
      setUpdates(res.data);
    } catch (e: any) {
    } finally {
      setIsPostingUpdate(false);
    }
  };

  const handleFund = async () => {
    try {
      const totalAmount = project.milestones.reduce(
        (acc: number, m: any) => acc + m.amount,
        0,
      );
      const tx = await fundProject(project.blockchainId, BigInt(totalAmount));

      // tx should contain the hash if it's from wagmi/viem
      const hash =
        typeof tx === "string"
          ? tx
          : (tx as any)?.hash || (tx as any)?.transactionHash;

      await projectsApi.fund(
        project._id,
        (totalAmount / 1e18).toString(),
        hash,
      );
      toast.success("Project funded on-chain!");
      dispatch(fetchProjects());
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitWork = async (index: number) => {
    if (!submissionContent.trim())
      return toast.error("Please provide some evidence or link");

    setSubmitting(index);
    try {
      await projectsApi.submitMilestone(project._id, index, submissionContent);
      toast.success("Work submitted! AI is reviewing...");
      setSubmissionContent("");
      dispatch(fetchProjects());
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(null);
    }
  };

  const handleApprove = async (index: number) => {
    try {
      const tx = await releasePayment(project.blockchainId, index);

      const hash =
        typeof tx === "string"
          ? tx
          : (tx as any)?.hash || (tx as any)?.transactionHash;

      await projectsApi.approveMilestone(project._id, index, hash);
      toast.success("Milestone approved and funds released! 💸");
      dispatch(fetchProjects());
    } catch (err) {
      console.error(err);
    }
  };

  const handleFinalSubmit = async () => {
    if (!finalSubmissionForm.description) return toast.error("Description is required");
    if (!finalSubmissionForm.github && !finalSubmissionForm.zipUrl) {
      return toast.error("At least one proof of work is required (GitHub or ZIP)");
    }

    setIsSubmittingFinal(true);
    try {
      await projectsApi.submitFinalWork(project._id, finalSubmissionForm);
      toast.success("Project submitted successfully! Waiting for client review.");
      dispatch(fetchProjects());
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingFinal(false);
    }
  };

  const handleFinalApprove = async () => {
    try {
      setIsApprovingFinal(true);
      const tx = await releaseAllPayments(project.blockchainId);
      
      const hash =
        typeof tx === "string"
          ? tx
          : (tx as any)?.hash || (tx as any)?.transactionHash;

      await projectsApi.approveSubmission(project._id, hash);
      toast.success("Project approved and final payments released! 🚀");
      dispatch(fetchProjects());
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsApprovingFinal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar bg-card border border-border rounded-3xl shadow-2xl glass animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/50 backdrop-blur-xl border-b p-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold tracking-tight">
                {project.title}
              </h2>
              <StatusBadge status={project.status} />
              {project.status === "FUNDED" ||
              project.status === "IN_PROGRESS" ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest">
                  <ShieldCheck className="w-3 h-3" /> Escrow Locked 🔒
                </div>
              ) : null}
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
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* BIDDING SECTION */}
            {project.status === "OPEN" && (
              <section className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Bids & Proposals
                </h3>

                {role === "FREELANCER" && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-base">
                        Submit Your Bid
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex gap-4">
                        <input
                          type="number"
                          placeholder="Proposed Amount (ETH)"
                          value={bidForm.amount}
                          onChange={(e) =>
                            setBidForm({ ...bidForm, amount: e.target.value })
                          }
                          className="w-1/3 bg-background border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Why are you the best fit?"
                          value={bidForm.message}
                          onChange={(e) =>
                            setBidForm({ ...bidForm, message: e.target.value })
                          }
                          className="flex-1 bg-background border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                      </div>
                      <Button
                        onClick={handleSubmitBid}
                        disabled={isBidding}
                        className="w-full h-11 bg-primary text-white"
                      >
                        {isBidding ? (
                          <Loader2 className="animate-spin w-4 h-4" />
                        ) : (
                          "Submit Proposal"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {bids.length > 0 ? (
                  <div className="space-y-3">
                    {bids.map((bid) => (
                      <Card
                        key={bid._id}
                        className={cn(
                          "transition-all",
                          bid.status === "ACCEPTED"
                            ? "border-green-500/50 bg-green-500/5"
                            : "",
                        )}
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-bold">
                              {bid.freelancerId?.name || "Freelancer"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {bid.message}
                            </p>
                            <div className="mt-2">
                              <StatusBadge status={bid.status} />
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2">
                            <span className="font-black text-primary">
                              {(bid.proposedAmount / 1e18).toFixed(2)} ETH
                            </span>
                            {role === "CLIENT" && bid.status === "PENDING" && (
                              <Button
                                size="sm"
                                onClick={() => handleAcceptBid(bid)}
                                disabled={isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {isPending ? (
                                  <Loader2 className="animate-spin w-4 h-4" />
                                ) : (
                                  "Accept Bid"
                                )}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No bids yet on this project.
                  </p>
                )}
              </section>
            )}

            {/* UPDATES SECTION */}
            {project.status === "IN_PROGRESS" && (
              <section className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-primary" />
                  Project Activity & Updates
                </h3>

                {role === "FREELANCER" && (
                  <Card className="bg-muted border-border">
                    <CardContent className="p-4 space-y-3">
                      <textarea
                        placeholder="What's the latest progress?"
                        value={updateForm.description}
                        onChange={(e) =>
                          setUpdateForm({
                            ...updateForm,
                            description: e.target.value,
                          })
                        }
                        className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        rows={2}
                      />
                      <input
                        type="url"
                        placeholder="File URL (optional)"
                        value={updateForm.fileUrl}
                        onChange={(e) =>
                          setUpdateForm({
                            ...updateForm,
                            fileUrl: e.target.value,
                          })
                        }
                        className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                      <Button
                        onClick={handlePostUpdate}
                        disabled={isPostingUpdate}
                        className="w-full"
                      >
                        {isPostingUpdate ? (
                          <Loader2 className="animate-spin w-4 h-4" />
                        ) : (
                          "Post Update"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  {updates.map((update) => (
                    <div
                      key={update._id}
                      className="p-4 border rounded-2xl bg-card"
                    >
                      <p className="text-xs uppercase tracking-widest text-muted-foreground font-black mb-2">
                        {new Date(update.createdAt).toLocaleString()}
                      </p>
                      <p className="text-sm">{update.description}</p>
                      {update.files?.length > 0 && (
                        <div className="mt-3 flex gap-2">
                          {update.files.map((file: string, i: number) => (
                            <a
                              key={i}
                              href={file}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" /> View
                              Attachment
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
                    <div
                      className={cn(
                        "absolute left-0 top-1 w-9 h-9 rounded-full border flex items-center justify-center z-10 transition-colors",
                        m.status === "APPROVED"
                          ? "bg-green-500/10 border-green-500/20 text-green-500"
                          : m.status === "SUBMITTED"
                            ? "bg-primary/10 border-primary/20 text-primary"
                            : "bg-muted border-border text-muted-foreground",
                      )}
                    >
                      {m.status === "APPROVED" ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <span className="text-xs font-bold">{idx + 1}</span>
                      )}
                    </div>

                    <Card
                      className={cn(
                        "transition-all duration-300",
                        m.status === "SUBMITTED" &&
                          "border-primary/30 ring-1 ring-primary/10",
                      )}
                    >
                      <CardHeader className="py-4 px-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base font-bold">
                              {m.title}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {m.description}
                            </p>
                            {m.deadline && (
                              <p className="text-[10px] text-primary mt-1 border border-primary/20 bg-primary/10 inline-block px-2 py-0.5 rounded-full">
                                Due: {new Date(m.deadline).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-primary">
                              {(m.amount / 1e18).toFixed(2)} ETH
                            </span>
                            <div className="mt-1">
                              <StatusBadge status={m.status} />
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      {(m.aiFeedback || m.status === "SUBMITTED") && (
                        <CardContent className="px-5 pb-5 space-y-4">
                          {m.submissionContent && (
                            <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-xs font-mono">
                              <span className="text-muted-foreground block mb-1 uppercase tracking-widest font-bold">
                                Freelancer Submission:
                              </span>
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
                                <p className="text-sm font-black text-primary uppercase tracking-[0.2em]">
                                  🤖 AI Agent Analyzing
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  Cross-referencing deliverables with
                                  requirements...
                                </p>
                              </div>
                            </motion.div>
                          )}

                          {m.aiFeedback && (
                            <AIReview
                              confidence={m.aiConfidence}
                              feedback={m.aiFeedback}
                              onRaiseDispute={() =>
                                toast.warning("Dispute Request Sent", {
                                  description:
                                    "The decentralized arbitration court has been notified.",
                                })
                              }
                            />
                          )}

                          {/* Action Buttons for Client */}
                          {role === "CLIENT" && m.status === "SUBMITTED" && (
                            <Button
                              onClick={() => handleApprove(idx)}
                              disabled={isPending}
                              className="w-full h-11 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20 rounded-xl"
                            >
                              {isPending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                "Approve & Release Payment"
                              )}
                            </Button>
                          )}

                          {/* Action Form for Freelancer */}
                          {role === "FREELANCER" && m.status === "FUNDED" && (
                            <div className="space-y-3 pt-2">
                              <textarea
                                className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-h-[80px]"
                                placeholder="Paste your work link or description here..."
                                value={submissionContent}
                                onChange={(e) =>
                                  setSubmissionContent(e.target.value)
                                }
                              />
                              <Button
                                onClick={() => handleSubmitWork(idx)}
                                disabled={submitting === idx}
                                className="w-full h-11 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl gap-2"
                              >
                                {submitting === idx ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <>
                                    <Send className="w-4 h-4" /> Submit Work
                                  </>
                                )}
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

            {/* FINAL SUBMISSION UI FOR FREELANCER */}
            {role === "FREELANCER" && project.status === "IN_PROGRESS" && (
              <section className="space-y-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                    🚀 Final Project Delivery
                  </h3>
                </div>
                <Card className="bg-primary/5 border-primary/20 shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Send className="w-24 h-24" />
                  </div>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Deliverable Description</label>
                      <textarea
                        className="w-full bg-background border border-border rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-h-[120px]"
                        placeholder="Detail exactly what is being delivered in this final submission..."
                        value={finalSubmissionForm.description}
                        onChange={(e) => setFinalSubmissionForm({...finalSubmissionForm, description: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <GitBranch className="w-3 h-3" /> GitHub Repository
                        </label>
                        <input
                          type="url"
                          placeholder="https://github.com/..."
                          className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          value={finalSubmissionForm.github}
                          onChange={(e) => setFinalSubmissionForm({...finalSubmissionForm, github: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Download className="w-3 h-3" /> ZIP/Source URL
                        </label>
                        <input
                          type="url"
                          placeholder="Link to ZIP file..."
                          className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          value={finalSubmissionForm.zipUrl}
                          onChange={(e) => setFinalSubmissionForm({...finalSubmissionForm, zipUrl: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <ImageIcon className="w-3 h-3" /> Proof Images (URLs)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            placeholder="Add image URL..."
                            className="flex-1 bg-background border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            value={imageUrlInput}
                            onChange={(e) => setImageUrlInput(e.target.value)}
                          />
                          <Button 
                            variant="secondary" 
                            onClick={() => {
                              if (imageUrlInput) {
                                setFinalSubmissionForm({...finalSubmissionForm, images: [...finalSubmissionForm.images, imageUrlInput]});
                                setImageUrlInput("");
                              }
                            }}
                          >Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {finalSubmissionForm.images.map((img, i) => (
                            <div key={i} className="px-3 py-1 bg-secondary rounded-full text-xs flex items-center gap-2">
                              <span className="truncate max-w-[100px]">{img}</span>
                              <X className="w-3 h-3 cursor-pointer" onClick={() => setFinalSubmissionForm({...finalSubmissionForm, images: finalSubmissionForm.images.filter((_, idx) => idx !== i)})} />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <FileText className="w-3 h-3" /> Documentation (URLs)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            placeholder="Add doc URL..."
                            className="flex-1 bg-background border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            value={docUrlInput}
                            onChange={(e) => setDocUrlInput(e.target.value)}
                          />
                          <Button 
                            variant="secondary"
                            onClick={() => {
                              if (docUrlInput) {
                                setFinalSubmissionForm({...finalSubmissionForm, docs: [...finalSubmissionForm.docs, docUrlInput]});
                                setDocUrlInput("");
                              }
                            }}
                          >Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {finalSubmissionForm.docs.map((doc, i) => (
                            <div key={i} className="px-3 py-1 bg-secondary rounded-full text-xs flex items-center gap-2">
                              <span className="truncate max-w-[100px]">{doc}</span>
                              <X className="w-3 h-3 cursor-pointer" onClick={() => setFinalSubmissionForm({...finalSubmissionForm, docs: finalSubmissionForm.docs.filter((_, idx) => idx !== i)})} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleFinalSubmit}
                      disabled={isSubmittingFinal}
                      className="w-full h-14 bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/30 rounded-2xl gap-3 text-lg font-bold"
                    >
                      {isSubmittingFinal ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-5 h-5" /> Mark Project as Completed
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* FINAL REVIEW UI FOR CLIENT */}
            {project.status === "SUBMITTED" && (
              <section className="space-y-4 pt-4 border-t border-border/50">
                 <h3 className="text-xl font-black bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-500" /> Review Final Submission
                </h3>
                
                <Card className="border-green-500/30 bg-green-500/5 shadow-2xl">
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Submission Description</label>
                      <p className="p-4 bg-background border rounded-xl text-sm leading-relaxed">
                        {project.completion?.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {project.completion?.github && (
                        <a href={project.completion.github} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-card border rounded-2xl hover:border-primary group transition-all">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                            <GitBranch className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Source Code</p>
                            <p className="text-sm font-bold">GitHub Repository <ExternalLink className="inline w-3 h-3 opacity-50" /></p>
                          </div>
                        </a>
                      )}
                      {project.completion?.zipUrl && (
                        <a href={project.completion.zipUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-card border rounded-2xl hover:border-primary group transition-all">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <Download className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Project Files</p>
                            <p className="text-sm font-bold">Download ZIP <ExternalLink className="inline w-3 h-3 opacity-50" /></p>
                          </div>
                        </a>
                      )}
                    </div>

                    {(project.completion?.images?.length > 0 || project.completion?.docs?.length > 0) && (
                       <div className="space-y-4">
                          {project.completion?.images?.length > 0 && (
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Deliverable Proofs (Images)</label>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {project.completion.images.map((img: string, i: number) => (
                                  <a key={i} href={img} target="_blank" rel="noreferrer" className="aspect-video bg-muted rounded-xl border overflow-hidden hover:opacity-80 transition-opacity">
                                    <img src={img} alt="proof" className="w-full h-full object-cover" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          {project.completion?.docs?.length > 0 && (
                             <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Documentation</label>
                              <div className="flex flex-wrap gap-2">
                                {project.completion.docs.map((doc: string, i: number) => (
                                  <a key={i} href={doc} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 bg-card border rounded-xl text-xs font-bold hover:border-primary transition-all">
                                    <FileText className="w-4 h-4 text-primary" />
                                    {doc.split('/').pop() || 'Document'}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                       </div>
                    )}

                    {role === "CLIENT" && (
                      <div className="pt-4 space-y-3">
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-warning/10 border border-warning/20 mb-2">
                          <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                          <p className="text-xs text-warning-foreground font-medium">
                            Approving this will release <strong>all remaining funds</strong> in the escrow to the freelancer. This action is irreversible on the blockchain.
                          </p>
                        </div>
                        <Button
                          onClick={handleFinalApprove}
                          disabled={isApprovingFinal || isPending}
                          className="w-full h-14 bg-green-600 hover:bg-green-700 text-white shadow-2xl shadow-green-500/30 rounded-2xl gap-3 text-lg font-black"
                        >
                          {isApprovingFinal || isPending ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                          ) : (
                            <>
                              <ShieldCheck className="w-6 h-6" /> Approve & Release Payment
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}

            {project.status === "COMPLETED" && (
                <section className="space-y-4 pt-4 border-t border-border/50">
                   <div className="p-8 border border-green-500/20 bg-green-500/5 rounded-[2.5rem] flex flex-col items-center text-center gap-4">
                      <div className="w-20 h-20 bg-green-500/10 rounded-3xl flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-green-500">Project Completed!</h3>
                        <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                          The final work has been delivered and all funds have been successfully released through the decentralized escrow.
                        </p>
                      </div>
                      <div className="flex gap-3 mt-2">
                         <Button variant="outline" className="rounded-xl font-bold" onClick={() => window.open(project.completion?.github)}>View Github</Button>
                         <Button variant="outline" className="rounded-xl font-bold" onClick={() => window.open(project.completion?.zipUrl)}>Download Source</Button>
                      </div>
                   </div>
                </section>
            )}

            <section className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                Participants
              </h4>
              <div className="space-y-3">
                <ProfileCard profile={project.clientId} role="CLIENT" />
                <ProfileCard profile={project.freelancerId} role="FREELANCER" />
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                Network & Security
              </h4>
              <Card className="bg-primary/5 border-primary/10">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Verified Contract
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 rounded-full"
                    >
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
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                Financial Overview
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl border bg-card/50">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">
                    Total
                  </p>
                  <p className="text-lg font-black">
                    {(
                      project.milestones.reduce(
                        (a: any, b: any) => a + b.amount,
                        0,
                      ) / 1e18
                    ).toFixed(2)}{" "}
                    ETH
                  </p>
                </div>
                <div className="p-4 rounded-2xl border bg-card/50">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">
                    Blockchain ID
                  </p>
                  <p className="text-lg font-black flex items-center gap-2">
                    # {project.blockchainId}
                    <a
                      href={`https://amoy.polygonscan.com/address/${project.contractAddress}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 hover:bg-primary/10 rounded transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 text-primary" />
                    </a>
                  </p>
                </div>
              </div>
            </section>

            {project.deadline && (
              <section className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Target Deadline
                </h4>
                <Card className="bg-secondary/20 border-border/50">
                  <CardContent className="p-4 flex items-center justify-center font-bold text-sm">
                    {new Date(project.deadline).toLocaleDateString()}
                  </CardContent>
                </Card>
              </section>
            )}

            {role === "CLIENT" && project.status === "PENDING" && (
              <Button
                onClick={handleFund}
                disabled={isPending}
                className="w-full h-14 bg-primary text-white text-lg font-bold shadow-2xl shadow-primary/30 rounded-2xl"
              >
                {isPending ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  "Fund Project"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
