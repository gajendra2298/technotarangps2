import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import { fetchProjects } from '../redux/slices/projectsSlice';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../components/ui';
import { Plus, AlertCircle, DollarSign, Briefcase, Zap } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { ProjectModal } from '../components/ProjectModal';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export function Dashboard() {
  const dispatch = useAppDispatch();
  const { role, user: appUser } = useAppSelector(state => state.auth);
  const { items: projects, loading } = useAppSelector(state => state.projects);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const handleCreateProject = () => {
    if (role !== 'CLIENT') {
      toast.error("Only clients can create projects");
      return;
    }
    setIsCreateModalOpen(true);
  };

  if (loading && !projects?.length) return (
    <div className="space-y-8 animate-pulse">
      <div className="h-20 bg-card rounded-xl border glass" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-card rounded-xl border glass" />)}
      </div>
    </div>
  );

  const visibleProjects = projects?.filter((p: any) => {
    if (role === 'CLIENT') return p.clientId?._id === appUser?._id || p.clientId === appUser?._id || true; // Keep true fallback for backward compat
    return p.status === 'OPEN' || p.assignedFreelancerId === appUser?._id || p.freelancerId?._id === appUser?._id;
  }) || [];

  const earnings = visibleProjects.reduce((acc: number, p: any) => acc + (p.milestones.filter((m: any) => m.status === 'APPROVED').reduce((sum: number, m: any) => sum + m.amount, 0)), 0) || 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Welcome, {appUser?.name || 'Partner'}
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            Professional <span className="font-bold text-foreground px-2 py-0.5 rounded bg-secondary text-xs uppercase tracking-widest">{role || 'User'}</span> Portal
          </p>
        </div>
        {role === 'CLIENT' && (
          <Button onClick={handleCreateProject} className="gap-2 shadow-2xl shadow-primary/40 h-12 px-6 rounded-2xl bg-primary hover:scale-105 transition-transform">
            <Plus className="w-5 h-5" /> Initialize Workstream
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  {role === 'CLIENT' ? 'Escrowed Volume' : 'Total Revenue'}
                </p>
                <h3 className="text-3xl font-black mt-1">{(earnings / 1e18).toFixed(2)} <span className="text-sm font-bold opacity-50">ETH</span></h3>
              </div>
              <div className="p-4 bg-primary/20 rounded-2xl shadow-inner">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/30 backdrop-blur-sm border-white/5 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Active Streams</p>
                <h3 className="text-3xl font-black mt-1">{visibleProjects.length || 0}</h3>
              </div>
              <div className="p-4 bg-blue-500/10 rounded-2xl">
                <Briefcase className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List view */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          Active Workstreams
        </h2>
        <div className="h-px flex-1 mx-4 bg-border/50 hidden md:block" />
      </div>

      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {visibleProjects.map((project: any, idx: number) => (
          <motion.div
            key={project._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card 
              className="hover:border-primary/50 hover:bg-primary/5 hover:-translate-y-1 transition-all cursor-pointer group rounded-3xl overflow-hidden h-full shadow-lg hover:shadow-primary/10"
              onClick={() => setSelectedProject(project)}
            >
            <CardHeader className="pb-2">
              <CardTitle className="group-hover:text-primary transition-colors text-lg font-bold">{project.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6 line-clamp-2 min-h-[40px]">
                {project.description}
              </p>
              
              <div className="flex justify-between items-center mb-4">
                 <div className="text-xs font-mono text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                   ID: {project.blockchainId}
                 </div>
                 <span className="text-sm font-black">
                   {(project.milestones.reduce((a: any, b: any) => a + b.amount, 0) / 1e18).toFixed(1)} ETH
                 </span>
              </div>

              <div className="pt-4 border-t border-border/50 flex flex-wrap gap-2">
                {project.milestones.map((m: any, idx: number) => (
                  <StatusBadge key={idx} status={m.status} />
                ))}
              </div>
            </CardContent>
            </Card>
          </motion.div>
        ))}

        {!visibleProjects.length && !loading && (
          <Card className="col-span-full py-24 flex flex-col items-center border-dashed border-2 bg-transparent rounded-3xl">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-muted-foreground opacity-50" />
            </div>
            <p className="font-black text-xl text-muted-foreground uppercase tracking-widest opacity-50">Empty Workspace</p>
            <p className="text-sm text-muted-foreground mt-2">Initialize your first project to get started.</p>
          </Card>
        )}
      </motion.div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectModal 
          project={projects?.find((p: any) => p._id === selectedProject._id) || selectedProject} 
          onClose={() => setSelectedProject(null)} 
        />
      )}

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <CreateProjectModal 
          onClose={() => setIsCreateModalOpen(false)} 
        />
      )}
    </div>
  );
}


