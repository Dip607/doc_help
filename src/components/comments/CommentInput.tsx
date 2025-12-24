import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, AtSign, Loader2, Command, Sparkles, X } from 'lucide-react';
import { useOrgMembers, OrgMember } from '@/hooks/useOrgMembers';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface CommentInputProps {
  onSubmit: (content: string, mentions: string[]) => Promise<void>;
  placeholder?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
  showCancel?: boolean;
}

export function CommentInput({
  onSubmit,
  placeholder = 'Add a comment...',
  autoFocus = false,
  onCancel,
  showCancel = false
}: CommentInputProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [selectedMentions, setSelectedMentions] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { members, loading: membersLoading } = useOrgMembers();

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setSubmitting(true);
    try {
      await onSubmit(content, selectedMentions);
      setContent('');
      setSelectedMentions([]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
    if (e.key === '@') {
      setShowMentions(true);
    }
  };

  const insertMention = (member: OrgMember) => {
    const name = member.full_name || member.email.split('@')[0];
    const mentionText = `@${name} `;
    setContent(prev => prev + mentionText);
    setSelectedMentions(prev => [...new Set([...prev, member.id])]);
    setShowMentions(false);
    setMentionSearch('');
    textareaRef.current?.focus();
  };

  const filteredMembers = members.filter(member => {
    const searchTerm = mentionSearch.toLowerCase();
    return (
      member.full_name?.toLowerCase().includes(searchTerm) ||
      member.email.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div className="group space-y-3 transition-all">
      <div className="relative overflow-hidden rounded-[1.5rem] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[100px] w-full border-none bg-transparent p-4 pr-12 resize-none text-sm placeholder:text-slate-400 focus-visible:ring-0 leading-relaxed font-medium"
          disabled={submitting}
        />
        
        {/* Absolute Mention Trigger */}
        <div className="absolute right-3 top-3">
          <Popover open={showMentions} onOpenChange={setShowMentions}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-xl transition-colors",
                  showMentions ? "bg-blue-500 text-white" : "text-slate-400 hover:text-blue-500 hover:bg-blue-500/10"
                )}
              >
                <AtSign className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0 border-none bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden" align="end" sideOffset={8}>
              <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                <div className="relative">
                   <input
                    type="text"
                    placeholder="Search members..."
                    value={mentionSearch}
                    onChange={(e) => setMentionSearch(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-950 rounded-xl border-none ring-1 ring-slate-100 dark:ring-slate-800 focus:ring-blue-500/50 outline-none"
                    autoFocus
                  />
                  {mentionSearch && (
                    <button onClick={() => setMentionSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                      <X className="h-3 w-3 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto no-scrollbar p-1">
                {membersLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500/40" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Directory</span>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No matches found</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {filteredMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => insertMention(member)}
                        className="w-full group/item flex items-center gap-3 px-3 py-2 text-left hover:bg-blue-500 transition-all rounded-xl"
                      >
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-[10px] font-black text-blue-600 group-hover/item:bg-white/20 group-hover/item:text-white transition-colors">
                          {(member.full_name || member.email).slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-900 dark:text-white group-hover/item:text-white truncate">
                            {member.full_name || 'Anonymous Member'}
                          </div>
                          <div className="text-[10px] font-medium text-slate-400 group-hover/item:text-blue-100 truncate uppercase tracking-tighter">
                            {member.email}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* Footer Controls */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
             <Command className="h-2.5 w-2.5" />
             <span>Enter</span>
          </div>
          <span>to submit</span>
        </div>
        
        <div className="flex gap-2">
          {showCancel && onCancel && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onCancel} 
              disabled={submitting}
              className="rounded-xl h-9 text-xs font-bold text-slate-400 hover:text-rose-500"
            >
              Discard
            </Button>
          )}
          <Button 
            size="sm" 
            onClick={handleSubmit} 
            disabled={submitting || !content.trim()}
            className="rounded-xl h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-3.5 w-3.5 mr-2" />
            )}
            {showCancel ? 'Post Reply' : 'Send Message'}
          </Button>
        </div>
      </div>
    </div>
  );
}