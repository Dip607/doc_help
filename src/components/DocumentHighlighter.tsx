import { useMemo } from 'react';
import { Sparkles, Hash, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentHighlighterProps {
  content: string;
  keywords: string[];
  keyTopics: string[];
}

export default function DocumentHighlighter({ content, keywords, keyTopics }: DocumentHighlighterProps) {
  const highlightedContent = useMemo(() => {
    if (!content) return null;

    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const keywordPatterns = keywords.map(k => escapeRegex(k.toLowerCase()));
    const topicPatterns = keyTopics.map(t => escapeRegex(t.toLowerCase()));

    const paragraphs = content.split('\n\n');

    return paragraphs.map((paragraph, pIndex) => {
      if (!paragraph.trim()) return null;

      const parts: { text: string; type: 'keyword' | 'topic' | 'normal' }[] = [];
      let remaining = paragraph;

      while (remaining.length > 0) {
        let found = false;

        for (const pattern of keywordPatterns) {
          const regex = new RegExp(`^(\\s*)(${pattern})(\\s*)`, 'i');
          const match = remaining.match(regex);
          if (match) {
            if (match[1]) parts.push({ text: match[1], type: 'normal' });
            parts.push({ text: match[2], type: 'keyword' });
            if (match[3]) parts.push({ text: match[3], type: 'normal' });
            remaining = remaining.slice(match[0].length);
            found = true;
            break;
          }
        }

        if (!found) {
          for (const pattern of topicPatterns) {
            const regex = new RegExp(`^(\\s*)(${pattern})(\\s*)`, 'i');
            const match = remaining.match(regex);
            if (match) {
              if (match[1]) parts.push({ text: match[1], type: 'normal' });
              parts.push({ text: match[2], type: 'topic' });
              if (match[3]) parts.push({ text: match[3], type: 'normal' });
              remaining = remaining.slice(match[0].length);
              found = true;
              break;
            }
          }
        }

        if (!found) {
          const nextSpace = remaining.search(/\s/);
          const wordEnd = nextSpace === -1 ? remaining.length : nextSpace + 1;
          parts.push({ text: remaining.slice(0, wordEnd), type: 'normal' });
          remaining = remaining.slice(wordEnd);
        }
      }

      return (
        <p key={pIndex} className="mb-6 leading-[1.8] text-slate-600 dark:text-slate-400 text-base font-medium">
          {parts.map((part, i) => {
            if (part.type === 'keyword') {
              return (
                <span 
                  key={i} 
                  className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1 rounded-sm border-b-2 border-indigo-500/30 font-bold transition-colors hover:bg-indigo-500/20 cursor-help"
                  title="Priority Keyword"
                >
                  {part.text}
                </span>
              );
            }
            if (part.type === 'topic') {
              return (
                <span 
                  key={i} 
                  className="bg-violet-500/10 text-violet-600 dark:text-violet-400 px-1 rounded-sm border-b-2 border-violet-500/30 font-bold transition-colors hover:bg-violet-500/20 cursor-help"
                  title="Key Topic"
                >
                  {part.text}
                </span>
              );
            }
            return <span key={i}>{part.text}</span>;
          })}
        </p>
      );
    });
  }, [content, keywords, keyTopics]);

  if (!content) {
    return (
      <div className="text-center py-16 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
        <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-4" />
        <p className="font-bold text-slate-900 dark:text-white">Preview unavailable</p>
        <p className="text-sm text-slate-500 mt-1 max-w-[240px] mx-auto">This file type is not supported for in-browser semantic highlighting.</p>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Interactive Legend */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/5 border border-indigo-500/10">
          <Hash className="h-3.5 w-3.5 text-indigo-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600/80">Keywords</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/5 border border-violet-500/10">
          <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-violet-600/80">Key Topics</span>
        </div>
      </div>

      {/* Reader Viewport */}
      <div className="relative max-h-[500px] overflow-y-auto no-scrollbar pr-4 -mr-4">
        {/* Paper texture overlay for premium feel */}
        <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
        
        <div className="prose prose-slate dark:prose-invert max-w-none">
          {highlightedContent}
        </div>

        {/* Fade Out Mask */}
        <div className="sticky bottom-0 h-20 w-full bg-gradient-to-t from-white dark:from-[#0a0a0a] to-transparent pointer-events-none" />
      </div>
    </div>
  );
}