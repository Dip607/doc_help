import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  ArrowLeft, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  File,
  X,
  Image as ImageIcon,
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Sidebar from '@/components/Sidebar';
import { Progress } from "@/components/ui/progress";

export default function Documents() {
  const { user, organization, subscription, isEditor, isPro, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, 'pending' | 'uploading' | 'analyzing' | 'done' | 'error'>>({});

  const canUpload = isEditor && (isPro || (subscription ? subscription.documents_used < subscription.documents_limit : true));

  const isImageFile = (file: File) => {
    return file.type.startsWith('image/') || 
      ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].some(ext => file.name.toLowerCase().endsWith(`.${ext}`));
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(f => 
      f.type === 'application/pdf' || 
      f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      f.type === 'text/plain' ||
      f.name.endsWith('.txt') ||
      f.name.endsWith('.md') ||
      isImageFile(f)
    );
    
    if (validFiles.length !== acceptedFiles.length) {
      toast({
        title: 'Format not supported',
        description: 'Only PDF, DOCX, TXT, and Images are allowed.',
        variant: 'destructive',
      });
    }
    
    setFiles(prev => [...prev, ...validFiles]);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'],
    },
    disabled: !canUpload,
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const readImageAsBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (!user || !organization || files.length === 0) return;
    
    setUploading(true);
    const initialStatus: Record<string, any> = {};
    files.forEach(f => initialStatus[f.name] = 'pending');
    setUploadProgress(initialStatus);

    for (const file of files) {
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 'uploading' }));
        
        const storagePath = `${organization.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(storagePath, file);

        if (uploadError) throw uploadError;

        const { data: doc, error: docError } = await supabase
          .from('documents')
          .insert({
            organization_id: organization.id,
            uploaded_by: user.id,
            name: file.name,
            file_type: file.type || 'text/plain',
            file_size: file.size,
            storage_path: storagePath,
          })
          .select().single();

        if (docError) throw docError;

        setUploadProgress(prev => ({ ...prev, [file.name]: 'analyzing' }));
        setAnalyzing(true);

        if (isImageFile(file)) {
          const imageBase64 = await readImageAsBase64(file);
          await supabase.functions.invoke('analyze-image', {
            body: { documentId: doc.id, imageBase64, fileName: file.name },
          });
        } else {
          const content = await readFileContent(file);
          await supabase.functions.invoke('analyze-document', {
            body: { documentId: doc.id, content, fileName: file.name },
          });
        }

        setUploadProgress(prev => ({ ...prev, [file.name]: 'done' }));
      } catch (error) {
        console.error("Processing error:", error);
        setUploadProgress(prev => ({ ...prev, [file.name]: 'error' }));
      }
    }

    setUploading(false);
    setAnalyzing(false);
    await refreshSubscription();
    
    if (Object.values(uploadProgress).some(s => s === 'done')) {
      toast({ title: 'Upload Successful', description: 'Your documents have been processed by AI.' });
      setTimeout(() => navigate('/documents/list'), 1200);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#fafafa] dark:bg-[#09090b]">
      <Sidebar />
      
      <main className="flex-1 p-4 lg:p-10">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Top Navigation & Branding */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => navigate('/dashboard')} 
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Upload Center</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Transforming raw data into actionable insights</p>
              </div>
            </div>
            
            {isPro && (
              <Badge className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200/50 dark:border-yellow-500/20 px-4 py-1.5 rounded-full flex gap-2 self-start sm:self-center shadow-sm">
                <Sparkles className="h-3.5 w-3.5 fill-yellow-500/20" /> 
                <span className="font-bold tracking-tight">Pro Member</span>
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Main Dropzone Area */}
              <div
                {...getRootProps()}
                className={`
                  relative group border-2 border-dashed rounded-[2.5rem] p-12 text-center transition-all duration-300
                  ${isDragActive ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 scale-[1.01]' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm hover:border-blue-400/50'}
                  ${!canUpload ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <input {...getInputProps()} />
                <div className="bg-blue-50 dark:bg-blue-900/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                  <Upload className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {isDragActive ? 'Drop files to process' : 'Select Analysis Target'}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
                  Drag and drop documents here. Our AI handles PDFs, Word files, and high-res images.
                </p>
                
                {!canUpload && (
                  <div className="mt-6 px-4 py-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-full inline-flex items-center gap-2 border border-rose-100 dark:border-rose-900/50">
                    <AlertCircle className="h-3.5 w-3.5" /> Usage limit reached for this month
                  </div>
                )}
              </div>

              {/* Processing Queue */}
              {files.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Processing Queue</h4>
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-800">
                      {files.length} ITEMS
                    </span>
                  </div>
                  
                  <div className="grid gap-3">
                    {files.map((file, index) => {
                      const status = uploadProgress[file.name] || 'pending';
                      return (
                        <div 
                          key={`${file.name}-${index}`}
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                            status === 'done' 
                              ? 'bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/50' 
                              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div className={`flex-shrink-0 p-3 rounded-xl ${isImageFile(file) ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'}`}>
                              {isImageFile(file) ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                            </div>
                            <div className="overflow-hidden">
                              <p className="font-bold text-sm text-slate-900 dark:text-white truncate pr-4">{file.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                                  {(file.size / 1024).toFixed(0)} KB
                                </span>
                                <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                                  status === 'done' ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'
                                }`}>
                                  • {status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {status === 'pending' && !uploading && (
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600" onClick={() => removeFile(index)}>
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                            {status === 'uploading' && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
                            {status === 'analyzing' && <Sparkles className="h-5 w-5 animate-pulse text-blue-500" />}
                            {status === 'done' && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                            {status === 'error' && <AlertCircle className="h-5 w-5 text-rose-500" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Account Status & Action Card */}
            <div className="space-y-6">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden group">
                <div className="h-24 bg-slate-950 p-6 flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-white text-lg font-bold">Plan Usage</CardTitle>
                    <CardDescription className="text-slate-400 text-xs">Current billing cycle</CardDescription>
                  </div>
                  <ShieldCheck className="text-slate-700 h-6 w-6" />
                </div>
                
                <CardContent className="px-6 pb-8 -mt-6">
                  <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-700 space-y-5">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Used</p>
                        <div className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">
                          {subscription?.documents_used || 0}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-slate-400 mb-1 italic">
                        Limit: {isPro ? 'Unlimited' : subscription?.documents_limit}
                      </div>
                    </div>
                    
                    <Progress 
                      value={isPro ? 0 : ((subscription?.documents_used || 0) / (subscription?.documents_limit || 1)) * 100} 
                      className="h-2.5 bg-slate-100 dark:bg-slate-700"
                    />

                    {!isPro && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => navigate('/settings/subscription')}
                        className="w-full text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl flex items-center justify-center gap-1.5 py-5"
                      >
                        Increase Limit <ChevronRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Button 
                onClick={handleUpload}
                disabled={files.length === 0 || uploading || !canUpload}
                className={`
                  w-full h-20 rounded-[2rem] text-lg font-black transition-all duration-500 shadow-2xl active:scale-95
                  ${uploading ? 'bg-slate-100 dark:bg-slate-800' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 shadow-blue-500/20'}
                `}
              >
                {uploading ? (
                  <div className="flex items-center gap-4 text-blue-600 dark:text-blue-400">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="uppercase tracking-widest text-sm">{analyzing ? 'AI Analysis...' : 'Uploading...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-white">
                    <Sparkles className="h-6 w-6 fill-white/20" />
                    <span>START ANALYSIS</span>
                  </div>
                )}
              </Button>

              <p className="text-[10px] text-center font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Secured by Enterprise OCR & GPT-4o
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}