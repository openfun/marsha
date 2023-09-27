import ClipboardJS from 'clipboard';
import { Button } from 'grommet';
import React, { Fragment, ReactElement, useEffect } from 'react';

import { DashedBoxCustom } from '@lib-components/common/DashedBoxCustom';
import { CopySVG } from '@lib-components/common/SVGIcons/CopySVG';
import { Text, TextProps } from '@lib-components/common/Text/';

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
    <Fragment>
      {withLabel && (
        <Text weight="medium" className="mt-t">
          {title}
        </Text>
      )}
      <DashedBoxCustom>
        <Text
          color={isActive ? 'clr-primary-500' : '#b4cff2'}
          truncate
          weight="medium"
          {...textProps}
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
