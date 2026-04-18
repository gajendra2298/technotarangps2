import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { userApi } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '../components/ui';
import { toast } from 'sonner';
import { User, Mail, Shield, BookOpen } from 'lucide-react';

export function ProfilePage() {
  const { user, refreshProfile, loading: contextLoading } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    role: 'FREELANCER',
    companyName: '',
    industry: '',
    website: '',
    title: '',
    skills: '',
    experience: '',
    github: '',
    portfolioLinks: '',
    linkedin: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        role: user.role || 'FREELANCER',
        companyName: user.companyName || '',
        industry: user.industry || '',
        website: user.website || '',
        title: user.title || '',
        skills: user.skills ? user.skills.join(', ') : '',
        experience: user.experience || '',
        github: user.github || '',
        portfolioLinks: user.portfolioLinks ? user.portfolioLinks.join(', ') : '',
        linkedin: user.linkedin || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = { ...formData };
      if (payload.skills) payload.skills = payload.skills.split(',').map((s: string) => s.trim());
      if (payload.portfolioLinks) payload.portfolioLinks = payload.portfolioLinks.split(',').map((s: string) => s.trim());
      
      await userApi.updateProfile(payload);
      await refreshProfile();
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (contextLoading && !user) return <div className="p-8">Loading profile...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30">
          <User className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="text-muted-foreground">Manage your decentralized identity</p>
        </div>
      </div>

      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" /> Email Address
              </label>
              <Input value={user?.email || ''} disabled className="bg-secondary/30" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" /> Full Name
              </label>
              <Input 
                value={formData.name} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" /> Default Role
              </label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.role}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="CLIENT">Client (I hire people)</option>
                <option value="FREELANCER">Freelancer (I work for clients)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-muted-foreground" /> Bio
              </label>
              <textarea 
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.bio}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
              />
            </div>

            {formData.role === 'CLIENT' && (
              <div className="space-y-4 pt-4 border-t border-border/50">
                <h3 className="font-bold text-lg mt-2">Client Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-sm font-medium">Company Name</label>
                     <Input value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="Acme Corp" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-medium">Industry</label>
                     <Input value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} placeholder="e.g. Web3, Healthcare" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Website</label>
                  <Input value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} placeholder="https://" />
                </div>
              </div>
            )}

            {formData.role === 'FREELANCER' && (
              <div className="space-y-4 pt-4 border-t border-border/50">
                <h3 className="font-bold text-lg mt-2">Freelancer Profile</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-sm font-medium">Professional Title</label>
                     <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Full Stack Developer" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-medium">Experience</label>
                     <Input value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} placeholder="5+ years" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Skills (comma separated)</label>
                  <Input value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} placeholder="React, Node.js, Solidity" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-sm font-medium">GitHub</label>
                     <Input value={formData.github} onChange={e => setFormData({...formData, github: e.target.value})} placeholder="https://github.com/..." />
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-medium">LinkedIn</label>
                     <Input value={formData.linkedin} onChange={e => setFormData({...formData, linkedin: e.target.value})} placeholder="https://linkedin.com/..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Portfolio Links (comma separated)</label>
                  <Input value={formData.portfolioLinks} onChange={e => setFormData({...formData, portfolioLinks: e.target.value})} placeholder="https://..." />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Saving Changes...' : 'Save Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
