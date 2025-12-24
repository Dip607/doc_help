import { useState, useEffect, useCallback } from 'react';
import { Step, CallBackProps, STATUS, EVENTS, ACTIONS } from 'react-joyride';

const TOUR_COMPLETED_KEY = 'docai_onboarding_completed';
const TOUR_SKIPPED_KEY = 'docai_onboarding_skipped';

export interface TourConfig {
  tourId: string;
  steps: Step[];
  autoStart?: boolean;
}

export function useOnboardingTour(config: TourConfig) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const storageKey = `${TOUR_COMPLETED_KEY}_${config.tourId}`;
  const skippedKey = `${TOUR_SKIPPED_KEY}_${config.tourId}`;

  useEffect(() => {
    if (config.autoStart) {
      const completed = localStorage.getItem(storageKey);
      const skipped = localStorage.getItem(skippedKey);
      
      if (!completed && !skipped) {
        // Small delay to ensure DOM elements are rendered
        const timer = setTimeout(() => {
          setRun(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [config.autoStart, storageKey, skippedKey]);

  const handleCallback = useCallback((data: CallBackProps) => {
    const { status, type, action, index } = data;

    if (type === EVENTS.STEP_AFTER) {
      if (action === ACTIONS.NEXT) {
        setStepIndex(index + 1);
      } else if (action === ACTIONS.PREV) {
        setStepIndex(index - 1);
      }
    }

    if (status === STATUS.FINISHED) {
      localStorage.setItem(storageKey, 'true');
      setRun(false);
      setStepIndex(0);
    }

    if (status === STATUS.SKIPPED) {
      localStorage.setItem(skippedKey, 'true');
      setRun(false);
      setStepIndex(0);
    }
  }, [storageKey, skippedKey]);

  const startTour = useCallback(() => {
    setStepIndex(0);
    setRun(true);
  }, []);

  const stopTour = useCallback(() => {
    setRun(false);
    setStepIndex(0);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(skippedKey);
    setStepIndex(0);
    setRun(true);
  }, [storageKey, skippedKey]);

  const isTourCompleted = useCallback(() => {
    return localStorage.getItem(storageKey) === 'true';
  }, [storageKey]);

  return {
    run,
    stepIndex,
    steps: config.steps,
    handleCallback,
    startTour,
    stopTour,
    resetTour,
    isTourCompleted,
  };
}

// Pre-defined tour configurations for different pages
export const dashboardTourSteps: Step[] = [
  {
    target: '[data-tour="sidebar"]',
    content: 'Welcome to DocAI! This is your navigation sidebar. Use it to access different sections of the platform.',
    disableBeacon: true,
    placement: 'right',
  },
  {
    target: '[data-tour="dashboard-stats"]',
    content: 'Here you can see your document statistics at a glance - total documents, storage used, and more.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="recent-documents"]',
    content: 'Your recently accessed documents appear here for quick access.',
    placement: 'top',
  },
  {
    target: '[data-tour="upload-action"]',
    content: 'Click here to upload new documents for AI-powered analysis.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="announcements"]',
    content: 'Stay updated with organization announcements and messages here.',
    placement: 'left',
  },
  {
    target: '[data-tour="language-switcher"]',
    content: 'You can change the interface language anytime using this switcher.',
    placement: 'top',
  },
];

export const documentsTourSteps: Step[] = [
  {
    target: '[data-tour="documents-list"]',
    content: 'This is your documents library. All your uploaded and analyzed documents are listed here.',
    disableBeacon: true,
    placement: 'top',
  },
  {
    target: '[data-tour="document-search"]',
    content: 'Use the search bar to quickly find documents by name or content.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="upload-button"]',
    content: 'Click here to upload new documents. Supported formats include PDF, TXT, and more.',
    placement: 'left',
  },
];

export const documentDetailTourSteps: Step[] = [
  {
    target: '[data-tour="document-header"]',
    content: 'This section shows your document details including name, size, and upload date.',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '[data-tour="document-stats"]',
    content: 'AI-generated insights: word count, reading time, and sentiment analysis.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="document-summary"]',
    content: 'An AI-generated summary of your document content for quick understanding.',
    placement: 'top',
  },
  {
    target: '[data-tour="document-keywords"]',
    content: 'Key topics and keywords extracted from your document.',
    placement: 'top',
  },
  {
    target: '[data-tour="document-translate"]',
    content: 'Translate your document to any language using AI-powered translation.',
    placement: 'top',
  },
  {
    target: '[data-tour="document-comments"]',
    content: 'Collaborate with your team by adding comments and discussions.',
    placement: 'top',
  },
];
