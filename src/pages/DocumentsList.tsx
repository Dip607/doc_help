import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Trash2, 
  ArrowLeft,
  Loader2,
  Calendar,
  Hash,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  MoreVertical,
  ExternalLink,
  ChevronRight,
  Database,
  FileSearch
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Document {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  storage_path: string;
}

interface Analysis {
  id: string;
  summary: string;
  keywords: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  sentiment_score: number;
  word_count: number;
  reading_time_minutes: number;
  key_topics: string[];
  version: number;
  analyzed_at: string;
}

export default function DocumentsList() {
  const { organization, isEditor } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<(Document & { analyses?: Analysis[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (organization) fetchDocuments();
  }, [organization]);

  const fetchDocuments = async () => {
    try {
      const { data: docs, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const docsWithAnalyses = await Promise.all(
        (docs || []).map(async (doc) => {
          const { data: analyses } = await supabase
            .from('document_analyses')
            .select('*')
            .eq('document_id', doc.id)
            .order('version', { ascending: false });
          return { ...doc, analyses: analyses || [] };
        })
      );

      setDocuments(docsWithAnalyses);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load documents', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId: string, storagePath: string) => {
    if (!confirm('Are you sure? This will permanently delete the document.')) return;

    try {
      await supabase.storage.from('documents').remove([storagePath]);
      const { error } = await supabase.from('documents').delete().eq('id', docId);
      if (error) throw error;
      setDocuments(prev => prev.filter(d => d.id !== docId));
      toast({ title: 'Success', description: 'Document removed.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete.', variant: 'destructive' });
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSentimentStyles = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return { icon: <TrendingUp className="h-3 w-3" />, class: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400' };
      case 'negative': return { icon: <TrendingDown className="h-3 w-3" />, class: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/20 dark:text-rose-400' };
      default: return { icon: <Minus className="h-3 w-3" />, class: 'bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-800 dark:text-slate-400' };
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Syncing library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <Sidebar />
      
      <main className="flex-1 p-4 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => navigate('/dashboard')}
                className="rounded-xl border-muted-foreground/10 bg-white dark:bg-card shadow-sm hover:scale-105 transition-transform"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Documents</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="rounded-md font-bold px-1.5 h-5 bg-primary/10 text-primary border-none">
                    {documents.length}
                  </Badge>
                  <p className="text-muted-foreground text-sm font-medium">Files in your organization</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative group flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search file names..." 
                  className="pl-10 pr-4 py-2.5 bg-white dark:bg-card border-none rounded-2xl text-sm w-full md:w-[280px] shadow-sm ring-1 ring-muted-foreground/10 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {isEditor && (
                <Button onClick={() => navigate('/documents/upload')} className="rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 px-6 font-bold">
                  Upload
                </Button>
              )}
            </div>
          </div>

          {/* Library Overview Stats */}
          {documents.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              {[
                { label: 'Total Files', value: documents.length, icon: FileText },
                { label: 'Avg Reading Time', value: `${(documents.reduce((acc, doc) => acc + (doc.analyses?.[0]?.reading_time_minutes || 0), 0) / (documents.length || 1)).toFixed(1)}m`, icon: Clock },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-card p-4 rounded-2xl shadow-sm border border-muted-foreground/5 flex items-center gap-4">
                  <div className="p-2.5 bg-primary/5 rounded-xl">
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                    <p className="text-lg font-black">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white/50 dark:bg-card/50 rounded-[3rem] border-2 border-dashed border-muted-foreground/10 animate-in fade-in zoom-in duration-700">
              <div className="bg-white dark:bg-card p-8 rounded-[2rem] shadow-xl mb-6">
                {searchQuery ? <FileSearch className="h-12 w-12 text-primary/40" /> : <Database className="h-12 w-12 text-primary/40" />}
              </div>
              <h3 className="text-2xl font-bold">
                {searchQuery ? 'No matches found' : 'Your library is empty'}
              </h3>
              <p className="text-muted-foreground mb-8 max-w-xs text-center">
                {searchQuery 
                  ? `We couldn't find anything matching "${searchQuery}"` 
                  : 'Start by uploading your first document for AI analysis.'}
              </p>
              {isEditor && !searchQuery && (
                <Button onClick={() => navigate('/documents/upload')} variant="outline" className="rounded-2xl px-8 py-6 h-auto font-bold border-2 hover:bg-primary hover:text-white transition-all">
                  Get Started
                </Button>
              )}
              {searchQuery && (
                <Button onClick={() => setSearchQuery('')} variant="ghost" className="text-primary font-bold">
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 animate-in fade-in slide-in-from-bottom-6 duration-700">
              {filteredDocs.map((doc) => {
                const latest = doc.analyses?.[0];
                const styles = getSentimentStyles(latest?.sentiment || 'neutral');
                
                return (
                  <Card 
                    key={doc.id} 
                    className="group relative border-none bg-white dark:bg-card rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden cursor-pointer ring-1 ring-muted-foreground/5"
                    onClick={() => navigate(`/documents/${doc.id}`)}
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row items-stretch">
                        {/* File Preview Icon Block */}
                        <div className="flex items-center justify-center p-8 md:w-32 bg-slate-50 dark:bg-slate-900/50 group-hover:bg-primary/5 transition-colors duration-500">
                          <div className="relative">
                             <FileText className="h-10 w-10 text-slate-400 group-hover:text-primary transition-all duration-500 group-hover:scale-110" />
                             {latest && <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-card animate-pulse" />}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 p-7">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="space-y-2">
                              <h3 className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-1 leading-tight">
                                {doc.name}
                              </h3>
                              <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                <span className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-md">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {new Date(doc.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                {latest && (
                                  <>
                                    <span className="flex items-center gap-2">
                                      <Hash className="h-3.5 w-3.5 text-primary/40" />
                                      {latest.word_count.toLocaleString()} Words
                                    </span>
                                    <span className="flex items-center gap-2">
                                      <Clock className="h-3.5 w-3.5 text-primary/40" />
                                      {latest.reading_time_minutes}m Read
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-end md:self-start">
                              {latest && (
                                <Badge variant="outline" className={`rounded-full px-4 py-1.5 gap-2 border-none ring-1 ring-inset shadow-sm ${styles.class}`}>
                                  {styles.icon}
                                  <span className="capitalize font-bold">{latest.sentiment}</span>
                                </Badge>
                              )}
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted h-10 w-10">
                                    <MoreVertical className="h-5 w-5 text-muted-foreground" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl shadow-2xl border-muted-foreground/10">
                                  <DropdownMenuItem className="rounded-xl py-3 cursor-pointer" onClick={() => navigate(`/documents/${doc.id}`)}>
                                    <ExternalLink className="mr-3 h-4 w-4" /> Open Analysis
                                  </DropdownMenuItem>
                                  {isEditor && (
                                    <DropdownMenuItem 
                                      className="rounded-xl py-3 text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(doc.id, doc.storage_path);
                                      }}
                                    >
                                      <Trash2 className="mr-3 h-4 w-4" /> Delete Permanently
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          
                          {/* Summary Preview with subtle quote style */}
                          {latest?.summary && (
                            <div className="mt-5 relative">
                              <p className="text-[13px] leading-relaxed text-muted-foreground/80 line-clamp-1 group-hover:line-clamp-2 transition-all duration-500 italic border-l-2 border-primary/20 pl-4">
                                {latest.summary}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Hidden Desktop Arrow */}
                        <div className="hidden md:flex items-center pr-8 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-500">
                          <ChevronRight className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}