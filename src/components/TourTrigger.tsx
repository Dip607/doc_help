import { HelpCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface TourTriggerProps {
  onStartTour: () => void;
  onResetAllTours?: () => void;
}

export function TourTrigger({ onStartTour, onResetAllTours }: TourTriggerProps) {
  const { toast } = useToast();

  const handleResetAllTours = () => {
    // Clear all tour-related localStorage keys
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('docai_onboarding_')) {
        localStorage.removeItem(key);
      }
    });
    
    onResetAllTours?.();
    
    toast({
      title: 'Tours reset',
      description: 'All onboarding tours have been reset. Refresh the page to see them.',
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Help & Tours"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onStartTour}>
          <HelpCircle className="h-4 w-4 mr-2" />
          Start page tour
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleResetAllTours}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset all tours
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
