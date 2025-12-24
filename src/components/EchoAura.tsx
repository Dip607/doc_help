// components/EchoAura.tsx
import { cn } from "@/lib/utils";

interface EchoAuraProps {
  role: 'admin' | 'editor' | 'viewer';
  isInteracting?: boolean; // When they click/type
  userName: string;
}

export const EchoAura = ({ role, isInteracting, userName }: EchoAuraProps) => {
  const roleColors = {
    admin: "stroke-blue-500 shadow-blue-500/50",
    editor: "stroke-indigo-400 shadow-indigo-400/50",
    viewer: "stroke-slate-400 shadow-slate-400/50",
  };

  return (
    <div className="relative group flex items-center justify-center">
      {/* Tooltip on Hover */}
      <span className="absolute -bottom-8 scale-0 group-hover:scale-100 transition-all text-[8px] font-black uppercase bg-slate-900 text-white px-2 py-1 rounded tracking-tighter whitespace-nowrap z-50">
        {userName} ({role})
      </span>

      <svg width="40" height="40" className="overflow-visible">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Pulsing Outer Ring */}
        <circle
          cx="20"
          cy="20"
          r={isInteracting ? "18" : "14"}
          fill="none"
          strokeWidth="2"
          className={cn(
            "transition-all duration-500 ease-out animate-pulse",
            roleColors[role]
          )}
          style={{ filter: "url(#glow)" }}
        />
        
        {/* Inner Core */}
        <circle
          cx="20"
          cy="20"
          r="8"
          className={cn("fill-current", roleColors[role].split(' ')[0].replace('stroke', 'fill'))}
        />
      </svg>
    </div>
  );
};