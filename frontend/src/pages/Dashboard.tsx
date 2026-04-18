import { useState } from "react";
import { useAppSelector } from "../redux/hooks";
import {
  Card,
  CardContent,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../components/ui";
import { Plus, AlertCircle, DollarSign, Briefcase, Zap, Search, Globe, Clock, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { ProjectModal } from "../components/ProjectModal";
import { CreateProjectModal } from "../components/CreateProjectModal";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAllProjects, useClientProjects, useFreelancerProjects } from "../hooks/useProjects";

export function Dashboard() {
  const { role, user: appUser } = useAppSelector((state) => state.auth);
  
  // Data Fetching
  const allProjectsQuery = useAllProjects(role === "FREELANCER");
  const clientProjectsQuery = useClientProjects(role === "CLIENT");
  const freelancerProjectsQuery = useFreelancerProjects(role === "FREELANCER");

  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Determine which data to use
  const projects = role === "CLIENT" 
    ? clientProjectsQuery.data 
    : role === "FREELANCER" 
      ? { 
          available: allProjectsQuery.data, 
          assigned: freelancerProjectsQuery.data 
        }
      : [];

  const isLoading = 
    (role === "CLIENT" && clientProjectsQuery.isLoading) ||
    (role === "FREELANCER" && (allProjectsQuery.isLoading || freelancerProjectsQuery.isLoading));

  const handleCreateProject = () => {
    if (role !== "CLIENT") {
      toast.error("Only clients can create projects");
      return;
    }
    setIsCreateModalOpen(true);
  };

  if (isLoading)
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-40 bg-card rounded-3xl border glass" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-card rounded-3xl border glass" />
          ))}
        </div>
      </div>
    );

  // Statistics calculation
  const projectList = role === "CLIENT" ? (projects as any[]) || [] : (projects as any).assigned || [];
  const earnings = projectList.reduce(
    (acc: number, p: any) =>
      acc +
      (p.milestones || [])
        .filter((m: any) => m.status === "APPROVED")
        .reduce((sum: number, m: any) => sum + m.amount, 0),
    0,
  ) || 0;

  const activeCount = projectList.filter((p: any) => p.status === "IN_PROGRESS").length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-primary via-purple-400 to-blue-500 bg-clip-text text-transparent pb-1">
            Welcome, {appUser?.name?.split(' ')[0] || "Partner"}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="font-black text-[10px] text-white px-3 py-1 rounded-full bg-primary/20 border border-primary/30 uppercase tracking-[0.3em]">
              {role || "User"}
            </span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <p className="text-muted-foreground text-sm font-medium">
              Manage your decentralized workflow
            </p>
          </div>
        </div>
        {role === "CLIENT" && (
          <Button
            onClick={handleCreateProject}
            className="gap-3 shadow-2xl shadow-primary/40 h-14 px-8 rounded-2xl bg-primary hover:scale-105 transition-all text-white font-bold"
          >
            <Plus className="w-5 h-5" /> Initialize Project
          </Button>
        )}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: role === "CLIENT" ? "Escrowed Volume" : "Total Earnings", value: `${(earnings / 1e18).toFixed(2)} ETH`, icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
          { label: "Active Workstreams", value: activeCount.toString(), icon: Briefcase, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Completion Rate", value: "100%", icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10" }
        ].map((stat, i) => (
          <Card key={i} className="relative overflow-hidden group hover:border-primary/30 transition-colors">
            <div className={`absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity`}>
              <stat.icon className="w-20 h-20" />
            </div>
            <CardContent className="pt-8">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black flex items-end gap-2">
                {stat.value}
                {stat.label.includes("Earnings") && <span className="text-xs font-bold opacity-40 mb-1">GLOBAL</span>}
              </h3>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Areas */}
      {role === "CLIENT" ? (
        <ClientDashboardView projects={projects as any[]} onSelect={setSelectedProject} />
      ) : (
        <FreelancerDashboardView 
          available={(projects as any).available || []} 
          assigned={(projects as any).assigned || []} 
          onSelect={setSelectedProject} 
        />
      )}

      {/* Modals */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </AnimatePresence>

      {isCreateModalOpen && (
        <CreateProjectModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </div>
  );
}

function ClientDashboardView({ projects, onSelect }: { projects: any[], onSelect: (p: any) => void }) {
  return (
    <Tabs defaultValue="OPEN">
      <div className="flex items-center justify-between mb-8 border-b border-border/50 pb-4">
        <TabsList>
          <TabsTrigger value="OPEN" className="gap-2">
            <Clock className="w-3 h-3" /> Pending <span className="opacity-50 ml-1">({projects.filter(p => p.status === 'OPEN').length})</span>
          </TabsTrigger>
          <TabsTrigger value="IN_PROGRESS" className="gap-2">
            <Zap className="w-3 h-3" /> In Progress <span className="opacity-50 ml-1">({projects.filter(p => p.status === 'IN_PROGRESS').length})</span>
          </TabsTrigger>
          <TabsTrigger value="COMPLETED" className="gap-2">
            <CheckCircle2 className="w-3 h-3" /> Completed <span className="opacity-50 ml-1">({projects.filter(p => p.status === 'COMPLETED').length})</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="OPEN">
        <ProjectGrid projects={projects.filter(p => p.status === 'OPEN')} onSelect={onSelect} emptyMessage="No pending projects. Start by creating a new workstream." />
      </TabsContent>
      <TabsContent value="IN_PROGRESS">
        <ProjectGrid projects={projects.filter(p => p.status === 'IN_PROGRESS')} onSelect={onSelect} emptyMessage="No active projects. Accept a bid to get started." />
      </TabsContent>
      <TabsContent value="COMPLETED">
        <ProjectGrid projects={projects.filter(p => p.status === 'COMPLETED')} onSelect={onSelect} emptyMessage="No completed projects yet." />
      </TabsContent>
    </Tabs>
  );
}

function FreelancerDashboardView({ available, assigned, onSelect }: { available: any[], assigned: any[], onSelect: (p: any) => void }) {
  return (
    <Tabs defaultValue="AVAILABLE">
      <div className="flex items-center justify-between mb-8 border-b border-border/50 pb-4">
        <TabsList>
          <TabsTrigger value="AVAILABLE" className="gap-2">
            <Globe className="w-3 h-3" /> Available Projects <span className="opacity-50 ml-1">({available.length})</span>
          </TabsTrigger>
          <TabsTrigger value="ACTIVE" className="gap-2">
            <Zap className="w-3 h-3" /> Active Work <span className="opacity-50 ml-1">({assigned.filter(p => p.status === 'IN_PROGRESS').length})</span>
          </TabsTrigger>
          <TabsTrigger value="HISTORY" className="gap-2">
            <CheckCircle2 className="w-3 h-3" /> Completed <span className="opacity-50 ml-1">({assigned.filter(p => p.status === 'COMPLETED').length})</span>
          </TabsTrigger>
        </TabsList>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search workstreams..." 
            className="pl-10 pr-4 h-10 bg-muted/30 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
          />
        </div>
      </div>

      <TabsContent value="AVAILABLE">
        <ProjectGrid projects={available} onSelect={onSelect} emptyMessage="No projects currently available for bidding." />
      </TabsContent>
      <TabsContent value="ACTIVE">
        <ProjectGrid projects={assigned.filter(p => p.status === 'IN_PROGRESS')} onSelect={onSelect} emptyMessage="You don't have any active projects currently." />
      </TabsContent>
      <TabsContent value="HISTORY">
        <ProjectGrid projects={assigned.filter(p => p.status === 'COMPLETED')} onSelect={onSelect} emptyMessage="No completed work history yet." />
      </TabsContent>
    </Tabs>
  );
}

function ProjectGrid({ projects, onSelect, emptyMessage }: { projects: any[], onSelect: (p: any) => void, emptyMessage: string }) {
  if (!projects.length) {
    return (
      <Card className="py-24 flex flex-col items-center border-dashed border-2 bg-transparent rounded-[2rem]">
        <div className="w-24 h-24 bg-muted/50 rounded-3xl flex items-center justify-center mb-6 border border-border/50">
          <AlertCircle className="w-12 h-12 text-muted-foreground opacity-30" />
        </div>
        <p className="font-black text-xl text-muted-foreground uppercase tracking-widest opacity-50">
          Workspace Empty
        </p>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs text-center">
          {emptyMessage}
        </p>
      </Card>
    );
  }

  return (
    <motion.div
      layout
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
    >
      {projects.map((project: any, idx: number) => (
        <motion.div
          key={project._id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          <ProjectCard project={project} onClick={() => onSelect(project)} />
        </motion.div>
      ))}
    </motion.div>
  );
}

function ProjectCard({ project, onClick }: { project: any, onClick: () => void }) {
  const budget = (project.milestones?.reduce((a: any, b: any) => a + b.amount, 0) || 0) / 1e18;
  
  return (
    <Card
      className="group hover:border-primary/50 hover:bg-primary/5 hover:-translate-y-2 transition-all duration-500 cursor-pointer rounded-[2rem] overflow-hidden h-full shadow-2xl hover:shadow-primary/10 border-border/50 flex flex-col"
      onClick={onClick}
    >
      <div className="p-8 pb-4 flex-1">
        <div className="flex justify-between items-start mb-6">
          <StatusBadge status={project.status} />
          {project.deadline && (
            <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              <Clock className="w-3 h-3" /> {new Date(project.deadline).toLocaleDateString()}
            </div>
          )}
        </div>
        
        <h3 className="text-xl font-black group-hover:text-primary transition-colors leading-tight mb-3">
          {project.title}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] leading-relaxed">
          {project.description}
        </p>
      </div>

      <div className="px-8 pb-8">
        <div className="pt-6 border-t border-border/50 flex items-center justify-between mt-auto">
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Contract Budget</p>
            <span className="text-2xl font-black text-primary">
              {budget.toFixed(1)} <span className="text-sm opacity-50">ETH</span>
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-secondary/50 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </div>
    </Card>
  );
}
