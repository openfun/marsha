import ClipboardJS from 'clipboard';
import { Button, Text } from 'grommet';
import React, { Fragment, ReactElement, useEffect } from 'react';

import { DashedBoxCustom } from 'common/DashedBoxCustom';
import { CopySVG } from 'common/SVGIcons/CopySVG';

interface Props {
  copyId: string;
  text: string | ReactElement;
  title: string;
  onSuccess: (e: ClipboardJS.Event) => void;
  onError: (e: ClipboardJS.Event) => void;
  isActive?: boolean;
  withLabel?: boolean;
  textToCopy?: string;
}

export const CopyClipboard = ({
  copyId,
  text,
  title,
  onSuccess,
  onError,
  withLabel,
  textToCopy,
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
    <Fragment>
      {withLabel && (
        <Text
          color="blue-active"
          size="0.875rem"
          style={{ fontFamily: 'Roboto-Medium' }}
        >
          {title}
        </Text>
      )}
      <DashedBoxCustom>
        <Text
          color={isActive ? 'blue-active' : '#b4cff2'}
          size="0.875rem"
          style={{ fontFamily: 'Roboto-Medium' }}
          truncate
        >
          {text}
        </Text>
        <Button
          a11yTitle={title}
          id={copyId}
          data-clipboard-text={textToCopy || text}
          plain
          style={{ display: 'flex', padding: 0 }}
          title={title}
        >
          <CopySVG iconColor="blue-active" width="20px" height="25px" />
        </Button>
      </DashedBoxCustom>
    </Fragment>
  );
};
