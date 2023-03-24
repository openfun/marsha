import { Layer } from 'grommet';
import { Nullable } from 'lib-common';
import React from 'react';

import { InputDisplayNameOverlay } from '@lib-video/components/live/common/InputDisplayNameOverlay';
import { useSetDisplayName } from '@lib-video/hooks/useSetDisplayName';

interface DisplayNameFormProps {
  fullPage?: boolean;
  target?: Nullable<HTMLDivElement>;
}

export const DisplayNameForm = ({ fullPage, target }: DisplayNameFormProps) => {
  const [isDisplayNameVisible] = useSetDisplayName();

  if (isDisplayNameVisible) {
    return (
      <Layer
        animate
        animation="fadeIn"
        full={fullPage}
        target={!fullPage && target ? target : undefined}
      >
        <InputDisplayNameOverlay />
      </Layer>
    );
  }

  return null;
};
