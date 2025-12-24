import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Key, 
  Plus, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Terminal,
  Activity,
  Calendar,
  Sparkles,
  ExternalLink,
  Lock,
  Construction
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  calls_count: number;
  last_used_at: string | null;
  created_at: string;
}

export default function ApiKeys() {
  const { organization, isPro, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Mock Data for the preview
  const [apiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Production Environment',
      key_prefix: 'dk_7a2b...',
      is_active: true,
      calls_count: 1240,
      last_used_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
  ]);
  
  const [loading] = useState(false);
  const apiBaseUrl = `https://api.docai.io/v1/public-api`;

  return (
    <div className="flex min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 p-4 lg:p-10 relative">
        {/* --- COMING SOON OVERLAY --- */}
        <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-[2px] bg-white/10 dark:bg-black/10 pointer-events-auto">
          <div className="text-center p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg mx-4 animate-in zoom-in-95 duration-300">
            <div className="bg-indigo-50 dark:bg-indigo-950/30 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Construction className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            <Badge className="mb-4 bg-indigo-500 text-white border-none px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase">
              Coming Soon
            </Badge>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-3 italic">
              API Access is Evolving
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
              We are currently refining our programmatic infrastructure to ensure enterprise-grade security. API Key management will be available in the next release.
            </p>
            <Button 
              onClick={() => navigate('/dashboard')}
              className="h-12 rounded-xl px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-xl hover:scale-105 transition-all"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>

        {/* --- FROZEN UI CONTENT --- */}
        <div className="max-w-5xl mx-auto space-y-8 opacity-40 grayscale-[0.5] select-none pointer-events-none">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="rounded-xl bg-white dark:bg-card">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">API Management</h1>
                <p className="text-muted-foreground text-sm font-medium italic">Programmatic access for your document workflows</p>
              </div>
            </div>
          </div>

          <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-[2.5rem] overflow-hidden opacity-50">
            <CardContent className="p-8 flex items-center gap-6">
              <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-md italic font-black">PRO</div>
              <div className="flex-1 space-y-1">
                <h3 className="text-xl font-bold">API Integration Preview</h3>
                <p className="text-indigo-100 text-sm opacity-90 leading-relaxed"> Automate workflows and stream sentiments directly to your apps.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white dark:bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Create Deployment Key</CardTitle>
              <CardDescription>Generate a new secret for external applications</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col md:flex-row gap-3">
              <Input placeholder="e.g., Marketing Dashboard" className="h-12 rounded-xl bg-[#fafafa] dark:bg-slate-950" />
              <Button className="h-12 rounded-xl px-8 bg-primary font-bold">Generate Key</Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
            <Card className="rounded-[2.5rem] border-none shadow-sm h-full bg-white dark:bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Deployment Keys</CardTitle>
                <CardDescription>Active security tokens for your org</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {apiKeys.map((key) => (
                  <div key={key.id} className="p-5 rounded-3xl bg-[#fafafa] dark:bg-slate-950/50 border border-muted/50 shadow-sm flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary"><Key className="h-5 w-5" /></div>
                        <div>
                          <p className="font-bold text-sm">{key.name}</p>
                          <code className="text-xs font-bold text-muted-foreground opacity-70 tracking-tighter">{key.key_prefix}</code>
                        </div>
                      </div>
                      <Badge className="rounded-full px-3 py-1 border-none font-bold bg-emerald-50 text-emerald-600">Active</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase pt-4 border-t border-muted/50">
                      <div className="flex items-center gap-1.5"><Activity className="h-3 w-3" /> {key.calls_count} Requests</div>
                      <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {new Date(key.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-sm h-full bg-white dark:bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Endpoints & Docs</CardTitle>
                <CardDescription>Quick implementation guide</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">API Base URL</label>
                  <code className="block p-3 rounded-xl bg-[#fafafa] dark:bg-slate-950 font-mono text-xs text-primary truncate border border-muted/50">{apiBaseUrl}</code>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1 p-3 rounded-2xl bg-[#fafafa] dark:bg-slate-950/50 border border-muted/50 opacity-60">
                    <div className="flex items-center gap-2">
                      <Badge className="text-[9px] font-black tracking-widest bg-indigo-500">POST</Badge>
                      <code className="text-xs font-bold font-mono">/analyze</code>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 p-3 rounded-2xl bg-[#fafafa] dark:bg-slate-950/50 border border-muted/50 opacity-60">
                    <div className="flex items-center gap-2">
                      <Badge className="text-[9px] font-black tracking-widest bg-emerald-500">GET</Badge>
                      <code className="text-xs font-bold font-mono">/documents</code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}