import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { 
  Check, 
  ArrowLeft,
  Zap,
  FileText,
  Key,
  BarChart3,
  Loader2,
  ShieldCheck,
  Infinity,
  Sparkles,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Subscription() {
  const { subscription, organization, isPro, isEditor, isAdmin, user, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [upgrading, setUpgrading] = useState(false);
  const [downgrading, setDowngrading] = useState(false);
  
  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [demoIdInput, setDemoIdInput] = useState('');
  const DEMO_UPGRADE_ID = "DEMO-PRO-2025"; // The ID required to work

  const handleUpgrade = async () => {
    if (!organization) return;
    if (demoIdInput !== DEMO_UPGRADE_ID) {
      toast({
        title: "Invalid Demo ID",
        description: "Please enter the correct ID to proceed with the demo upgrade.",
        variant: "destructive"
      });
      return;
    }

    setIsDialogOpen(false);
    setUpgrading(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          plan: 'pro',
          documents_limit: 999999,
          api_calls_limit: 1000,
        })
        .eq('organization_id', organization.id);

      if (error) throw error;
      await supabase.from('audit_logs').insert({
        organization_id: organization.id,
        user_id: user?.id,
        action: 'upgrade',
        resource_type: 'subscription',
        resource_name: 'Upgraded to Pro via Demo',
      });
      await refreshSubscription();
      toast({ title: 'Welcome to Pro!', description: 'Your limits have been removed.' });
      setDemoIdInput('');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to upgrade plan', variant: 'destructive' });
    } finally {
      setUpgrading(false);
    }
  };

  const handleDowngrade = async () => {
    if (!organization) return;
    setDowngrading(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ plan: 'free', documents_limit: 10, api_calls_limit: 0 })
        .eq('organization_id', organization.id);

      if (error) throw error;
      await refreshSubscription();
      toast({ title: 'Plan Updated', description: 'You are now on the Free plan.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to downgrade', variant: 'destructive' });
    } finally {
      setDowngrading(false);
    }
  };

  const plans = [
    {
      name: 'Starter',
      price: '$0',
      period: '/mo',
      description: 'The essentials for personal analysis',
      features: ['5 documents / mo', 'Basic AI summarization', 'Sentiment analysis', 'Email support'],
      current: !isPro,
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/mo',
      description: 'Power tools for professionals',
      features: ['Unlimited documents', 'Advanced AI extraction', '1,000 API calls / mo', 'Priority support', 'Detailed analytics'],
      current: isPro,
      highlight: true,
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <Sidebar />
      
      <main className="flex-1 p-4 lg:p-10">
        <div className="max-w-5xl mx-auto space-y-10">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => navigate('/dashboard')} className="rounded-xl border-slate-200">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-3xl font-bold tracking-tight">Billing & Plan</h1>
            </div>
          </div>

          {/* Usage Insight */}
          <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="bg-slate-950 text-white p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    Current Usage
                    <Badge className={isPro ? "bg-yellow-500 text-white border-none" : "bg-white/10 text-white border-none"}>
                      {isPro ? 'Pro Member' : 'Free Plan'}
                    </Badge>
                  </CardTitle>
                </div>
                <ShieldCheck className="h-8 w-8 text-slate-700" />
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Documents</div>
                    <div className="text-2xl font-black">
                      {subscription?.documents_used} <span className="text-sm font-medium text-slate-400">/ {isPro ? <Infinity className="inline h-4 w-4" /> : subscription?.documents_limit}</span>
                    </div>
                  </div>
                  <Progress value={isPro ? 0 : ((subscription?.documents_used || 0) / (subscription?.documents_limit || 1)) * 100} className="h-2.5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {plans.map((plan) => (
              <Card 
                key={plan.name}
                className={`relative rounded-[2.5rem] border-none shadow-sm transition-all duration-300 flex flex-col ${
                  plan.highlight ? 'bg-white dark:bg-slate-900 ring-2 ring-blue-500 shadow-xl' : 'bg-white dark:bg-card opacity-90'
                }`}
              >
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="mt-6 flex items-baseline">
                    <span className="text-5xl font-black tracking-tight">{plan.price}</span>
                    <span className="text-slate-400 font-bold ml-1">{plan.period}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="p-8 flex-1 flex flex-col">
                  <div className="space-y-4 flex-1">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                        <Check className="h-4 w-4 text-emerald-600" /> {feature}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8">
                    {plan.current ? (
                      <Button className="w-full h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold" disabled>
                        Your Active Plan
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => plan.name === 'Pro' ? setIsDialogOpen(true) : handleDowngrade()}
                        disabled={upgrading || downgrading || (!isEditor && !isAdmin)}
                        className={`w-full h-14 rounded-2xl font-bold transition-all active:scale-95 ${
                          plan.highlight ? 'bg-blue-600 hover:bg-blue-700 shadow-lg text-white' : 'bg-slate-900 text-white'
                        }`}
                      >
                        {upgrading || downgrading ? <Loader2 className="h-5 w-5 animate-spin" /> : `Choose ${plan.name}`}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Demo Upgrade Confirmation Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl p-8">
          <AlertDialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
               <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold">Upgrade to Pro</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 text-base leading-relaxed">
              To proceed with this demo upgrade, please enter the Demo Verification ID below. This simulates a payment gateway confirmation.
              <br />
              <span className="mt-2 block font-mono text-xs bg-slate-100 p-2 rounded text-blue-700">
                Hint: <strong>{DEMO_UPGRADE_ID}</strong>
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Input 
              placeholder="Enter Demo ID"
              className="h-12 rounded-xl bg-slate-50 border-slate-200"
              value={demoIdInput}
              onChange={(e) => setDemoIdInput(e.target.value)}
            />
          </div>

          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl h-12 font-bold" onClick={() => setDemoIdInput('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault(); // Prevent closing if ID is wrong
                handleUpgrade();
              }}
              className="rounded-xl h-12 bg-blue-600 hover:bg-blue-700 font-bold"
              disabled={!demoIdInput}
            >
              Verify & Upgrade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}