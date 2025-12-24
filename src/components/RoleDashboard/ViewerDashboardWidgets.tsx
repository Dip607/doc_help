import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  FileSearch, 
  Mail,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface ViewerDashboardWidgetsProps {
  organizationName?: string;
}

export default function ViewerDashboardWidgets({ organizationName }: ViewerDashboardWidgetsProps) {
  const navigate = useNavigate();

  return (
    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-card overflow-hidden">
      <CardHeader className="p-8 pb-4 border-b border-slate-50 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                <BookOpen className="h-6 w-6" />
              </div>
              Insight Explorer
            </CardTitle>
            <CardDescription className="text-base font-medium italic">
              Secured read-only access for <span className="text-slate-900 dark:text-white font-bold">{organizationName || 'your organization'}</span>
            </CardDescription>
          </div>
          <Badge variant="outline" className="rounded-full px-4 py-1.5 border-emerald-100 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-500/10 font-bold uppercase text-[10px] tracking-[0.2em]">
            Viewer Protocol
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary Action: Browse */}
          <div 
            className="group relative p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-white dark:hover:bg-slate-900 transition-all shadow-sm hover:shadow-xl hover:shadow-indigo-500/5"
            onClick={() => navigate('/documents/list')}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 transition-transform group-hover:scale-110 duration-500">
                <FileSearch className="h-6 w-6" />
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white mb-1">Library Access</p>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Review existing AI analyses and document sentiment reports.
              </p>
            </div>
          </div>
          
          {/* Secondary Action: Level Up */}
          <div className="p-6 rounded-[2rem] bg-amber-500/[0.03] border border-amber-200/30 flex flex-col justify-between">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Request Collaboration</p>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Need to upload or edit files? Reach out to your workspace administrator.
                </p>
              </div>
            </div>
            
            <Button 
              className="w-full h-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-lg transition-all active:scale-95 group"
              onClick={() => window.location.href = `mailto:admin@${organizationName?.toLowerCase().replace(/\s+/g, '') || 'company'}.com?subject=Request for Editor Access`}
            >
              <Mail className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
              Upgrade to Editor
            </Button>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          Governance active • Read only integrity verified
        </div>
      </CardContent>
    </Card>
  );
}