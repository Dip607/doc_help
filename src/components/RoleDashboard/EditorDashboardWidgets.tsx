import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Loader2,
  Plus,
  TrendingUp
} from 'lucide-react';

interface EditorStats {
  myUploads: number;
  totalDocuments: number;
  recentUploads: { id: string; name: string; created_at: string }[];
}

export default function EditorDashboardWidgets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<EditorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEditorStats();
    }
  }, [user]);

  const fetchEditorStats = async () => {
    try {
      // Fetch my uploads
      const { data: myDocs } = await supabase
        .from('documents')
        .select('id')
        .eq('uploaded_by', user?.id);

      // Fetch total documents
      const { data: allDocs } = await supabase
        .from('documents')
        .select('id');

      // Fetch recent uploads by me
      const { data: recentUploads } = await supabase
        .from('documents')
        .select('id, name, created_at')
        .eq('uploaded_by', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);

      setStats({
        myUploads: myDocs?.length || 0,
        totalDocuments: allDocs?.length || 0,
        recentUploads: recentUploads || [],
      });
    } catch (error) {
      console.error('Error fetching editor stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <Card className="border-accent/20 bg-accent/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="h-5 w-5 text-accent" />
              Your Uploads
            </CardTitle>
            <CardDescription>Quick access to upload and manage documents</CardDescription>
          </div>
          <Button onClick={() => navigate('/documents/upload')} variant="gradient" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Upload
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-foreground">My Uploads</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.myUploads}</p>
          </div>
          
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-foreground">Team Total</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalDocuments}</p>
          </div>
        </div>

        {stats.recentUploads.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Recent uploads</p>
            {stats.recentUploads.map((doc) => (
              <div 
                key={doc.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/documents/${doc.id}`)}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{doc.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(doc.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}