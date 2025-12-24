import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, RefreshCw, LogOut, Building2, Shield, XCircle, ChevronRight, Mail } from 'lucide-react';

export default function Pending() {
  const { user, profile, organization, signOut, refreshProfile, isLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (profile?.status === 'approved') {
      navigate('/dashboard');
    }
  }, [profile, navigate]);

  const handleRefresh = async () => {
    setChecking(true);
    await refreshProfile();
    // Simulate a brief delay for a smoother UX
    setTimeout(() => setChecking(false), 800);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a]">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-16 w-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
          <Shield className="h-6 w-6 text-primary animate-pulse" />
        </div>
        <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          Syncing Credentials
        </p>
      </div>
    );
  }

  const isRejected = profile?.status === 'rejected';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#fafafa] dark:bg-[#0a0a0a] relative overflow-hidden">
      {/* Dynamic Background Blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-[100px] transition-colors duration-1000 ${isRejected ? 'bg-rose-500/10' : 'bg-amber-500/10'}`} />
        <div className="absolute -bottom-40 -left-40 w-[30rem] h-[30rem] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <Card className="w-full max-w-md border-none shadow-2xl rounded-[3rem] bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl relative z-10 overflow-hidden">
        {/* Top Status Accent */}
        <div className={`h-2 w-full ${isRejected ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'}`} />

        <CardHeader className="text-center pt-10 pb-4">
          <div className="mx-auto mb-6">
            <div className={`relative p-6 rounded-[2.5rem] inline-block transition-all duration-500 ${isRejected ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-amber-50 dark:bg-amber-950/30'}`}>
              {isRejected ? (
                <XCircle className="h-12 w-12 text-rose-500" />
              ) : (
                <Clock className="h-12 w-12 text-amber-500 animate-pulse" />
              )}
              {/* Decorative ring */}
              <div className={`absolute inset-0 rounded-[2.5rem] border-2 animate-ping opacity-20 ${isRejected ? 'border-rose-500' : 'border-amber-500'}`} style={{ animationIterationCount: 1, animationDuration: '2s' }} />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {isRejected ? 'Access Denied' : 'Review in Progress'}
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400 font-medium mt-2 px-4">
            {isRejected 
              ? 'Your application to join this workspace was not successful at this time.'
              : 'Our administrators are currently reviewing your request for access.'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 p-8">
          {/* Info Bento Box */}
          <div className="grid grid-cols-1 gap-3 p-2 bg-slate-50 dark:bg-slate-950/50 rounded-[2rem] border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center">
                <Building2 className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Workspace</p>
                <p className="font-bold text-slate-900 dark:text-slate-100">{organization?.name || 'System Default'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 border-t border-slate-100 dark:border-slate-800">
              <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center">
                <Shield className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Status</p>
                <p className={`font-bold ${isRejected ? 'text-rose-600' : 'text-amber-600'}`}>
                  {isRejected ? 'Membership Declined' : 'Pending Verification'}
                </p>
              </div>
            </div>
          </div>

          {!isRejected ? (
            <div className="space-y-4">
              <Button
                onClick={handleRefresh}
                disabled={checking}
                className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-xl active:scale-95 transition-all"
              >
                {checking ? (
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-5 w-5 mr-2" />
                )}
                {checking ? 'Checking Server...' : 'Check Status'}
              </Button>
              <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Updates usually take 24-48 hours
              </p>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-14 rounded-2xl border-slate-200 dark:border-slate-800 font-bold gap-2"
              onClick={() => window.location.href = 'mailto:support@company.com'}
            >
              <Mail className="h-4 w-4" /> Appeal Decision
            </Button>
          )}

          <div className="pt-2">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 text-sm font-bold text-slate-400 hover:text-rose-500 transition-colors group"
            >
              <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Sign out of this account
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Footer Branding */}
      <div className="absolute bottom-8 flex items-center gap-2 opacity-30 font-black text-[10px] uppercase tracking-[0.4em] text-slate-500">
        <Shield className="h-3 w-3" /> Secure Access Layer
      </div>
    </div>
  );
}