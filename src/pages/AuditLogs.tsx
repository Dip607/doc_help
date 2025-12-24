import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft,
  Upload,
  Eye,
  FileText,
  Trash2,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  Zap,
  TrendingDown,
  Activity,
  User,
  Calendar
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { format } from 'date-fns';

type AuditAction = 'upload' | 'view' | 'analyze' | 'delete' | 'approve' | 'reject' | 'login' | 'logout' | 'upgrade' | 'downgrade';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: AuditAction;
  resource_type: string;
  resource_id: string | null;
  resource_name: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

const actionIcons: Record<AuditAction, React.ReactNode> = {
  upload: <Upload className="h-4 w-4" />,
  view: <Eye className="h-4 w-4" />,
  analyze: <FileText className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
  approve: <CheckCircle className="h-4 w-4" />,
  reject: <XCircle className="h-4 w-4" />,
  login: <LogIn className="h-4 w-4" />,
  logout: <LogOut className="h-4 w-4" />,
  upgrade: <Zap className="h-4 w-4" />,
  downgrade: <TrendingDown className="h-4 w-4" />,
};

const actionColors: Record<AuditAction, string> = {
  upload: 'bg-blue-500/10 text-blue-500',
  view: 'bg-gray-500/10 text-gray-500',
  analyze: 'bg-purple-500/10 text-purple-500',
  delete: 'bg-red-500/10 text-red-500',
  approve: 'bg-green-500/10 text-green-500',
  reject: 'bg-orange-500/10 text-orange-500',
  login: 'bg-teal-500/10 text-teal-500',
  logout: 'bg-gray-500/10 text-gray-500',
  upgrade: 'bg-yellow-500/10 text-yellow-500',
  downgrade: 'bg-red-500/10 text-red-500',
};

export default function AuditLogs() {
  const { organization, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<AuditAction | 'all'>('all');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', organization?.id, filter],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:user_id (full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('action', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLog[];
    },
    enabled: !!organization && isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You don't have permission to view audit logs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const actionFilters: (AuditAction | 'all')[] = [
    'all', 'upload', 'view', 'analyze', 'delete', 'approve', 'reject', 'login', 'logout', 'upgrade', 'downgrade'
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
                <Activity className="h-6 w-6" />
                Audit Logs
              </h1>
              <p className="text-muted-foreground">Track all activity in your organization</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {actionFilters.map((action) => (
              <Button
                key={action}
                variant={filter === action ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(action)}
                className="capitalize"
              >
                {action === 'all' ? 'All' : action}
              </Button>
            ))}
          </div>

          {/* Logs list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity History</CardTitle>
              <CardDescription>
                {logs?.length || 0} events recorded
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : logs?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No activity logs yet
                </div>
              ) : (
                <div className="space-y-3">
                  {logs?.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border border-border/50"
                    >
                      <div className={`p-2 rounded-lg ${actionColors[log.action]}`}>
                        {actionIcons[log.action]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">
                            {log.profiles?.full_name || log.profiles?.email || 'System'}
                          </span>
                          <Badge variant="outline" className="capitalize text-xs">
                            {log.action}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {log.action === 'upload' && `Uploaded document: ${log.resource_name}`}
                          {log.action === 'view' && `Viewed ${log.resource_type}: ${log.resource_name}`}
                          {log.action === 'analyze' && `Analyzed document: ${log.resource_name}`}
                          {log.action === 'delete' && `Deleted ${log.resource_type}: ${log.resource_name}`}
                          {log.action === 'approve' && `Approved user: ${log.resource_name}`}
                          {log.action === 'reject' && `Rejected user: ${log.resource_name}`}
                          {log.action === 'login' && 'Logged in'}
                          {log.action === 'logout' && 'Logged out'}
                          {log.action === 'upgrade' && 'Upgraded to Pro'}
                          {log.action === 'downgrade' && 'Downgraded to Free'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                          </span>
                          {log.profiles?.email && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {log.profiles.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
