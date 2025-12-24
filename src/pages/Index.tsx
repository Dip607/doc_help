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
        <div className="absolute top-[-10%] right-[-5%] w-[300px] md:w-[1000px] h-[300px] md:h-[1000px] bg-blue-600/10 rounded-full blur-[80px] md:blur-[150px] animate-pulse-soft" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[300px] md:w-[800px] h-[300px] md:h-[800px] bg-indigo-600/10 rounded-full blur-[80px] md:blur-[130px] animate-pulse-soft" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="container mx-auto px-4 md:px-6 py-6 md:py-8 flex items-center justify-between relative z-50">
          <div className="flex items-center gap-2 md:gap-3 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="p-2 md:p-2.5 rounded-xl md:rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_0_25px_rgba(59,130,246,0.3)] transition-all group-hover:scale-110 group-hover:border-blue-500/50">
              <Shield className="h-5 w-5 md:h-6 md:w-6 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            </div>
            <span className="text-xl md:text-4xl font-black text-white tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              Doc<span className="text-blue-500">AI</span>
            </span>
          </div>
          
          <Button 
            onClick={() => navigate('/auth')}
            className="rounded-full px-5 md:px-8 bg-white/10 text-white border border-white/20 hover:bg-white hover:text-black transition-all font-black uppercase text-[9px] md:text-[10px] tracking-widest active:scale-95"
          >
            Sign In
          </Button>
        </nav>

        {/* Hero Section */}
        <main className="flex-1 container mx-auto px-4 md:px-6 pt-10 md:pt-16 pb-20 md:pb-32 flex flex-col items-center">
          <div className="max-w-4xl text-center space-y-6 md:space-y-8 mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-blue-500/10 border border-blue-500/20 animate-fade-in backdrop-blur-md">
              <Sparkles className="h-3 md:h-3.5 w-3 md:w-3.5 text-blue-500 animate-pulse" />
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">v2.5 Online</span>
            </div>

            <h1 className="text-4xl md:text-8xl font-black text-white leading-[1.1] md:leading-[0.9] tracking-tighter uppercase">
              Data is messy.<br />
              <span className="text-blue-500 italic drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">Answers shouldn't be.</span>
            </h1>

            <div className="pt-4 md:pt-6 flex flex-col items-center gap-6 md:gap-10">
              <Button 
                onClick={() => navigate('/auth')}
                className="w-full md:w-auto h-16 md:h-20 px-10 md:px-12 rounded-2xl md:rounded-[2.5rem] bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs md:text-sm transition-all active:scale-95 group"
              >
                Launch Console
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5 ml-2 group-hover:translate-x-2 transition-transform" />
              </Button>

              {/* LOG TICKER - MOBILE OPTIMIZED */}
              <div className="w-full max-w-xs md:max-w-xl overflow-hidden py-3 md:py-4 border-y border-white/5 relative group opacity-60">
                <div className="flex animate-marquee whitespace-nowrap gap-8 md:gap-12">
                  {[...logs, ...logs].map((log, i) => (
                    <div key={i} className="flex items-center gap-2 md:gap-3">
                      <div className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-[8px] md:text-[9px] font-black font-mono text-white/40 uppercase tracking-[0.3em]">{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* MACBOOK MOCKUP - SCALED FOR MOBILE */}
          <div 
            className="w-full max-w-5xl relative transition-all duration-1000 scale-[0.85] md:scale-100"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ perspective: isHovered ? '2000px' : 'none' }}
          >
            <div className={cn(
                "relative mx-auto bg-[#0a0a0a] rounded-t-[1.5rem] md:rounded-t-[2.5rem] p-2 md:p-4 border-[4px] md:border-[6px] border-[#2a2a2a] shadow-2xl transition-all duration-1000 ease-out",
                isHovered ? "rotate-x-2 translate-y-[-10px]" : "rotate-x-0"
            )}>
              <div className="relative aspect-[16/10] bg-[#010101] rounded-lg md:rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 px-4">
                    <span className={cn(
                        "text-lg md:text-5xl font-black uppercase tracking-[0.5em] md:tracking-[1.5em] text-white/[0.03] transition-all duration-1000 text-center",
                        isHovered && "text-white/[0.2] tracking-[0.6em] md:tracking-[1.2em] drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    )}>
                        Made by DM
                    </span>
                </div>
                <div className="absolute top-0 left-0 right-0 h-[2px] md:h-[4px] bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_40px_rgba(59,130,246,1)] animate-scan z-40" />
              </div>
            </div>
            <div className="relative mx-auto w-[108%] md:w-[114%] -left-[4%] md:-left-[7%] h-3 md:h-6 bg-gradient-to-b from-[#3a3a3a] to-[#0a0a0a] rounded-b-xl md:rounded-b-[2rem] border-t border-white/10 z-10" />
          </div>
        </main>

        {/* FOOTER - STACKS ON MOBILE */}
        <footer className="mt-auto relative border-t border-white/10 bg-[#020203] py-12 md:py-24 overflow-hidden">
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-20 items-start text-center md:text-left">
              
              {/* BRANDING COLUMN */}
              <div className="col-span-1 md:col-span-2 space-y-6 md:space-y-8 flex flex-col items-center md:items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-600 shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">
                    Doc<span className="text-blue-500">AI</span>
                  </span>
                </div>
                <p className="text-white/40 text-sm md:text-xl max-w-md italic font-medium leading-relaxed">
                  The benchmark for organizational intelligence and secure document governance.
                </p>
                <div className="flex gap-4">
                  {[Globe, Database, Fingerprint].map((Icon, idx) => (
                    <div key={idx} className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-blue-500 transition-all">
                      <Icon className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                  ))}
                </div>
              </div>

              {/* NAVIGATION LINKS */}
              <div className="space-y-4 md:space-y-8">
                <h4 className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.5em] text-blue-500/80">Infrastructure</h4>
                <ul className="space-y-3 md:space-y-4">
                  {['Neural Engine', 'Security Gateway', 'Identity Registry'].map((item) => (
                    <li key={item} className="text-[10px] md:text-sm font-bold text-white/40 hover:text-white transition-colors cursor-pointer uppercase tracking-widest">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* ACTION & SIGNATURE */}
              <div className="space-y-6 md:space-y-8 flex flex-col items-center md:items-stretch">
                <Button className="w-full max-w-xs md:max-w-none rounded-xl md:rounded-[2rem] bg-blue-600 font-black uppercase text-[10px] md:text-[12px] tracking-widest h-14 md:h-16">
                  Connect Node
                </Button>
                <div className="pt-6 border-t border-white/5 w-full">
                  <div className="flex items-center justify-center gap-2 text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">
                    <Code2 className="h-3 w-3 text-blue-500/40" /> Built by <span className="text-white/40">DM</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </footer>
      </div>
    </div>
  ); 
}