import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { BarChart3, Info } from 'lucide-react';

interface WordUsageChartProps {
  content: string;
  keywords: string[];
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'same', 'so',
  'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having',
  'do', 'does', 'did', 'doing', 'would', 'could', 'might', 'must', 'shall', 'if',
  'this', 'that', 'these', 'those', 'am', 'your', 'it', 'its', 'as', 'we', 'he',
  'she', 'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'i', 'you', 'my',
  'me', 'him', 'her', 'our', 'us', 'also', 'any', 'may', 'many', 'well', 'much'
]);

export default function WordUsageChart({ content, keywords }: WordUsageChartProps) {
  const wordData = useMemo(() => {
    if (!content) return [];

    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !STOP_WORDS.has(word));

    const wordCounts: Record<string, number> = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    const sorted = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12) // Slightly fewer for better mobile/spacing
      .map(([word, count]) => ({
        word,
        count,
        isKeyword: keywords.some(k => k.toLowerCase() === word),
      }));

    return sorted;
  }, [content, keywords]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Frequency</p>
          <div className="flex items-center gap-2">
             <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">"{payload[0].payload.word}"</span>
             <span className="text-sm font-black text-blue-600 dark:text-blue-400">{payload[0].value}x</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (wordData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
        <BarChart3 className="h-10 w-10 text-slate-300 mb-4" />
        <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Insufficient Data for Charting</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={wordData} layout="vertical" margin={{ left: 20, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#88888820" />
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="word" 
              axisLine={false}
              tickLine={false}
              width={90}
              tick={{ fontSize: 12, fontWeight: 600, fill: 'currentColor' }}
              className="text-slate-500 dark:text-slate-400 capitalize"
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              content={<CustomTooltip />}
            />
            <Bar 
                dataKey="count" 
                radius={[0, 8, 8, 0]} 
                barSize={20}
            >
              {wordData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.isKeyword ? 'url(#blueGradient)' : 'currentColor'} 
                  className={entry.isKeyword ? '' : 'text-slate-200 dark:text-slate-800'}
                />
              ))}
            </Bar>
            {/* Gradient definition for the bars */}
            <defs>
              <linearGradient id="blueGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Refined Legend Section */}
      <div className="flex flex-wrap gap-6 justify-center pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Core Keywords</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-800" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Frequent Terms</span>
        </div>
        <div className="ml-auto hidden md:flex items-center gap-1 text-[10px] text-slate-400 italic">
            <Info className="h-3 w-3" />
            Top 12 non-stopword occurrences
        </div>
      </div>
    </div>
  );
}