import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, Building2, Mail, Lock, User, ArrowRight, 
  Loader2, Eye, EyeOff, Fingerprint, Cpu, Sparkles,
  Terminal, Activity, Server, Code2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { signUp, signIn, user, isLoading: authLoading, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && profile) {
      if (profile.status === 'approved') navigate('/dashboard');
      else navigate('/pending');
    }
  }, [user, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // VALIDATION PRE-CHECK
    if (!email || !password || (isSignUp && (!fullName || !organizationName))) {
      toast({ 
        title: "Missing Credentials", 
        description: "Please fill in all required security fields.",
        variant: "destructive" 
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, fullName, organizationName);
      } else {
        await signIn(email, password);
      }
    } catch (error) {
       console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    toast({ title: 'Registry Access', description: 'Credentials injected into console.' });
  };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#050608]">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#050608] selection:bg-blue-600/30 overflow-hidden">
      
      {/* LEFT PANEL: MODERN TERMINAL BRANDING (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-16 relative overflow-hidden bg-slate-950 border-r border-white/5">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-soft" />
        
        <div className="relative z-10 flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="p-2.5 rounded-2xl bg-blue-600 shadow-xl shadow-blue-600/20 transition-transform group-hover:scale-110">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
            Doc<span className="text-blue-600 drop-shadow-[0_0_10px_rgba(37,99,235,0.5)]">AI</span>
          </span>
        </div>

        <div className="relative z-10 space-y-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500">Identity Protocol Active</span>
            </div>
            <h1 className="text-7xl font-black text-white tracking-tighter leading-[0.85] uppercase">
              Secure<br />Identity<br />
              <span className="text-blue-600 italic">Gateway</span>
            </h1>
          </div>
          
          {/* SECURITY LOG WIDGET */}
          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4 text-slate-500">
                  <Terminal className="h-4 w-4 text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Registry Log</span>
              </div>
              <div className="space-y-4 font-mono text-[10px]">
                  <div className="flex items-center gap-3 text-slate-300">
                      <Lock className="h-3 w-3 text-blue-500" /> ZERO_TRUST: <span className="text-emerald-500 font-bold tracking-widest">ENFORCED</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                      <Server className="h-3 w-3 text-blue-500" /> AUTH_NODE: <span className="text-emerald-500 font-bold tracking-widest">STABLE</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 italic">
                      <Activity className="h-3 w-3" /> Initializing DM Signature...
                  </div>
              </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-6">
           <Fingerprint className="h-6 w-6 text-white/20 hover:text-blue-500 transition-colors cursor-pointer" />
           <Cpu className="h-6 w-6 text-white/20 hover:text-blue-500 transition-colors cursor-pointer" />
           <div className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em] flex items-center gap-2">
             <Code2 className="h-3 w-3" /> Built by DM
           </div>
        </div>
      </div>

      {/* RIGHT PANEL: MACBOOK CONSOLE */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-[#050608] relative">
        {/* Mobile Header */}
        <div className="lg:hidden absolute top-8 flex items-center gap-2">
           <Shield className="h-5 w-5 text-blue-600" />
           <span className="text-xl font-black text-white uppercase tracking-tighter">Doc<span className="text-blue-600">AI</span></span>
        </div>

        <div className="w-full max-w-[480px] perspective-1000 animate-in zoom-in-95 duration-700">
          
          {/* MacBook Screen Housing */}
          <div className="relative bg-[#111] rounded-t-[2.5rem] p-3 border-[6px] border-[#222] shadow-[0_0_60px_-12px_rgba(59,130,246,0.3)]">
            <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#222] rounded-b-xl z-50 flex items-center justify-center border-x border-b border-white/5">
              <div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_5px_blue]" />
            </div>

            <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-white/5 pt-12 pb-8 px-6 sm:px-10">
              {/* Internal Scan Line */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-blue-500/40 shadow-[0_0_15px_blue] animate-scan z-20" />

              <div className="relative z-30 space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black tracking-tighter uppercase text-white leading-none">
                    {isSignUp ? 'Init Node' : 'Auth Login'}
                  </h2>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500/70">Console Registry v2.5.0</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {isSignUp && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Input 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)} 
                        className="h-12 rounded-xl bg-white/[0.05] border-white/10 text-white font-bold placeholder:text-white/30 focus:border-blue-500 transition-colors" 
                        placeholder="FULL NAME" 
                      />
                      <Input 
                        value={organizationName} 
                        onChange={(e) => setOrganizationName(e.target.value)} 
                        className="h-12 rounded-xl bg-white/[0.05] border-white/10 text-white font-bold placeholder:text-white/30 focus:border-blue-500 transition-colors" 
                        placeholder="ORGANIZATION" 
                      />
                    </div>
                  )}
                  <Input 
                    type="email" 
                    value={email} 
                    required
                    onChange={(e) => setEmail(e.target.value)} 
                    className="h-12 rounded-xl bg-white/[0.05] border-white/10 text-white font-bold placeholder:text-white/30 focus:border-blue-500 transition-colors" 
                    placeholder="NETWORK EMAIL" 
                  />
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      required
                      onChange={(e) => setPassword(e.target.value)} 
                      className="h-12 rounded-xl bg-white/[0.05] border-white/10 text-white font-bold placeholder:text-white/30 focus:border-blue-500 transition-colors" 
                      placeholder="SECURITY TOKEN" 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                  >
                    {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : (isSignUp ? 'Create Workspace' : 'Authorize Identity')}
                  </Button>
                </form>

                <div className="text-center">
                  <button onClick={() => setIsSignUp(!isSignUp)} className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-blue-500 transition-colors">
                    {isSignUp ? 'Return to Registry' : 'Register New Node'}
                  </button>
                </div>

                {!isSignUp && (
                  <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={() => handleDemoFill('demo@example.com', 'demo123')} className="h-11 rounded-xl bg-white/[0.02] border-white/10 text-[9px] font-black uppercase tracking-widest text-white/50 hover:text-blue-500 hover:border-blue-500/50 transition-all">
                      Admin Access
                    </Button>
                    <Button variant="outline" onClick={() => handleDemoFill('editor@example.com', 'editor123')} className="h-11 rounded-xl bg-white/[0.02] border-white/10 text-[9px] font-black uppercase tracking-widest text-white/50 hover:text-indigo-500 hover:border-indigo-500/50 transition-all">
                      Editor Access
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Aluminum Laptop Base */}
          <div className="relative mx-auto w-[110%] -left-[5%] h-4 bg-gradient-to-b from-[#222] to-[#111] rounded-b-xl border-t border-white/10 shadow-2xl" />
          <div className="relative mx-auto w-[25%] h-2.5 bg-[#111] rounded-b-full opacity-60 shadow-inner" />
          
          <p className="mt-12 text-center text-[9px] font-black uppercase tracking-[0.5em] text-white/10">
            Secure Infrastructure Layer • 2025
          </p>
        </div>
      </div>
    </div>
  );
}