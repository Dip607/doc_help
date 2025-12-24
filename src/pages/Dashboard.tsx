import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Upload,
  Activity,
  Clock,
  Hash,
  ArrowRight,
  Loader2,
  Sparkles,
  Search,
  AlertCircle,
  Zap
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { OnboardingTour } from '@/components/OnboardingTour';
import { TourTrigger } from '@/components/TourTrigger';
import { dashboardTourSteps } from '@/hooks/useOnboardingTour';
import { cn } from '@/lib/utils';

// Role-specific widget imports
import AdminDashboardWidgets from '@/components/RoleDashboard/AdminDashboardWidgets';
import EditorDashboardWidgets from '@/components/RoleDashboard/EditorDashboardWidgets';
import ViewerDashboardWidgets from '@/components/RoleDashboard/ViewerDashboardWidgets';

interface DashboardStats {
  totalDocuments: number;
  totalWords: number;
  avgReadingTime: number;
  sentimentDistribution: { name: string; value: number; color: string }[];
  keywordFrequency: { keyword: string; count: number }[];
  recentDocuments: { id: string; name: string; sentiment: string; created_at: string }[];
}

export default function Dashboard() {
  const { 
    user, 
    profile, 
    organization, 
    subscription, 
    isAdmin, 
    isEditor, 
    isViewer, 
    isApproved, 
    isDeactivated, 
    isLoading 
  } = useAuth();
  
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [tourKey, setTourKey] = useState(0);

  // --- TOUR LOGIC ---
  const handleStartTour = useCallback(() => {
    localStorage.removeItem('docai_onboarding_completed_dashboard');
    localStorage.removeItem('docai_onboarding_skipped_dashboard');
    setTourKey(prev => prev + 1);
  }, []);

  // --- AUTH GUARDS ---
  useEffect(() => {
    if (!isLoading && !user) navigate('/auth');
    if (!isLoading && user && isDeactivated) navigate('/deactivated');
    if (!isLoading && user && !isApproved && !isDeactivated) navigate('/pending');
  }, [user, isLoading, isApproved, isDeactivated, navigate]);

  useEffect(() => {
    if (organization && isApproved) fetchStats();
  }, [organization, isApproved]);

  // --- DATA FETCHING ---
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const { data: docs } = await supabase
        .from('documents')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: analyses } = await supabase.from('document_analyses').select('*');

      const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
      const keywordMap: Record<string, number> = {};
      let totalWords = 0;
      let totalReadingTime = 0;

      (analyses || []).forEach(a => {
        sentimentCounts[a.sentiment as keyof typeof sentimentCounts]++;
        totalWords += a.word_count || 0;
        totalReadingTime += a.reading_time_minutes || 0;
        (a.keywords || []).forEach((k: string) => {
          keywordMap[k] = (keywordMap[k] || 0) + 1;
        });
      });

      const keywordFrequency = Object.entries(keywordMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([keyword, count]) => ({ keyword, count }));

      const recentDocIds = (docs || []).slice(0, 5).map(d => d.id);
      const recentWithSentiment = await Promise.all(
        recentDocIds.map(async (docId) => {
          const doc = docs?.find(d => d.id === docId);
          const { data: analysis } = await supabase
            .from('document_analyses')
            .select('sentiment')
            .eq('document_id', docId)
            .order('version', { ascending: false })
            .limit(1)
            .maybeSingle();
          return {
            id: docId,
            name: doc?.name || '',
            sentiment: analysis?.sentiment || 'neutral',
            created_at: doc?.created_at || '',
          };
        })
      );

      setStats({
        totalDocuments: docs?.length || 0,
        totalWords,
        avgReadingTime: analyses?.length ? Math.round(totalReadingTime / analyses.length) : 0,
        sentimentDistribution: [
          { name: 'Positive', value: sentimentCounts.positive, color: '#3b82f6' },
          { name: 'Neutral', value: sentimentCounts.neutral, color: '#94a3b8' },
          { name: 'Negative', value: sentimentCounts.negative, color: '#f43f5e' },
        ],
        keywordFrequency,
        recentDocuments: recentWithSentiment,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // --- UI HELPERS ---
  const getRoleDisplay = () => {
    if (isAdmin) return { label: 'Administrator', color: 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' };
    if (isEditor) return { label: 'Editor', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200' };
    return { label: 'Viewer', color: 'bg-slate-500/10 text-slate-600 border-slate-200' };
  };

  const role = getRoleDisplay();
  const usageLimit = subscription?.documents_limit || 5;
  const usageCurrent = subscription?.documents_used || 0;
  const usagePercent = (usageCurrent / usageLimit) * 100;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl shadow-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500/40" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#fafafa] dark:bg-[#08090a]">
      <OnboardingTour 
        key={tourKey}
        config={{
          tourId: 'dashboard',
          steps: dashboardTourSteps,
          autoStart: true,
        }}
      />
      
      <Sidebar />
      
      <main className="flex-1 p-4 sm:p-6 lg:p-10 w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Usage Notification Banner */}
          {usagePercent > 80 && (
            <div className="flex items-center justify-between p-4 rounded-[1.5rem] bg-amber-500/10 border border-amber-500/20 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <span className="text-[11px] font-black text-amber-700 uppercase tracking-widest">
                  Memory Limit Warning ({usageCurrent}/{usageLimit} Nodes)
                </span>
              </div>
              <Button size="sm" variant="ghost" className="h-8 rounded-lg text-[10px] font-black uppercase text-amber-700 hover:bg-amber-500/20" onClick={() => navigate('/settings/subscription')}>
                Expand Capacity
              </Button>
            </div>
          )}

          {/* Header Section */}
          <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/5 border border-blue-500/10 text-blue-600 text-[9px] font-black uppercase tracking-[0.2em]">
                  <Sparkles className="h-3 w-3" />
                  <span>AI Nodes Online</span>
                </div>
                <Badge className={cn("rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest border-none", role.color)}>
                  {role.label}
                </Badge>
              </div>

              <div className="space-y-1">
                <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none">
                  Welcome back, {profile.full_name?.split(' ')[0] || 'User'}
                </h1>
                <p className="text-slate-400 text-sm sm:text-base font-bold italic tracking-tight">
                  Neural patterns analyzed. System reporting 100% integrity.
                </p>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <TourTrigger onStartTour={handleStartTour} />
              <Button 
                onClick={() => navigate('/documents/upload')} 
                size="lg" 
                data-tour="upload-action"
                className="shadow-xl shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest h-12 px-8 rounded-xl transition-all active:scale-95 group"
              >
                <Upload className="h-4 w-4 mr-2 transition-transform group-hover:-translate-y-1" />
                Analyze New Archive
              </Button>
            </div>
          </section>

          {/* Role-specific Widgets (Admin/Editor/Viewer) */}
          <section className="animate-in fade-in duration-700">
            {isAdmin && organization && <AdminDashboardWidgets organizationId={organization.id} />}
            {isEditor && !isAdmin && <EditorDashboardWidgets />}
            {isViewer && <ViewerDashboardWidgets organizationName={organization?.name} />}
          </section>

          {loadingStats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 rounded-[2rem] bg-slate-100 dark:bg-slate-900 animate-pulse" />
              ))}
            </div>
          ) : stats && (
            <>
              {/* Stats Bento Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" data-tour="dashboard-stats">
                {[
                  { label: 'Archives', value: stats.totalDocuments, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  { label: 'Token Vol', value: stats.totalWords.toLocaleString(), icon: Hash, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                  { label: 'Latency', value: `${stats.avgReadingTime}m`, icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                  { label: 'Usage', value: `${usageCurrent}/${subscription?.plan === 'pro' ? '∞' : usageLimit}`, icon: Zap, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                ].map((stat, idx) => (
                  <Card key={idx} className="border-none shadow-sm rounded-[2rem] bg-white dark:bg-slate-900/50 backdrop-blur-md group hover:shadow-xl transition-all duration-500">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={cn("p-3 rounded-2xl transition-transform group-hover:rotate-6", stat.bg)}>
                          <stat.icon className={cn("h-5 w-5", stat.color)} />
                        </div>
                        <Activity className="h-4 w-4 text-slate-200 dark:text-slate-800" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">{stat.value}</p>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">{stat.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Advanced Analytics Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sentiment Pie */}
                <Card className="lg:col-span-1 rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-slate-900/50 backdrop-blur-md overflow-hidden">
                  <CardHeader className="p-8 pb-0">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Emotional Spectrum</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    {stats.sentimentDistribution.some(s => s.value > 0) ? (
                      <div className="h-64 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stats.sentimentDistribution.filter(s => s.value > 0)}
                              innerRadius={70}
                              outerRadius={90}
                              paddingAngle={10}
                              dataKey="value"
                              stroke="none"
                            >
                              {stats.sentimentDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-4xl font-black text-slate-900 dark:text-white">{stats.totalDocuments}</span>
                          <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Core Files</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-slate-300 font-black uppercase text-[10px] tracking-widest italic">No Data</div>
                    )}
                  </CardContent>
                </Card>

                {/* Keyword Bar Chart */}
                <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-slate-900/50 backdrop-blur-md overflow-hidden">
                  <CardHeader className="p-8 pb-0">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Concept Frequency</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.keywordFrequency} layout="vertical" margin={{ left: -10, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#88888810" />
                          <XAxis type="number" hide />
                          <YAxis 
                            type="category" 
                            dataKey="keyword" 
                            axisLine={false}
                            tickLine={false}
                            width={110}
                            tick={{ fontSize: 10, fontWeight: 900, fill: 'currentColor' }}
                            className="uppercase tracking-tighter"
                          />
                          <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
                          <Bar dataKey="count" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={14} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Document Registry Table */}
              <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-slate-900/50 backdrop-blur-md overflow-hidden" data-tour="recent-documents">
                <CardHeader className="flex flex-row items-center justify-between p-8 border-b border-slate-50 dark:border-slate-800/50">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Operational Log</CardTitle>
                  <Button variant="ghost" size="sm" className="rounded-xl font-black uppercase text-[9px] tracking-[0.2em] text-blue-600 hover:bg-blue-500/5" onClick={() => navigate('/documents/list')}>
                    Registry <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {stats.recentDocuments.length > 0 ? (
                      stats.recentDocuments.map((doc) => (
                        <div 
                          key={doc.id}
                          className="group flex items-center justify-between p-6 hover:bg-blue-500/[0.02] transition-all cursor-pointer"
                          onClick={() => navigate(`/documents/list`)}
                        >
                          <div className="flex items-center gap-5">
                            <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-100 dark:border-slate-800 group-hover:border-blue-500/30 transition-all">
                              <FileText className="h-5 w-5 text-slate-400 group-hover:text-blue-500" />
                            </div>
                            <div>
                              <p className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight">{doc.name}</p>
                              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                Logged // {new Date(doc.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className={cn(
                              "capitalize rounded-xl px-4 py-1 text-[9px] font-black tracking-widest border-none ring-1 ring-inset",
                              doc.sentiment === 'positive' ? 'bg-blue-500 text-white ring-blue-500 shadow-md shadow-blue-500/20' : 
                              doc.sentiment === 'negative' ? 'bg-rose-500 text-white ring-rose-500 shadow-md shadow-rose-500/20' : 
                              'bg-slate-200 text-slate-600 ring-slate-300'
                            )}>
                              {doc.sentiment === 'positive' && <TrendingUp className="mr-1.5 h-3 w-3 inline" />}
                              {doc.sentiment === 'negative' && <TrendingDown className="mr-1.5 h-3 w-3 inline" />}
                              {doc.sentiment === 'neutral' && <Minus className="mr-1.5 h-3 w-3 inline" />}
                              {doc.sentiment}
                            </Badge>
                            <ArrowRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-24 text-center">
                        <Activity className="h-10 w-10 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">No Activity Recorded</p>
                        <Button variant="link" className="font-black text-blue-600 uppercase text-[9px] mt-2" onClick={() => navigate('/documents/upload')}>Start Analysis</Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}