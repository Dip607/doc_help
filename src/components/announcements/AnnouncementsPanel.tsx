import { useState, useEffect } from 'react';
import { Megaphone, Plus, X, MessageSquare, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { AnnouncementItem } from './AnnouncementItem';
import { cn } from '@/lib/utils';

export function AnnouncementsPanel({ collapsed }: { collapsed?: boolean }) {
  const { announcements, loading, addAnnouncement, deleteAnnouncement, isAdmin } = useAnnouncements();
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);

  // Handle Responsive Toggle
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return;
    setIsSubmitting(true);
    await addAnnouncement(title.trim(), content.trim());
    setTitle(''); setContent('');
    setIsCreating(false); setIsSubmitting(false);
  };

  const HeaderContent = () => (
    <div className="flex items-center justify-between w-full">
      <div className="flex flex-col text-left">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 leading-none mb-1">Secure Core</span>
        <span className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Broadcasts</span>
      </div>
      {isAdmin && !isCreating && (
        <Button size="sm" onClick={() => setIsCreating(true)} className="rounded-xl bg-blue-600 font-black text-[10px] uppercase tracking-widest px-4 h-9">
          <Plus className="h-3 w-3 mr-1" /> New
        </Button>
      )}
    </div>
  );

  const ListContent = () => (
    <div className="py-6 space-y-4">
      {isAdmin && isCreating && (
        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-3 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black uppercase text-blue-500 tracking-widest">New Official Notice</span>
            <X className="h-4 w-4 text-slate-400 cursor-pointer" onClick={() => setIsCreating(false)} />
          </div>
          <Input placeholder="Subject" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-white dark:bg-black/40 border-none ring-1 ring-white/10" />
          <Textarea placeholder="Message details..." value={content} onChange={(e) => setContent(e.target.value)} className="bg-white dark:bg-black/40 border-none ring-1 ring-white/10 resize-none h-24" />
          <Button onClick={handleCreate} disabled={isSubmitting} className="w-full bg-blue-600 font-black uppercase text-[10px] tracking-widest h-10">
            {isSubmitting ? "Syncing..." : "Authorize Post"}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 opacity-40">
           <Loader2 className="h-6 w-6 animate-spin" />
           <span className="text-[9px] font-black uppercase">Syncing Registry</span>
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-20 opacity-20">
           <MessageSquare className="h-10 w-10 mx-auto mb-2" />
           <p className="text-xs font-bold uppercase tracking-widest">No Messages</p>
        </div>
      ) : (
        announcements.map((a) => (
          <AnnouncementItem key={a.id} announcement={a} onDelete={deleteAnnouncement} isAdmin={isAdmin} />
        ))
      )}
    </div>
  );

  const trigger = (
    <Button variant="ghost" className={cn("w-full justify-start rounded-xl group text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 dark:hover:bg-white/5", collapsed && "justify-center px-0")}>
      <div className="relative">
        <Megaphone className="h-5 w-5 transition-transform group-hover:scale-110" />
        {announcements.length > 0 && (
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-blue-600 text-[8px] font-black text-white flex items-center justify-center border-2 border-white dark:border-[#050608]">
            {announcements.length}
          </span>
        )}
      </div>
      {!collapsed && <span className="ml-3 font-bold text-sm">Messages</span>}
    </Button>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-lg p-0 bg-white dark:bg-[#0a0a0b] border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden z-[200]">
          <DialogHeader className="p-6 border-b border-white/5"><HeaderContent /></DialogHeader>
          <ScrollArea className="h-[500px] px-6"><ListContent /></ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] p-0 bg-white dark:bg-[#0a0a0b] border-t border-white/5 rounded-t-[2.5rem] z-[200]">
        <SheetHeader className="p-6 border-b border-white/5"><HeaderContent /></SheetHeader>
        <ScrollArea className="h-full px-6"><ListContent /></ScrollArea>
      </SheetContent>
    </Sheet>
  );
}