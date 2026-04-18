import { User, ShieldCheck, Star, Briefcase } from 'lucide-react';
import { Card, CardContent } from './ui';
import { SkillBadge } from './SkillBadge';

interface ProfileCardProps {
  profile: any;
  role: 'CLIENT' | 'FREELANCER';
}

export function ProfileCard({ profile, role }: ProfileCardProps) {
  if (!profile) return (
    <Card className="bg-secondary/20 border-border/50 border-dashed shadow-none">
      <CardContent className="p-4 flex items-center gap-3 text-muted-foreground text-sm">
        <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center">
          <User className="w-5 h-5 opacity-50" />
        </div>
        <div>
          <p className="font-bold">No {role.toLowerCase()} assigned</p>
          <p className="text-xs">Pending platform match</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-white/10 shadow-lg hover:border-primary/30 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center overflow-hidden border border-primary/20">
                <User className="w-6 h-6" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-card flex items-center justify-center" title="Verified User">
              <ShieldCheck className="w-3 h-3 text-white" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm truncate">
                {role === 'CLIENT' ? (profile.companyName || profile.name || 'Client') : (profile.name || 'Freelancer')}
              </h4>
              <div className="flex items-center gap-1 text-xs font-bold text-orange-400">
                <Star className="w-3 h-3 fill-orange-400" />
                {profile.rating || '5.0'}
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground truncate">
              {role === 'CLIENT' ? (profile.industry || 'Tech Client') : (profile.title || 'Independent Professional')}
            </p>
            
            <div className="flex items-center gap-3 pt-2 text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
              <div className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                <span>{role === 'CLIENT' ? profile.projectsPosted || 0 : profile.completedProjects || 0} Projects</span>
              </div>
            </div>
          </div>
        </div>

        {role === 'FREELANCER' && profile.skills && profile.skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {profile.skills.slice(0, 3).map((skill: string, idx: number) => (
               <SkillBadge key={idx} skill={skill} />
            ))}
            {profile.skills.length > 3 && (
              <span className="text-xs text-muted-foreground self-center ml-1">+{profile.skills.length - 3}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
