import { Layer } from 'grommet';
import React from 'react';

import { InputDisplayNameOverlay } from 'components/Chat/SharedChatComponents/InputDisplayNameOverlay';
import { useSetDisplayName } from 'data/stores/useSetDisplayName';

interface DisplayNameFormProps {
  fullPage?: boolean;
  target?: any;
}

export const DisplayNameForm = ({ fullPage, target }: DisplayNameFormProps) => {
  const [isDisplayNameVisible] = useSetDisplayName();

  if (isDisplayNameVisible) {
    return (
      <Layer
        animate
        animation="fadeIn"
        full={fullPage}
        target={!fullPage && target}
      >
        <InputDisplayNameOverlay />
      </Layer>
    );
  }

  return null;
};
