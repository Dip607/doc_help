import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Comment {
  id: string;
  document_id: string;
  user_id: string;
  organization_id: string;
  content: string;
  parent_id: string | null;
  is_resolved: boolean;
  mentions: string[];
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string | null;
    email: string;
  };
  replies?: Comment[];
}

export function useDocumentComments(documentId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, organization } = useAuth();
  const { toast } = useToast();

  const fetchComments = useCallback(async () => {
    if (!documentId || !organization) return;
    
    try {
      const { data, error } = await supabase
        .from('document_comments')
        .select(`
          *,
          user:profiles!document_comments_user_id_fkey(id, full_name, email)
        `)
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Organize into parent comments and replies
      const parentComments: Comment[] = [];
      const repliesMap: Record<string, Comment[]> = {};

      (data || []).forEach((comment: Comment) => {
        if (comment.parent_id) {
          if (!repliesMap[comment.parent_id]) {
            repliesMap[comment.parent_id] = [];
          }
          repliesMap[comment.parent_id].push(comment);
        } else {
          parentComments.push(comment);
        }
      });

      // Attach replies to parent comments
      const commentsWithReplies = parentComments.map(comment => ({
        ...comment,
        replies: repliesMap[comment.id] || []
      }));

      setComments(commentsWithReplies);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [documentId, organization]);

  const addComment = async (content: string, parentId?: string, mentions: string[] = []) => {
    if (!user || !organization) return null;

    try {
      const { data, error } = await supabase
        .from('document_comments')
        .insert({
          document_id: documentId,
          user_id: user.id,
          organization_id: organization.id,
          content,
          parent_id: parentId || null,
          mentions
        })
        .select(`
          *,
          user:profiles!document_comments_user_id_fkey(id, full_name, email)
        `)
        .single();

      if (error) throw error;

      toast({ title: 'Comment added' });
      return data as Comment;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive'
      });
      return null;
    }
  };

  const updateComment = async (commentId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('document_comments')
        .update({ content })
        .eq('id', commentId);

      if (error) throw error;
      toast({ title: 'Comment updated' });
      return true;
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update comment',
        variant: 'destructive'
      });
      return false;
    }
  };

  const resolveComment = async (commentId: string, resolved: boolean) => {
    try {
      const { error } = await supabase
        .from('document_comments')
        .update({ is_resolved: resolved })
        .eq('id', commentId);

      if (error) throw error;
      toast({ title: resolved ? 'Comment resolved' : 'Comment reopened' });
      return true;
    } catch (error) {
      console.error('Error resolving comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update comment status',
        variant: 'destructive'
      });
      return false;
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('document_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      toast({ title: 'Comment deleted' });
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive'
      });
      return false;
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    fetchComments();

    const channel = supabase
      .channel(`document_comments_${documentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_comments',
          filter: `document_id=eq.${documentId}`
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [documentId, fetchComments]);

  return {
    comments,
    loading,
    addComment,
    updateComment,
    resolveComment,
    deleteComment,
    refetch: fetchComments
  };
}
