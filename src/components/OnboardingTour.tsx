import Joyride, { Step, Styles } from 'react-joyride';
import { useOnboardingTour, TourConfig } from '@/hooks/useOnboardingTour';

interface OnboardingTourProps {
  config: TourConfig;
}

const tourStyles: Partial<Styles> = {
  options: {
    primaryColor: 'hsl(var(--primary))',
    backgroundColor: 'hsl(var(--card))',
    textColor: 'hsl(var(--card-foreground))',
    arrowColor: 'hsl(var(--card))',
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: 12,
    padding: 20,
  },
  tooltipContainer: {
    textAlign: 'left',
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: 600,
  },
  tooltipContent: {
    fontSize: 14,
    padding: '10px 0',
  },
  buttonNext: {
    backgroundColor: 'hsl(var(--primary))',
    borderRadius: 8,
    color: 'hsl(var(--primary-foreground))',
    padding: '8px 16px',
    fontSize: 14,
  },
  buttonBack: {
    color: 'hsl(var(--muted-foreground))',
    marginRight: 10,
  },
  buttonSkip: {
    color: 'hsl(var(--muted-foreground))',
  },
  spotlight: {
    borderRadius: 8,
  },
};

export function OnboardingTour({ config }: OnboardingTourProps) {
  const { run, stepIndex, steps, handleCallback } = useOnboardingTour(config);

  if (!run || steps.length === 0) {
    return null;
  }

  return (
    <Joyride
      callback={handleCallback}
      continuous
      run={run}
      stepIndex={stepIndex}
      steps={steps}
      styles={tourStyles}
      showProgress
      showSkipButton
      disableOverlayClose
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Done',
        next: 'Next',
        skip: 'Skip tour',
      }}
    />
  );
}
