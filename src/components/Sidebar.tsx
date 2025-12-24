import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  FileText, 
  Upload, 
  Settings, 
  Users, 
  Key,
  CreditCard,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Zap,
  Mail,
  Bug,
  Lightbulb,
  MessageSquare,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { AnnouncementsPanel } from './announcements/AnnouncementsPanel';

export default function Sidebar() {
  const { t } = useTranslation();
  const { organization, isAdmin, isPro, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Documents', path: '/documents/list' },
    { icon: Upload, label: 'Upload', path: '/documents/upload' },
  ];

  const adminItems = [
    { icon: Users, label: 'Users', path: '/admin' },
    { icon: Key, label: 'API Keys', path: '/settings/api' },
    { icon: CreditCard, label: 'Subscription', path: '/settings/subscription' },
  ];

  const supportItems = [
    { 
      icon: Mail, 
      label: 'Contact Dev', 
      type: 'contact', 
      color: 'hover:text-blue-600 hover:bg-blue-500/[0.05]',
      isAvailable: true 
    },
    { 
      icon: Bug, 
      label: 'Report a Bug', 
      type: 'bug', 
      color: 'opacity-50 cursor-not-allowed grayscale',
      isAvailable: false 
    },
  ];

  const settingsItems = [
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSupportClick = (item: typeof supportItems[0]) => {
    if (item.isAvailable) {
      navigate('/developer');
    } else {
      toast({
        title: "Module Offline",
        description: `${item.label} is currently being calibrated.`,
      });
    }
  };

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-r border-slate-200 dark:border-slate-800/50 shadow-xl">
      {/* Header & Logo */}
      <div className="p-6 flex items-center justify-between h-20">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => !isMobile && setCollapsed(!collapsed)}>
          <div className="relative p-2 rounded-xl bg-blue-600 shadow-lg shadow-blue-500/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          {(isMobile || !collapsed) && (
            <div className="flex flex-col">
              <span className="font-black tracking-tighter text-slate-900 dark:text-white text-lg uppercase leading-none">DocAI</span>
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1">Intelligence</span>
            </div>
          )}
        </div>
        
        {!isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-slate-400"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Organization Badge */}
      {(isMobile || !collapsed) && organization && (
        <div className="px-6 py-2">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="truncate font-bold text-xs text-slate-600 dark:text-slate-300 tracking-tight">{organization.name}</span>
            </div>
            {isPro && <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />}
          </div>
        </div>
      )}

      {/* Nav Section */}
      <nav className="flex-1 px-4 py-4 space-y-7 overflow-y-auto no-scrollbar">
        
        {/* Core Nav */}
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={cn(
              "group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all",
              isActive(item.path) ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 dark:hover:bg-slate-900"
            )}>
              <item.icon className="h-5 w-5 shrink-0" />
              {(isMobile || !collapsed) && <span className="font-bold text-sm">{item.label}</span>}
            </Link>
          ))}
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="space-y-1">
            {(isMobile || !collapsed) && <p className="px-4 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Administration</p>}
            {adminItems.map((item) => (
              <Link key={item.path} to={item.path} className={cn(
                "group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all",
                isActive(item.path) ? "bg-blue-600 text-white" : "text-slate-500 hover:text-blue-600 hover:bg-blue-50/50"
              )}>
                <item.icon className="h-5 w-5 shrink-0" />
                {(isMobile || !collapsed) && <span className="font-bold text-sm">{item.label}</span>}
              </Link>
            ))}
          </div>
        )}

        {/* Support Section */}
        <div className="space-y-1">
          {(isMobile || !collapsed) && <p className="px-4 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resources</p>}
          {supportItems.map((item) => (
            <button key={item.label} onClick={() => handleSupportClick(item)} disabled={!item.isAvailable} className={cn(
              "w-full group flex items-center justify-between px-4 py-2.5 rounded-xl text-slate-500 transition-all",
              item.color
            )}>
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5 shrink-0" />
                {(isMobile || !collapsed) && <span className="font-bold text-sm">{item.label}</span>}
              </div>
              {!item.isAvailable && (isMobile || !collapsed) && <Badge className="text-[8px] h-4 bg-slate-100 dark:bg-slate-800 text-slate-400 border-none">SOON</Badge>}
            </button>
          ))}
        </div>

        {/* Messages Section */}
        <div className="space-y-1" data-tour="announcements">
          {(isMobile || !collapsed) && <p className="px-4 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">System Feed</p>}
          <AnnouncementsPanel collapsed={!isMobile && collapsed} />
        </div>

        {/* Account Section */}
        <div className="space-y-1">
          {(isMobile || !collapsed) && <p className="px-4 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Settings</p>}
          {settingsItems.map((item) => (
            <Link key={item.path} to={item.path} className={cn(
              "group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all",
              isActive(item.path) ? "bg-blue-600 text-white" : "text-slate-500 hover:text-blue-600"
            )}>
              <item.icon className="h-5 w-5 shrink-0" />
              {(isMobile || !collapsed) && <span className="font-bold text-sm">{item.label}</span>}
            </Link>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 space-y-2">
        
        <Button 
          variant="ghost" 
          className={cn("w-full h-11 justify-start rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30", !isMobile && collapsed && "justify-center px-0")} 
          onClick={signOut}
        >
          <LogOut className="h-5 w-5" />
          {(isMobile || !collapsed) && <span className="ml-3 font-black uppercase text-[10px] tracking-widest">{t('nav.signOut')}</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-0 left-0 z-50 p-4">
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} className="rounded-xl bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-800">
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm animate-in fade-in" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 animate-in slide-in-from-left">
            <SidebarContent isMobile={true} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside 
        data-tour="sidebar"
        className={cn(
          "hidden md:flex flex-col h-screen sticky top-0 transition-all duration-300 z-30",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent isMobile={false} />
      </aside>
    </>
  );
}