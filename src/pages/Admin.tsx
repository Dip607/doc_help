import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Shield, 
  Clock,
  Loader2,
  UserCheck,
  UserX,
  Zap,
  Activity,
  ChevronRight,
  Crown,
  Search,
  Mail,
  FilterX
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';

type UserStatus = 'pending' | 'approved' | 'rejected' | 'deactivated';
type UserRole = 'admin' | 'editor' | 'viewer';

interface PendingUser {
  id: string;
  email: string;
  full_name: string | null;
  status: UserStatus;
  created_at: string;
  roles: UserRole[];
}

export default function Admin() {
  const { user, isAdmin, isLoading, isApproved, organization, subscription, isPro, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [searchTerm, setSearchTerm] = useState(''); // Added for Search logic
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, UserRole>>({});
  const [upgradingPlan, setUpgradingPlan] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) navigate('/auth');
    else if (!isLoading && user && !isApproved) navigate('/pending');
    else if (!isLoading && user && isApproved && !isAdmin) navigate('/dashboard');
  }, [user, isLoading, isApproved, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin && organization) fetchUsers();
  }, [isAdmin, organization]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const usersWithRoles: PendingUser[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: rolesData } = await supabase.from('user_roles').select('role').eq('user_id', profile.id);
          return {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            status: profile.status as UserStatus,
            created_at: profile.created_at,
            roles: (rolesData || []).map(r => r.role as UserRole),
          };
        })
      );

      setUsers(usersWithRoles);
      const defaultRoles: Record<string, UserRole> = {};
      usersWithRoles.forEach(u => { if (u.status === 'pending') defaultRoles[u.id] = 'viewer'; });
      setSelectedRoles(defaultRoles);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load user database', variant: 'destructive' });
    } finally {
      setLoadingUsers(false);
    }
  };

  // Live Filter Logic (Fixed search not working)
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const pendingUsers = filteredUsers.filter(u => u.status === 'pending');

  const handleApprove = async (userId: string) => {
    setProcessingUser(userId);
    try {
      const role = selectedRoles[userId] || 'viewer';
      await supabase.from('profiles').update({ status: 'approved' }).eq('id', userId);
      await supabase.from('user_roles').insert({ user_id: userId, role });
      toast({ title: 'Access Granted', description: `User is now a ${role}.` });
      fetchUsers();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setProcessingUser(null);
    }
  };

  const handleDeactivate = async (userId: string, currentStatus: UserStatus) => {
    setProcessingUser(userId);
    const newStatus = currentStatus === 'deactivated' ? 'approved' : 'deactivated';
    try {
      await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
      toast({ title: `User ${newStatus === 'approved' ? 'Reactivated' : 'Deactivated'}` });
      fetchUsers();
    } catch {
      toast({ title: 'Operation failed', variant: 'destructive' });
    } finally {
      setProcessingUser(null);
    }
  };

  if (isLoading || loadingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a]">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500/40" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <Sidebar />
      
      <main className="flex-1 p-4 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => navigate('/dashboard')} className="rounded-2xl border-none bg-white dark:bg-card shadow-sm h-12 w-12 hover:bg-indigo-50 group transition-all">
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              </Button>
              <div>
                <h1 className="text-3xl font-black tracking-tight">Admin Console</h1>
                <p className="text-muted-foreground text-sm font-medium">Manage workspace permissions & billing</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-indigo-500/10 text-indigo-600 px-4 py-2 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
              <Shield className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Authorized Session</span>
            </div>
          </div>

          {/* Subscription Bento Box */}
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 dark:bg-card text-white overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col lg:flex-row">
                <div className="p-10 lg:w-2/3 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                      {isPro ? <Crown className="h-6 w-6 text-amber-400" /> : <Zap className="h-6 w-6 text-emerald-400" />}
                    </div>
                    <div>
                      <h4 className="text-2xl font-black tracking-tight">{isPro ? 'Pro Membership' : 'Starter Tier'}</h4>
                      <p className="text-slate-400 text-sm font-medium italic">Active for {organization?.name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Doc Limit</p>
                      <p className="text-lg font-bold">{isPro ? 'Unlimited' : '10 / Month'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Members</p>
                      <p className="text-lg font-bold">{users.length} Users</p>
                    </div>
                  </div>
                </div>
                <div className="lg:w-1/3 bg-white/5 p-10 flex items-center justify-center border-t lg:border-t-0 lg:border-l border-white/5">
                  <Button 
                    className={`w-full h-14 rounded-2xl font-black text-md transition-all ${isPro ? 'bg-white text-slate-900 hover:bg-slate-200' : 'bg-indigo-500 hover:bg-indigo-600 shadow-xl shadow-indigo-500/20'}`}
                    onClick={isPro ? () => navigate('/settings/subscription') : handleUpgradePlan}
                    disabled={upgradingPlan}
                  >
                    {isPro ? 'MANAGE BILLING' : 'UPGRADE TO PRO'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Approvals (Only shows if there are some) */}
          {pendingUsers.length > 0 && (
            <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3 px-2">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <h4 className="text-xs font-black uppercase tracking-widest text-amber-600">Pending Approvals</h4>
              </div>
              {pendingUsers.map(pUser => (
                <Card key={pUser.id} className="border-none bg-amber-50 dark:bg-amber-900/10 rounded-[2rem] p-6 shadow-sm border-l-4 border-amber-400">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center font-black text-amber-600 shadow-sm">
                        {pUser.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white leading-tight">{pUser.full_name || 'Anonymous'}</p>
                        <p className="text-xs font-bold text-slate-400">{pUser.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select 
                        value={selectedRoles[pUser.id] || 'viewer'} 
                        onValueChange={(v) => setSelectedRoles({...selectedRoles, [pUser.id]: v as UserRole})}
                      >
                        <SelectTrigger className="w-[130px] h-11 rounded-xl bg-white border-none shadow-sm font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={() => handleApprove(pUser.id)} className="rounded-xl h-11 px-8 bg-slate-900 text-white font-black hover:bg-black transition-all">
                        {processingUser === pUser.id ? <Loader2 className="animate-spin h-4 w-4" /> : 'APPROVE'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Search & User Directory */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
              <h3 className="text-xl font-black tracking-tight">User Directory</h3>
              <div className="relative group min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Search members by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-card border-none rounded-[1.5rem] text-sm font-bold shadow-sm ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-card overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800">
              <CardContent className="p-0">
                {filteredUsers.length === 0 ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-slate-300">
                      <FilterX className="h-8 w-8" />
                    </div>
                    <p className="text-slate-500 font-bold">No members found matching "{searchTerm}"</p>
                    <Button variant="ghost" onClick={() => setSearchTerm('')} className="text-indigo-600 font-black">Clear Search</Button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {filteredUsers.map((orgUser) => (
                      <div key={orgUser.id} className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-all group">
                        <div className="flex items-center gap-6">
                          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black text-xl transition-all shadow-sm ${orgUser.status === 'approved' ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-100 text-slate-400'}`}>
                            {orgUser.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-black text-lg">{orgUser.full_name || 'Anonymous'}</p>
                              {orgUser.roles.map(r => (
                                <Badge key={r} variant="secondary" className="rounded-md text-[9px] font-black uppercase tracking-tighter bg-slate-100 dark:bg-slate-800">{r}</Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs mt-0.5">
                              <Mail className="h-3 w-3" /> {orgUser.email}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${
                            orgUser.status === 'approved' ? 'bg-emerald-50 text-emerald-600 ring-emerald-600/20' : 
                            orgUser.status === 'pending' ? 'bg-amber-50 text-amber-600 ring-amber-600/20' : 
                            'bg-slate-50 text-slate-400 ring-slate-400/20'
                          }`}>
                            {orgUser.status}
                          </div>
                          
                          {orgUser.id !== user?.id && (
                            <Button 
                              variant="ghost" 
                              onClick={() => handleDeactivate(orgUser.id, orgUser.status)}
                              className={`rounded-xl h-10 px-4 text-xs font-black transition-all ${orgUser.status === 'approved' ? 'text-rose-500 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                            >
                              {orgUser.status === 'approved' ? 'DEACTIVATE' : 'REACTIVATE'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}