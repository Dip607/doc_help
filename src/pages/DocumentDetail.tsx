import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Download, 
  Trash2, 
  Loader2, 
  FileText,
  Calendar,
  Hash,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  BarChart3,
  ExternalLink,
  Languages
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useToast } from '@/hooks/use-toast';
import WordUsageChart from '@/components/WordUsageChart';
import DocumentHighlighter from '@/components/DocumentHighlighter';
import { CommentsSection } from '@/components/comments/CommentsSection';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isEditor, organization } = useAuth();
  const [document, setDocument] = useState<Document | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id && organization) {
      fetchDocument();
    }
  }, [id, organization]);

  const fetchDocument = async () => {
    try {
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

      if (docError) throw docError;
      setDocument(doc);

      const { data: analysisData } = await supabase
        .from('document_analyses')
        .select('*')
        .eq('document_id', id)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (analysisData) {
        setAnalysis(analysisData as Analysis);
      }

      if (doc.file_type === 'text/plain' || doc.file_type === 'text/markdown') {
        const { data: fileData, error: fileError } = await supabase.storage
          .from('documents')
          .download(doc.storage_path);
        
        if (!fileError && fileData) {
          const text = await fileData.text();
          setDocumentContent(text);
        }
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load document', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!document) return;
    setDownloading(true);
    try {
      const { data, error } = await supabase.storage.from('documents').download(document.storage_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'Download started' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to download document', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!document) return;
    setDeleting(true);
    try {
      await supabase.storage.from('documents').remove([document.storage_path]);
      const { error } = await supabase.from('documents').delete().eq('id', document.id);
      if (error) throw error;
      toast({ title: 'Document deleted' });
      navigate('/documents/list');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete document', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const getSentimentStyles = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return { icon: <TrendingUp className="h-4 w-4" />, color: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400' };
      case 'negative': return { icon: <TrendingDown className="h-4 w-4" />, color: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/20 dark:text-rose-400' };
      default: return { icon: <Minus className="h-4 w-4" />, color: 'bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-800 dark:text-slate-400' };
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
          <p className="text-sm font-bold text-muted-foreground tracking-widest uppercase">Initializing Reader</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-10">
          <div className="max-w-4xl mx-auto text-center py-24 bg-white dark:bg-card rounded-[3rem] shadow-xl border border-muted-foreground/5">
            <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-black mb-2">Resource Missing</h2>
            <p className="text-muted-foreground mb-8">This document does not exist in the current organization vault.</p>
            <Button onClick={() => navigate('/documents/list')} className="rounded-2xl px-8 h-12 font-bold">
              <ArrowLeft className="h-4 w-4 mr-2" /> Return to Vault
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const sentimentStyles = analysis ? getSentimentStyles(analysis.sentiment) : null;

  return (
    <div className="flex min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <Sidebar />
      
      <main className="flex-1 p-4 lg:p-10">
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6" data-tour="document-header">
            <div className="flex items-center gap-5">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => navigate('/documents/list')}
                className="rounded-2xl border-muted-foreground/10 h-12 w-12 bg-white dark:bg-card shadow-sm hover:scale-110 transition-transform"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight line-clamp-1">
                  {document.name}
                </h1>
                <div className="flex items-center gap-4 mt-1 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    {new Date(document.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    {(document.file_size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 self-end md:self-center">
              <Button variant="outline" onClick={handleDownload} disabled={downloading} className="rounded-2xl h-11 px-6 font-bold border-muted-foreground/10 bg-white dark:bg-card shadow-sm transition-all hover:bg-primary hover:text-white group">
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
                )}
                Download
              </Button>
              
              {isEditor && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" disabled={deleting} className="rounded-2xl h-11 w-11 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                      {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl font-bold">Destroy Archive?</AlertDialogTitle>
                      <AlertDialogDescription className="text-base">
                        Permanently delete "{document.name}"? This will erase all AI processing and comments associated with this file.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                      <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90 rounded-xl font-bold">
                        Confirm Destruction
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          {analysis && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-tour="document-stats">
                {[
                  { label: 'Token Volume', value: analysis.word_count, icon: Hash, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                  { label: 'Read Latency', value: `${analysis.reading_time_minutes}m`, icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                  { label: 'AI Markers', value: analysis.keywords?.length || 0, icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                ].map((stat, i) => (
                  <Card key={i} className="border-none bg-white dark:bg-card rounded-[2rem] shadow-sm ring-1 ring-muted-foreground/5 hover:ring-primary/20 transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${stat.bg}`}>
                          <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                        <div>
                          <p className="text-2xl font-black tracking-tight">{stat.value}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Card className="border-none bg-white dark:bg-card rounded-[2rem] shadow-sm ring-1 ring-muted-foreground/5">
                  <CardContent className="pt-6">
                    <div className="flex flex-col justify-center h-full">
                      <Badge variant="outline" className={`w-fit rounded-lg px-3 py-1.5 gap-2 border-none ring-1 ring-inset shadow-sm ${sentimentStyles?.color}`}>
                        {sentimentStyles?.icon}
                        <span className="capitalize font-black text-xs">{analysis.sentiment}</span>
                      </Badge>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 ml-1">Tone Analysis</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Analysis & Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* Summary */}
                  <Card className="border-none bg-white dark:bg-card rounded-[2.5rem] shadow-sm ring-1 ring-muted-foreground/5 overflow-hidden" data-tour="document-summary">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-6">
                      <CardTitle className="flex items-center gap-3 text-lg font-bold">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Executive Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8">
                      <p className="text-[15px] leading-[1.8] text-muted-foreground font-medium italic border-l-4 border-primary/20 pl-6">
                        "{analysis.summary}"
                      </p>
                    </CardContent>
                  </Card>

                  {/* Document Highlights */}
                  {documentContent && (
                    <Card className="border-none bg-white dark:bg-card rounded-[2.5rem] shadow-sm ring-1 ring-muted-foreground/5 overflow-hidden">
                      <CardHeader className="border-b border-muted-foreground/5">
                        <CardTitle className="flex items-center gap-3 text-lg font-bold">
                          <FileText className="h-5 w-5 text-primary" />
                          Contextual Intelligence
                        </CardTitle>
                        <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-primary">High-fidelity content mapping</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-8 prose prose-slate dark:prose-invert max-w-none">
                        <DocumentHighlighter 
                          content={documentContent}
                          keywords={analysis.keywords || []}
                          keyTopics={analysis.key_topics || []}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Document Translation Tool */}
                  {documentContent && (
                    <div className="mt-6" data-tour="document-translate">
                      <DocumentTranslation 
                        content={documentContent} 
                        documentName={document.name}
                      />
                    </div>
                  )}
                </div>

                {/* Sidebar Insights */}
                <div className="space-y-8">
                  {/* Keywords & Topics */}
                  <Card className="border-none bg-white dark:bg-card rounded-[2.5rem] shadow-sm ring-1 ring-muted-foreground/5" data-tour="document-keywords">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold">Neural Markers</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {analysis.keywords?.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Priority Keywords</h4>
                          <div className="flex flex-wrap gap-2">
                            {analysis.keywords.map((keyword, i) => (
                              <Badge key={i} variant="secondary" className="bg-primary/5 text-primary border-none px-3 py-1 rounded-lg text-xs font-bold transition-all hover:bg-primary/10">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {analysis.key_topics?.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Key Taxonomy</h4>
                          <div className="flex flex-wrap gap-2">
                            {analysis.key_topics.map((topic, i) => (
                              <Badge key={i} variant="outline" className="bg-accent/5 text-accent border-accent/20 px-3 py-1 rounded-lg text-xs font-bold">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Word Usage Chart */}
                  <Card className="border-none bg-white dark:bg-card rounded-[2.5rem] shadow-sm ring-1 ring-muted-foreground/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg font-bold">
                        <BarChart3 className="h-5 w-5 text-emerald-500" />
                        Concept Density
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <WordUsageChart 
                        content={documentContent || analysis.summary || ''} 
                        keywords={analysis.keywords || []}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="pt-8" data-tour="document-comments">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-1 bg-muted-foreground/10" />
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">Network Collaboration</h3>
              <div className="h-px flex-1 bg-muted-foreground/10" />
            </div>
            <CommentsSection documentId={id!} />
          </div>
        </div>
      </main>
    </div>
  );
}