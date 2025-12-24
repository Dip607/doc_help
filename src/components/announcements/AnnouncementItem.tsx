import { useState } from 'react';
import { format } from 'date-fns';
import { MessageCircle, Trash2, Send, ChevronDown, ChevronUp, User, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAnnouncementReplies, Announcement } from '@/hooks/useAnnouncements';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface AnnouncementItemProps {
  announcement: Announcement;
  onDelete?: (id: string) => void;
  isAdmin: boolean;
}

export function AnnouncementItem({ announcement, onDelete, isAdmin }: AnnouncementItemProps) {
  const { user } = useAuth();
  const { replies, addReply, deleteReply } = useAnnouncementReplies(announcement.id);
  const [showReplies, setShowReplies] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    await addReply(replyContent.trim());
    setReplyContent('');
    setIsSubmitting(false);
  };

  const authorName = announcement.author?.full_name || announcement.author?.email || 'Unknown';

  return (
    <div className="group relative border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 bg-white dark:bg-slate-900/50 backdrop-blur-md shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
      {/* Header Profile Section */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h4 className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white">
                {announcement.title}
              </h4>
              <Badge variant="outline" className="text-[8px] font-black uppercase border-blue-200 text-blue-600 px-1.5 h-4">
                Official
              </Badge>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {authorName} <span className="mx-1 text-slate-200">•</span> {format(new Date(announcement.created_at), 'MMM d, h:mm a')}
            </p>
          </div>
        </div>
        
        {isAdmin && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
            onClick={() => onDelete(announcement.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Main Broadcast Content */}
      <div className="pl-1 w-full">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {announcement.content}
        </p>
      </div>

      {/* Interaction Bar */}
      <div className="mt-6 flex items-center justify-between border-t border-slate-50 dark:border-slate-800/50 pt-4">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-xl h-9 px-4 font-black uppercase text-[10px] tracking-widest transition-all",
            showReplies ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
          )}
          onClick={() => setShowReplies(!showReplies)}
        >
          <MessageCircle className={cn("h-3.5 w-3.5 mr-2", !showReplies && "text-blue-500")} />
          {replies.length} {replies.length === 1 ? 'Response' : 'Responses'}
          {showReplies ? <ChevronUp className="h-3 w-3 ml-2" /> : <ChevronDown className="h-3 w-3 ml-2" />}
        </Button>

        <div className="flex items-center gap-2">
            <ShieldCheck className="h-3 w-3 text-slate-200" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-200">Authenticated Thread</span>
        </div>
      </div>

      {/* Threaded Replies Section */}
      {showReplies && (
        <div className="mt-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
          <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
            {replies.map((reply) => {
              const replyAuthor = reply.author?.full_name || reply.author?.email || 'Unknown';
              const isOwn = reply.user_id === user?.id;

              return (
                <div key={reply.id} className="group/reply flex items-start gap-3 relative pl-4">
                  {/* Thread Visual Connector */}
                  <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-800" />
                  
                  <div className="flex-1 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-50 dark:border-slate-800/50">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span className={cn(isOwn && 'text-blue-600')}>{replyAuthor}</span>
                        {' • '}
                        {format(new Date(reply.created_at), 'MMM d, h:mm a')}
                      </p>
                      {isOwn && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full opacity-0 group-hover/reply:opacity-100 hover:text-rose-500 transition-all"
                          onClick={() => deleteReply(reply.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{reply.content}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply Interface */}
          <div className="flex gap-2 pt-2 relative">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="System response..."
              className="min-h-[80px] rounded-2xl border-none ring-1 ring-slate-100 dark:ring-slate-800 bg-white dark:bg-slate-900 font-medium text-sm p-4 resize-none"
            />
            <Button
              size="icon"
              className="absolute bottom-3 right-3 h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
              onClick={handleSubmitReply}
              disabled={!replyContent.trim() || isSubmitting}
            >
              <Send className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}