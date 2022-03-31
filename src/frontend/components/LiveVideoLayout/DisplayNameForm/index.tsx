import { Layer } from 'grommet';
import React from 'react';

import { InputDisplayNameOverlay } from 'components/Chat/SharedChatComponents/InputDisplayNameOverlay';
import { useSetDisplayName } from 'data/stores/useSetDisplayName';

interface DisplayNameFormProps {
  target?: any;
}

export const DisplayNameForm = ({ target }: DisplayNameFormProps) => {
  const [isDisplayNameVisible] = useSetDisplayName();

  if (isDisplayNameVisible) {
    return (
      <Layer
        animate
        animation="fadeIn"
        full={target === undefined}
        target={target}
      >
        <InputDisplayNameOverlay />
      </Layer>
    );
  }

  return null;
};
