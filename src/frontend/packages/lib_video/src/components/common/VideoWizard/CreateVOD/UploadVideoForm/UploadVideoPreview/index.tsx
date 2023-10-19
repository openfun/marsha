import { Box, Stack } from 'grommet';
import { BinSVG } from 'lib-components';
import React, { useEffect, useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { BigDashedBox } from '../BigDashedBox';

const messages = defineMessages({
  removeVideoButtonLabel: {
    defaultMessage: 'Click on this button to remove the selected video.',
    description: 'Label of the video remove button.',
    id: 'components.UploadVideoPreview.removeVideoButtonLabel',
  },
});

interface UploadVideoPreviewProps {
  onClickRemoveButton: () => void;
  videoSrc: string;
}

export const UploadVideoPreview = ({
  onClickRemoveButton,
  videoSrc,
}: UploadVideoPreviewProps) => {
  const intl = useIntl();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.addEventListener('play', () => setIsPlaying(true));
      videoRef.current.addEventListener('pause', () => setIsPlaying(false));
    }
  }, []);

  return (
    <BigDashedBox
      pad="0px"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Stack anchor="top-right" fill>
        <Box overflow="hidden" round="small">
          <video controls ref={videoRef} src={videoSrc} width="100%" />
        </Box>
        {(!isPlaying || isHovering) && (
          <BinSVG
            aria-label={intl.formatMessage(messages.removeVideoButtonLabel)}
            className="m-b"
            height="18px"
            iconColor="white"
            onClick={() => onClickRemoveButton()}
            width="14px"
          />
        )}
      </Stack>
    </BigDashedBox>
  );
};
