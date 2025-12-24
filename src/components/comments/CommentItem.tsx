import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Reply,
  Check,
  RotateCcw,
  Pencil,
  Trash2,
  Loader2,
  ChevronRight,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Comment } from '@/hooks/useDocumentComments';
import { CommentInput } from './CommentInput';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface CommentItemProps {
  comment: Comment;
  onReply: (content: string, parentId: string, mentions: string[]) => Promise<void>;
  onUpdate: (commentId: string, content: string) => Promise<boolean>;
  onResolve: (commentId: string, resolved: boolean) => Promise<boolean>;
  onDelete: (commentId: string) => Promise<boolean>;
  isReply?: boolean;
}

export function CommentItem({
  comment,
  onReply,
  onUpdate,
  onResolve,
  onDelete,
  isReply = false
}: CommentItemProps) {
  const { user, isEditor } = useAuth();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = user?.id === comment.user_id;
  const canResolve = isEditor && !isReply;

  const handleReply = async (content: string, mentions: string[]) => {
    await onReply(content, comment.id, mentions);
    setShowReplyInput(false);
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    setIsUpdating(true);
    const success = await onUpdate(comment.id, editContent);
    if (success) setIsEditing(false);
    setIsUpdating(false);
  };

  const getUserDisplayName = () => {
    if (comment.user?.full_name) return comment.user.full_name;
    if (comment.user?.email) return comment.user.email.split('@')[0];
    return 'User';
  };

  const renderContent = (content: string) => {
    const mentionRegex = /@(\w+)/g;
    const parts = content.split(mentionRegex);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <span key={index} className="text-blue-600 dark:text-blue-400 font-bold bg-blue-500/5 px-1 rounded">
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className={cn("relative group transition-all", isReply ? 'ml-10 mt-4' : 'mt-6')}>
      {/* Thread Line Connector */}
      {isReply && (
        <div className="absolute -left-6 top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-800">
           <div className="absolute top-4 left-0 w-4 h-px bg-slate-100 dark:bg-slate-800 rounded-full" />
        </div>
      )}

      <div className={cn(
        "relative p-4 rounded-[1.5rem] transition-all duration-300 border border-transparent",
        comment.is_resolved 
          ? "bg-slate-50/50 dark:bg-slate-900/30 opacity-60 grayscale-[0.5]" 
          : "bg-white dark:bg-slate-900/50 hover:border-slate-100 dark:hover:border-slate-800 hover:shadow-sm"
      )}>
        <div className="flex gap-4">
          {/* Avatar with Status Glow */}
          <div className="relative shrink-0">
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black shadow-sm",
              isReply 
                ? "bg-slate-100 text-slate-500" 
                : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
            )}>
              {getUserDisplayName().slice(0, 2).toUpperCase()}
            </div>
            {!comment.is_resolved && !isReply && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Meta Row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {getUserDisplayName()}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
              </div>
              
              {comment.is_resolved && (
                <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-none font-black text-[9px] uppercase tracking-widest px-2">
                  <Check className="h-2.5 w-2.5 mr-1" /> Resolved
                </Badge>
              )}
            </div>

            {/* Content Area */}
            {isEditing ? (
              <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[80px] bg-transparent border-none focus-visible:ring-0 p-0 text-sm resize-none"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="text-xs font-bold">
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleUpdate} disabled={isUpdating} className="bg-blue-600 text-white rounded-xl text-xs h-8 px-4 font-bold">
                    {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words font-medium">
                {renderContent(comment.content)}
              </p>
            )}

            {/* Hover Action Bar */}
            {!isEditing && (
              <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                {!isReply && !comment.is_resolved && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    onClick={() => setShowReplyInput(!showReplyInput)}
                  >
                    <Reply className="h-3 w-3 mr-1.5" /> Reply
                  </Button>
                )}
                
                {canResolve && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors",
                      comment.is_resolved ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                    )}
                    onClick={() => onResolve(comment.id, !comment.is_resolved)}
                  >
                    {comment.is_resolved ? (
                      <><RotateCcw className="h-3 w-3 mr-1.5" /> Reopen</>
                    ) : (
                      <><Check className="h-3 w-3 mr-1.5" /> Resolve</>
                    )}
                  </Button>
                )}

                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-slate-400">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl p-1 border-slate-100 dark:border-slate-800">
                      <DropdownMenuItem onClick={() => setIsEditing(true)} className="rounded-lg text-xs font-bold gap-2">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(comment.id)}
                        className="rounded-lg text-xs font-bold gap-2 text-rose-500 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reply Input Inset */}
      {showReplyInput && (
        <div className="mt-4 ml-10 p-2 bg-blue-500/5 rounded-[1.5rem] border border-blue-500/10 animate-in slide-in-from-top-2 duration-300">
          <CommentInput
            onSubmit={(content, mentions) => handleReply(content, mentions)}
            placeholder="Type your reply..."
            autoFocus
            showCancel
            onCancel={() => setShowReplyInput(false)}
          />
        </div>
      )}

      {/* Recursive Replies Wrapper */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-1">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onUpdate={onUpdate}
              onResolve={onResolve}
              onDelete={onDelete}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}