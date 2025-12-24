import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  created_by: string;
  organization_id: string;
  author?: {
    full_name: string | null;
    email: string;
  };
}

export interface AnnouncementReply {
  id: string;
  announcement_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: {
    full_name: string | null;
    email: string;
  };
}

export function useAnnouncements() {
  const { user, organization, isAdmin } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    if (!organization?.id) return;

    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          author:profiles!announcements_created_by_fkey(full_name, email)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error: any) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAnnouncement = async (title: string, content: string) => {
    if (!user?.id || !organization?.id || !isAdmin) return;

    try {
      const { error } = await supabase.from('announcements').insert({
        title,
        content,
        organization_id: organization.id,
        created_by: user.id,
      });

      if (error) throw error;
      toast({ title: 'Announcement posted' });
    } catch (error: any) {
      toast({ title: 'Error posting announcement', description: error.message, variant: 'destructive' });
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Announcement deleted' });
    } catch (error: any) {
      toast({ title: 'Error deleting announcement', description: error.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [organization?.id]);

  // Realtime subscription
  useEffect(() => {
    if (!organization?.id) return;

    const channel = supabase
      .channel('announcements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
          filter: `organization_id=eq.${organization.id}`,
        },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization?.id]);

  return {
    announcements,
    loading,
    addAnnouncement,
    deleteAnnouncement,
    isAdmin,
  };
}

export function useAnnouncementReplies(announcementId: string) {
  const { user, organization } = useAuth();
  const { toast } = useToast();
  const [replies, setReplies] = useState<AnnouncementReply[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReplies = async () => {
    if (!announcementId) return;

    try {
      const { data, error } = await supabase
        .from('announcement_replies')
        .select(`
          *,
          author:profiles!announcement_replies_user_id_fkey(full_name, email)
        `)
        .eq('announcement_id', announcementId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setReplies(data || []);
    } catch (error: any) {
      console.error('Error fetching replies:', error);
    } finally {
      setLoading(false);
    }
  };

  const addReply = async (content: string) => {
    if (!user?.id || !organization?.id) return;

    try {
      const { error } = await supabase.from('announcement_replies').insert({
        announcement_id: announcementId,
        content,
        user_id: user.id,
        organization_id: organization.id,
      });

      if (error) throw error;
      toast({ title: 'Reply posted' });
    } catch (error: any) {
      toast({ title: 'Error posting reply', description: error.message, variant: 'destructive' });
    }
  };

  const deleteReply = async (id: string) => {
    try {
      const { error } = await supabase.from('announcement_replies').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Reply deleted' });
    } catch (error: any) {
      toast({ title: 'Error deleting reply', description: error.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchReplies();
  }, [announcementId]);

  // Realtime subscription
  useEffect(() => {
    if (!announcementId) return;

    const channel = supabase
      .channel(`replies-${announcementId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcement_replies',
          filter: `announcement_id=eq.${announcementId}`,
        },
        () => {
          fetchReplies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [announcementId]);

  return {
    replies,
    loading,
    addReply,
    deleteReply,
  };
}
