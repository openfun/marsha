import { Paragraph } from 'grommet';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { H2 } from '../Headings';
import { LayoutMainArea } from '../LayoutMainArea';
import { getResource } from '../../data/sideEffects/getResource';
import { pollForLive } from '../../data/sideEffects/pollForLive';
import { Video } from '../../types/tracks';
import { useAsyncEffect } from '../../utils/useAsyncEffect';
import { modelName } from '../../types/models';

const messages = defineMessages({
  title: {
    defaultMessage: 'Live will begin soon',
    description: 'Title for the waiting live video component',
    id: 'components.WaitingLiveVideo.title',
  },
  text: {
    defaultMessage:
      'The live is going to start. You can wait here, the player will start once the live is ready.',
    description: 'Message for the waiting live video component',
    id: 'components.WaitingLiveVideo.message',
  },
});

const WaitingLiveVideoStyled = styled(LayoutMainArea)`
  display: flex;
  flex-direction: column;
  padding: 0 2rem;
`;

const WaitingLiveVideoContentStyled = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  flex-grow: 1;
  padding-top: 4rem;
  padding-bottom: 6rem;
  text-align: center;
`;

interface WaitingLiveVideoProps {
  video?: Video;
}

export const WaitingLiveVideo = ({ video }: WaitingLiveVideoProps) => {
  useAsyncEffect(async () => {
    if (video) {
      await pollForLive(video);
      await getResource(modelName.VIDEOS, video.id);
    }
  }, []);

  return (
    <WaitingLiveVideoStyled>
      <WaitingLiveVideoContentStyled>
        <H2>
          <FormattedMessage {...messages.title} />
        </H2>
        <Paragraph>
          <FormattedMessage {...messages.text} />
        </Paragraph>
      </WaitingLiveVideoContentStyled>
    </WaitingLiveVideoStyled>
  );
};
