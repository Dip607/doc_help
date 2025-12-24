import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  ChevronRight,
  Sparkles,
  Zap,
  Fingerprint,
  Cpu,
  Activity,
  BarChart3,
  PieChart,
  Terminal,
  Globe,
  Database,
  Layers,
  Code2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Index() {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const logs = [
    "INITIALIZING NEURAL CORE...",
    "SYNCING RBAC PROTOCOLS...",
    "ANALYZING DOCUMENT CLUSTERS...",
    "SENTIMENT ENGINE ONLINE",
    "ENCRYPTING DATA NODES...",
    "MADE BY DM // 2025"
  ];

  useEffect(() => {
    if (!isLoading && user && profile) {
      if (profile.status === 'approved') {
        navigate('/dashboard');
      } else {
        navigate('/pending');
      }
    }
  }, [user, profile, isLoading, navigate]);

  return (
    <div className="min-h-screen hero-gradient relative overflow-x-hidden selection:bg-blue-600 selection:text-white bg-[#050608]">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[1000px] h-[1000px] bg-blue-600/10 rounded-full blur-[150px] animate-pulse-soft" />
        <div className="absolute bottom-[-10%] left-[-20%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[130px] animate-pulse-soft" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="container mx-auto px-6 py-8 flex items-center justify-between relative z-50">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_0_25px_rgba(59,130,246,0.3)] transition-all group-hover:scale-110 group-hover:border-blue-500/50">
              <Shield className="h-6 w-6 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            </div>
            <span className="text-4xl font-black text-white tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              Doc<span className="text-blue-500 drop-shadow-[0_0_20px_rgba(59,130,246,0.9)]">AI</span>
            </span>
          </div>
          
          <Button 
            onClick={() => navigate('/auth')}
            className="rounded-full px-8 bg-white/10 text-white border border-white/20 hover:bg-white hover:text-black transition-all font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95"
          >
            Sign In
          </Button>
        </nav>

        {/* Hero Section */}
        <main className="flex-1 container mx-auto px-6 pt-16 pb-32 flex flex-col items-center">
          <div className="max-w-4xl text-center space-y-8 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 animate-fade-in backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-blue-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Security Architecture v2.5 Online</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter uppercase">
              Data is messy.<br />
              <span className="text-blue-500 italic drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">Answers shouldn't be.</span>
            </h1>

            <div className="pt-6 flex flex-col items-center gap-10">
              <Button 
                onClick={() => navigate('/auth')}
                className="h-20 px-12 rounded-[2.5rem] shadow-[0_0_60px_-15px_rgba(59,130,246,0.6)] bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-sm transition-all hover:scale-105 active:scale-95 group"
              >
                Launch Console
                <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-2 transition-transform" />
              </Button>

              {/* LOG TICKER */}
              <div className="w-full max-w-xl overflow-hidden py-4 border-y border-white/5 relative group opacity-60">
                <div className="flex animate-marquee whitespace-nowrap gap-12 group-hover:[animation-play-state:paused]">
                  {[...logs, ...logs].map((log, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-[9px] font-black font-mono text-white/40 uppercase tracking-[0.3em]">{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* MACBOOK MOCKUP */}
          <div 
            className="w-full max-w-5xl relative transition-all duration-1000"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ perspective: '2000px' }}
          >
            <div className={cn(
                "relative mx-auto bg-[#0a0a0a] rounded-t-[2.5rem] p-3 sm:p-4 border-[6px] border-[#2a2a2a] shadow-[0_80px_150px_-30px_rgba(0,0,0,1)] transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]",
                isHovered ? "rotate-x-2 translate-y-[-15px] scale-[1.02]" : "rotate-x-0"
            )}>
              <div className="relative aspect-[16/10] bg-[#010101] rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                    <span className={cn(
                        "text-3xl sm:text-5xl font-black uppercase tracking-[1.5em] text-white/[0.03] transition-all duration-1000 leading-none",
                        isHovered && "text-white/[0.2] tracking-[1.2em] drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    )}>
                        Made by DM
                    </span>
                </div>
                <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_40px_rgba(59,130,246,1)] animate-scan z-40" />
              </div>
            </div>
            <div className="relative mx-auto w-[114%] -left-[7%] h-6 bg-gradient-to-b from-[#3a3a3a] to-[#0a0a0a] rounded-b-[2rem] border-t border-white/10 z-10" />
          </div>
        </main>

        {/* FOOTER - HIGH VISIBILITY REDESIGN */}
        <footer className="mt-auto relative border-t border-white/10 bg-[#020203] py-24 overflow-hidden">
          {/* Subtle Top Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-20 items-start">
              
              {/* BRANDING COLUMN */}
              <div className="col-span-1 md:col-span-2 space-y-8">
                <div className="flex items-center gap-4 group">
                  <div className="p-3 rounded-2xl bg-blue-600 shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-transform group-hover:scale-110">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <span className="text-5xl font-black text-white tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    Doc<span className="text-blue-500">AI</span>
                  </span>
                </div>
                <p className="text-white/40 text-xl max-w-md italic font-medium leading-relaxed tracking-tight">
                  Architecting the benchmark for organizational data intelligence and secure document governance.
                </p>
                <div className="flex gap-4">
                  {[Globe, Database, Fingerprint].map((Icon, idx) => (
                    <div key={idx} className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-blue-500 hover:border-blue-500/50 transition-all cursor-pointer">
                      <Icon className="h-5 w-5" />
                    </div>
                  ))}
                </div>
              </div>

              {/* NAVIGATION LINKS */}
              <div className="space-y-8">
                <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-blue-500/80">Protocol Infrastructure</h4>
                <ul className="space-y-4">
                  {['Neural Engine', 'RBAC Security Gateway', 'Identity Registry', 'API Core v2.5'].map((item) => (
                    <li key={item} className="text-sm font-bold text-white/40 hover:text-white transition-colors cursor-pointer flex items-center gap-2 group">
                      <ChevronRight className="h-3 w-3 text-blue-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* ACTION & SIGNATURE */}
              <div className="space-y-8">
                <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-blue-500/80">Network Support</h4>
                <Button className="w-full rounded-[2rem] bg-blue-600 shadow-[0_20px_40px_-10px_rgba(59,130,246,0.5)] font-black uppercase text-[12px] tracking-widest h-16 hover:bg-blue-500 transition-all hover:scale-105">
                  Connect Node
                </Button>
                <div className="pt-6 border-t border-white/5 space-y-2">
                  <div className="flex items-center justify-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-[0.6em]">
                    <Code2 className="h-3 w-3 text-blue-500/40" /> Built by <span className="text-white/40">DM</span>
                  </div>
                  <p className="text-center text-[8px] font-bold text-white/10 uppercase tracking-[0.4em]">Proprietary Intelligence © 2025</p>
                </div>
              </div>

            </div>
          </div>
        </footer>
      </div>
    </div>
  ); 
}