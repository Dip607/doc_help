import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX, LogOut, Mail, AlertCircle } from 'lucide-react';

export default function Deactivated() {
  const { signOut, profile, organization } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a] p-6 relative overflow-hidden">
      {/* Abstract Background Decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-slate-500/5 rounded-full blur-[120px]" />

      <Card className="max-w-md w-full border-none shadow-2xl rounded-[3rem] bg-white dark:bg-slate-900/50 backdrop-blur-xl relative z-10 overflow-hidden">
        {/* Top Danger Accent Bar */}
        <div className="h-2 w-full bg-rose-500" />
        
        <CardHeader className="pt-10 pb-6 text-center space-y-4">
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 bg-rose-500/10 rounded-[2rem] rotate-12 animate-pulse" />
            <div className="absolute inset-0 bg-rose-500/10 rounded-[2rem] -rotate-6" />
            <div className="relative bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xl shadow-rose-500/10 border border-rose-100 dark:border-rose-900/50">
              <ShieldX className="h-10 w-10 text-rose-500" />
            </div>
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Access Restricted
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 font-medium px-4">
              Your account has been deactivated within the 
              <span className="text-rose-600 dark:text-rose-400 font-bold italic ml-1">
                {organization?.name || 'Workspace'}
              </span> environment.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-10 space-y-8">
          <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100/50 dark:border-rose-900/30">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-800 dark:text-rose-300 leading-relaxed font-medium">
                This usually occurs due to an administrative update or billing changes. 
                Please reach out to your team lead to request reactivation.
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              <span className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800" />
              User Context
              <span className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800" />
            </div>
            
            <div className="text-center font-bold text-sm text-slate-600 dark:text-slate-300">
              {profile?.full_name || 'Anonymous User'}
              <p className="text-xs font-medium text-slate-400 mt-0.5">{profile?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button 
              variant="outline" 
              className="h-14 rounded-2xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 font-bold transition-all"
              onClick={() => window.location.href = `mailto:admin@${organization?.name?.toLowerCase().replace(/\s+/g, '') || 'company'}.com`}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email Administrator
            </Button>
            
            <Button 
              variant="default" 
              className="h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-xl active:scale-95 transition-all"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Secure Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <p className="absolute bottom-8 text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
        Protected System Asset
      </p>
    </div>
  );
}