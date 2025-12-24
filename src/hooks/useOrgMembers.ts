import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface OrgMember {
  id: string;
  full_name: string | null;
  email: string;
}

export function useOrgMembers() {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { organization, isAdmin } = useAuth();

  useEffect(() => {
    const fetchMembers = async () => {
      if (!organization) return;

      try {
        // Only admins can view all org members, others just see themselves
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('organization_id', organization.id)
          .eq('status', 'approved');

        if (error) throw error;
        setMembers(data || []);
      } catch (error) {
        console.error('Error fetching org members:', error);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [organization, isAdmin]);

  return { members, loading };
}
