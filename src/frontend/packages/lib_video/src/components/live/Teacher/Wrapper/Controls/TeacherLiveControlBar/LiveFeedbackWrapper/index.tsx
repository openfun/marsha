import React from 'react';

import { useLiveFeedback } from '@lib-video/hooks/useLiveFeedback';

import { HideLiveFeedback } from './HideLiveFeedback';
import { ShowLiveFeedback } from './ShowLiveFeedback';

export const LiveFeedbackWrapper = () => {
  const [isLiveFeedbackVisible, setIsLiveFeedbackVisible] = useLiveFeedback();

  if (!isLiveFeedbackVisible) {
    return <ShowLiveFeedback showLive={() => setIsLiveFeedbackVisible(true)} />;
  } else {
    return (
      <HideLiveFeedback hideLive={() => setIsLiveFeedbackVisible(false)} />
    );
  }
};
