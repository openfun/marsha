import { Button } from '@openfun/cunningham-react';
import ClipboardJS from 'clipboard';
import { colorsTokens } from 'lib-common';
import React, { ReactElement, useEffect } from 'react';

import { DashedBoxCustom } from '@lib-components/common/DashedBoxCustom';
import { CopySVG } from '@lib-components/common/SVGIcons/CopySVG';
import { Text, TextProps } from '@lib-components/common/Text/';

import { Box } from '../Box';

interface Props {
  copyId: string;
  text: string | ReactElement;
  title: string;
  onSuccess: (e: ClipboardJS.Event) => void;
  onError: (e: ClipboardJS.Event) => void;
  isActive?: boolean;
  withLabel?: boolean;
  textToCopy?: string;
  textProps?: TextProps<'span'>;
}

export const CopyClipboard = ({
  copyId,
  text,
  title,
  onSuccess,
  onError,
  withLabel,
  textToCopy,
  textProps,
  isActive = true,
}: Props) => {
  useEffect(() => {
    if (!isActive) {
      return;
    }

    const clipboard = new ClipboardJS(`#${copyId}`);
    clipboard.on('success', onSuccess);
    clipboard.on('error', onError);
    return () => clipboard.destroy();
  }, [copyId, isActive, onError, onSuccess]);

  return (
    <Box fill>
      {withLabel && <Text weight="medium">{title}</Text>}
      <DashedBoxCustom>
        <Text
          color={isActive ? 'clr-primary-500' : '#b4cff2'}
          truncate
          weight="medium"
          title={typeof text === 'string' ? text : undefined}
          {...textProps}
        >
          {text}
        </Text>
        <Button
          aria-label={title}
          id={copyId}
          data-clipboard-text={textToCopy || text}
          title={title}
          color="tertiary"
        >
          <CopySVG
            iconColor={colorsTokens['info-500']}
            width="20px"
            height="25px"
          />
        </Button>
      </DashedBoxCustom>
    </Box>
  );
};
