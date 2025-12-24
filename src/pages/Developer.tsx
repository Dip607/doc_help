import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Github, 
  Linkedin, 
  Mail, 
  Code2, 
  Terminal,
  Sparkles,
  Lock,
  Clock
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function Developer() {
  const navigate = useNavigate();

  const developers = [
    {
      name: "Dipan",
      role: "Full Stack Developer",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Dipan&backgroundColor=b6e3f4",
      skills: ["React", "Node.js", "Supabase"],
    },
    {
      name: "Anshika",
      role: "Full Stack Developer",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Anshika&backgroundColor=ffdfbf",
      skills: ["Next.js", "TypeScript", "PostgreSQL"],
    },
    {
      name: "Mayank",
      role: "Full Stack Developer",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Mayank&backgroundColor=c0aede",
      skills: ["Express", "MongoDB", "Tailwind"],
    },
    {
      name: "M",
      role: "Full Stack Developer",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Mehak&backgroundColor=d1d4f9",
      skills: ["Vue", "Firebase", "Python"],
    }
  ];

  return (
    <div className="flex min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <Sidebar />
      
      {/* MAIN WRAPPER 
        The 'relative' class allows us to place the "Coming Soon" overlay on top.
      */}
      <main className="flex-1 p-4 lg:p-10 relative overflow-hidden">
        
        {/* --- COMING SOON OVERLAY LAYER --- */}
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/10 dark:bg-black/10 backdrop-blur-[2px] cursor-not-allowed">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 animate-in fade-in zoom-in-95 duration-500 max-w-md mx-4">
                <div className="h-16 w-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Clock className="h-8 w-8 text-blue-600 animate-pulse" />
                </div>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
                    Coming <span className="text-blue-600">Soon</span>
                </h2>
                <p className="text-slate-500 font-medium leading-relaxed">
                    The engineering directory is currently being synchronized with our core directory. Profiles will be available shortly.
                </p>
                <div className="pt-4">
                    <Button 
                        onClick={() => navigate(-1)} 
                        variant="outline" 
                        className="rounded-2xl h-12 px-8 font-bold border-slate-200 hover:bg-slate-50"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Return to Safety
                    </Button>
                </div>
            </div>
        </div>

        {/* --- FROZEN BACKGROUND CONTENT --- */}
        <div className="max-w-6xl mx-auto space-y-12 relative z-10 pointer-events-none select-none opacity-40 grayscale-[0.4]">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-8">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="rounded-xl border-slate-200 bg-white shadow-sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                  Our <span className="text-blue-600">Developers</span>
                </h1>
                <p className="text-slate-500 text-sm font-medium">The engineering force behind DocAI</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-100 bg-blue-50/50">
               <Sparkles className="h-3.5 w-3.5 text-blue-600" />
               <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">System Nodes Locked</span>
            </div>
          </div>

          {/* Developers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {developers.map((dev, index) => (
              <Card key={index} className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-card overflow-hidden">
                <div className="h-24 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                   <Code2 className="h-8 w-8 text-slate-200 dark:text-slate-800" />
                </div>
                
                <CardContent className="pt-0 px-6 pb-10 text-center relative">
                  <div className="relative -mt-12 mb-6 inline-block">
                    <div className="h-28 w-28 rounded-[2.2rem] bg-white dark:bg-slate-900 p-2 shadow-xl border border-slate-50 dark:border-slate-800">
                      <img src={dev.avatar} className="h-full w-full rounded-[1.8rem] object-cover" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">{dev.name}</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">{dev.role}</p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 mt-6">
                    {dev.skills.map((skill, sIndex) => (
                      <Badge key={sIndex} variant="secondary" className="text-[9px] px-3 py-1 font-bold uppercase tracking-tighter">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex justify-center gap-4 mt-8 pt-6 border-t border-slate-50">
                     <Lock className="h-5 w-5 text-slate-300" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Simple Footer */}
          <div className="pt-20 flex flex-col items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">
            <div className="flex items-center gap-3">
               <Terminal className="h-4 w-4" /> 
               <span>DocAI Development Unit</span>
               <Terminal className="h-4 w-4" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}