import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, Filter, ChevronRight, MessageCircle } from 'lucide-react';
import { useDocumentComments } from '@/hooks/useDocumentComments';
import { CommentInput } from './CommentInput';
import { CommentItem } from './CommentItem';
import { cn } from '@/lib/utils';

interface CommentsSectionProps {
  documentId: string;
}

type FilterType = 'all' | 'open' | 'resolved';

export function CommentsSection({ documentId }: CommentsSectionProps) {
  const {
    comments,
    loading,
    addComment,
    updateComment,
    resolveComment,
    deleteComment
  } = useDocumentComments(documentId);
  
  const [filter, setFilter] = useState<FilterType>('all');

  const handleAddComment = async (content: string, mentions: string[]) => {
    await addComment(content, undefined, mentions);
  };

  const handleReply = async (content: string, parentId: string, mentions: string[]) => {
    await addComment(content, parentId, mentions);
  };

  const filteredComments = comments.filter((comment) => {
    if (filter === 'open') return !comment.is_resolved;
    if (filter === 'resolved') return comment.is_resolved;
    return true;
  });

  const openCount = comments.filter(c => !c.is_resolved).length;
  const resolvedCount = comments.filter(c => c.is_resolved).length;

  return (
    <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-card overflow-hidden">
      <CardHeader className="p-8 pb-4 border-b border-slate-50 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                <MessageSquare className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl font-black tracking-tight">Collaboration</CardTitle>
              {comments.length > 0 && (
                <Badge className="bg-blue-600 text-white rounded-full px-2 text-[10px] font-black h-5">
                  {comments.length}
                </Badge>
              )}
            </div>
            <CardDescription className="font-medium italic">Discuss and iterate with your team</CardDescription>
          </div>
          
          {comments.length > 0 && (
            <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
              {(['all', 'open', 'resolved'] as FilterType[]).map((f) => (
                <Button
                  key={f}
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilter(f)}
                  className={cn(
                    "h-8 px-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg",
                    filter === f 
                      ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {f} {f === 'all' ? `(${comments.length})` : f === 'open' ? `(${openCount})` : `(${resolvedCount})`}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-8 space-y-8">
        {/* New Comment Input Wrapper */}
        <div className="bg-slate-50/50 dark:bg-slate-900/50 p-2 rounded-[1.5rem] border border-slate-100 dark:border-slate-800">
          <CommentInput
            onSubmit={handleAddComment}
            placeholder="Type @ to mention or share a thought..."
          />
        </div>

        {/* Comments List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600/40" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Syncing Discussion...</p>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem]">
            <div className="bg-slate-50 dark:bg-slate-900 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
               <MessageCircle className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">Quiet in here...</h3>
            <p className="text-sm text-slate-500 font-medium max-w-[240px] mx-auto mt-1">
              {filter !== 'all' 
                ? `No ${filter} comments found.`
                : 'Share your first insight or question about this document.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-1 divide-y divide-slate-50 dark:divide-slate-800/50">
            {filteredComments.map((comment) => (
              <div key={comment.id} className="pt-6 first:pt-0 pb-2">
                <CommentItem
                  comment={comment}
                  onReply={handleReply}
                  onUpdate={updateComment}
                  onResolve={resolveComment}
                  onDelete={deleteComment}
                />
              </div>
            ))}
          </div>
        )}

        {/* Footer Meta */}
        <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
           <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
           Live Thread Active
        </div>
      </CardContent>
    </Card>
  );
}