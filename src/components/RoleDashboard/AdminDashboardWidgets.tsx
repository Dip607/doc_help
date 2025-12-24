import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Users, 
  Clock, 
  Activity, 
  Key,
  TrendingUp,
  AlertCircle,
  Loader2,
  ChevronRight,
  ShieldCheck,
  History
} from 'lucide-react';
import { format } from 'date-fns';

interface AdminStats {
  pendingUsers: number;
  totalUsers: number;
  apiKeysCount: number;
  recentAuditLogs: { action: string; resource_name: string; created_at: string }[];
}

interface AdminDashboardWidgetsProps {
  organizationId: string;
}

export default function AdminDashboardWidgets({ organizationId }: AdminDashboardWidgetsProps) {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, [organizationId]);

  const fetchAdminStats = async () => {
    try {
      const { data: profiles } = await supabase.from('profiles').select('status');
      const pendingUsers = profiles?.filter(p => p.status === 'pending').length || 0;
      const totalUsers = profiles?.length || 0;

      const { data: apiKeys } = await supabase.from('api_keys').select('id').eq('is_active', true);

      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('action, resource_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        pendingUsers,
        totalUsers,
        apiKeysCount: apiKeys?.length || 0,
        recentAuditLogs: auditLogs || [],
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Admin Command Header */}
      <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-card overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-black tracking-tight">Governance Center</CardTitle>
                <CardDescription className="font-medium">System-level controls and user moderation</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="rounded-full px-3 py-1 border-indigo-100 text-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10 font-bold uppercase text-[10px] tracking-widest">
              Root Access
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-8 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Users */}
            <div 
              className="group p-5 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-white dark:hover:bg-slate-900 transition-all shadow-sm hover:shadow-md"
              onClick={() => navigate('/admin')}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 transition-transform group-hover:scale-110">
                  <Users className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Directory</span>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">{stats.totalUsers}</p>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Pending Moderation */}
            <div 
              className={`group p-5 rounded-[2rem] border cursor-pointer transition-all shadow-sm hover:shadow-md ${
                stats.pendingUsers > 0 
                ? 'bg-amber-500/5 border-amber-200/50 hover:bg-amber-500/10' 
                : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'
              }`}
              onClick={() => navigate('/admin')}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl transition-transform group-hover:scale-110 ${stats.pendingUsers > 0 ? 'bg-amber-500/20 text-amber-600' : 'bg-slate-500/10 text-slate-400'}`}>
                  <Clock className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Awaiting Action</span>
              </div>
              <div className="flex items-end justify-between">
                <div className="flex items-center gap-2">
                   <p className={`text-4xl font-black tracking-tighter ${stats.pendingUsers > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{stats.pendingUsers}</p>
                   {stats.pendingUsers > 0 && <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />}
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* API Infrastructure */}
            <div 
              className="group p-5 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-white dark:hover:bg-slate-900 transition-all shadow-sm hover:shadow-md"
              onClick={() => navigate('/settings/api')}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 transition-transform group-hover:scale-110">
                  <Key className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Active Keys</span>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">{stats.apiKeysCount}</p>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Quick Audit Logs */}
            <div 
              className="group p-5 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-white dark:hover:bg-slate-900 transition-all shadow-sm hover:shadow-md"
              onClick={() => navigate('/admin/audit-logs')}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 transition-transform group-hover:scale-110">
                  <Activity className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sec Audit</span>
              </div>
              <div className="flex items-end justify-between pt-2">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Open Stream</p>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      {stats.recentAuditLogs.length > 0 && (
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-card overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  <History className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-black tracking-tight">Recent Events</CardTitle>
              </div>
              <Button variant="ghost" className="rounded-xl h-9 text-xs font-bold text-primary" onClick={() => navigate('/admin/audit-logs')}>
                View Immutable Logs
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {stats.recentAuditLogs.map((log, i) => (
                <div key={i} className="group flex items-center justify-between p-6 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className={`rounded-lg py-0.5 text-[10px] font-black uppercase tracking-tighter border-none bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-primary group-hover:text-white transition-colors`}>
                      {log.action}
                    </Badge>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{log.resource_name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest tabular-nums">
                    {format(new Date(log.created_at), 'HH:mm • MMM d')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}