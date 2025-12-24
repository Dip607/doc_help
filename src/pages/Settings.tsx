import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  User,
  Building2,
  Shield,
  Loader2,
  Save,
  Mail,
  Fingerprint,
  Lock,
  ExternalLink,
  Crown,
  Construction,
  Clock
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { Badge } from '@/components/ui/badge';

export default function Settings() {
  const { user, profile, organization, isPro, isAdmin, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast({ title: 'Profile updated', description: 'Changes saved successfully.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!user || email === user.email) return;
    setSavingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      toast({ title: 'Check your inbox', description: 'Confirm the change at your new email.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update email', variant: 'destructive' });
    } finally {
      setSavingEmail(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <Sidebar />
      
      <main className="flex-1 p-4 lg:p-10">
        <div className="max-w-4xl mx-auto space-y-10">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => navigate('/dashboard')} className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-card">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground text-sm font-medium italic">Configure account and security preferences</p>
              </div>
            </div>
            {isPro && (
              <Badge className="bg-blue-600 text-white border-none px-4 py-1.5 rounded-full flex gap-2 shadow-lg shadow-blue-500/20">
                <Crown className="h-3.5 w-3.5" /> Professional Tier
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Sidebar-lite Navigation */}
            <div className="lg:col-span-4 space-y-2">
              <nav className="flex flex-col gap-1">
                <Button variant="secondary" className="justify-start gap-3 rounded-xl h-12 bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
                  <User className="h-4 w-4 text-blue-500" /> General Profile
                </Button>
                <Button variant="ghost" className="justify-start gap-3 rounded-xl h-12 text-muted-foreground hover:bg-white dark:hover:bg-slate-900" onClick={() => navigate('/settings/subscription')}>
                  <Building2 className="h-4 w-4" /> Workspace & Billing
                </Button>
                <Button variant="ghost" className="justify-start gap-3 rounded-xl h-12 text-muted-foreground opacity-50 cursor-not-allowed">
                  <Shield className="h-4 w-4" /> Security Logs
                </Button>
              </nav>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Profile Information */}
              <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-card overflow-hidden">
                <CardHeader className="border-b border-slate-50 dark:border-slate-800 p-8">
                  <CardTitle className="text-xl">Identity Details</CardTitle>
                  <CardDescription>Update your personal information and avatar</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                    <div className="relative group">
                        <div className="h-24 w-24 rounded-[2.5rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-blue-500/20">
                        {fullName.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-md border border-slate-100 dark:border-slate-700">
                            <Save className="h-4 w-4 text-blue-500" />
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full space-y-5">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Display Name</Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input 
                            value={fullName} 
                            onChange={(e) => setFullName(e.target.value)}
                            className="h-12 rounded-xl bg-slate-50 dark:bg-slate-950 border-none ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. Alex Thompson"
                          />
                          <Button 
                            onClick={handleSaveProfile}
                            disabled={saving || fullName === profile?.full_name}
                            className="rounded-xl h-12 px-6 bg-slate-900 dark:bg-white dark:text-slate-900 font-bold"
                          >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Primary Email</Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="relative flex-1">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                              type="email"
                              value={email} 
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-11 h-12 rounded-xl bg-slate-50 dark:bg-slate-950 border-none ring-1 ring-slate-200 dark:ring-slate-800"
                            />
                          </div>
                          <Button 
                            variant="outline"
                            onClick={handleSaveEmail}
                            disabled={savingEmail || email === user?.email}
                            className="rounded-xl h-12 font-bold border-slate-200"
                          >
                            {savingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Email'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Section (Coming Soon Visual) */}
              <div className="relative">
                {/* --- COMING SOON OVERLAY --- */}
                <div className="absolute inset-0 z-10 bg-white/40 dark:bg-black/20 backdrop-blur-[1px] rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <div className="bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-500">
                        <Construction className="h-5 w-5 text-amber-500" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Advanced Security Features Coming Soon</span>
                    </div>
                </div>

                {/* --- FROZEN/DISABLED CONTENT --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-40 select-none pointer-events-none grayscale-[0.3]">
                    {[
                    { title: 'Password Management', status: 'Last rotated: Jul 2024', icon: Lock },
                    { title: 'Two-Factor (2FA)', status: 'SMS or Authenticator App', icon: Fingerprint },
                    ].map((item, i) => (
                    <Card key={i} className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-card">
                        <CardContent className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950">
                                    <item.icon className="h-6 w-6 text-slate-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-base">{item.title}</p>
                                    <p className="text-xs font-medium text-slate-400">{item.status}</p>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full rounded-xl h-12 font-bold text-xs border-slate-100">
                                Configure Credentials
                            </Button>
                        </CardContent>
                    </Card>
                    ))}
                </div>
              </div>

              {/* Organization Snippet */}
              <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-card overflow-hidden group border border-slate-50 dark:border-slate-900">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-600">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{organization?.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="rounded-md text-[10px] font-bold px-1.5 border-slate-200">Active Node</Badge>
                            <span className="text-[10px] font-medium text-slate-400 tracking-tight">ID: {organization?.id?.slice(0, 12)}...</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 transition-colors" onClick={() => navigate('/settings/subscription')}>
                        <ExternalLink className="h-4 w-4 text-slate-400" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}