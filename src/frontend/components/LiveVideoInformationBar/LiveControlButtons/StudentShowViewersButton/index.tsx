import { Button } from 'grommet';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  ViewersButton: {
    defaultMessage: 'Show viewers',
    description: 'Title for the show viewers button',
    id: 'components.StudentShowViewersButton.ViewersButton',
  },
});

import { ViewersSVG } from 'components/SVGIcons/ViewersSVG';

export const StudentShowViewersButton = () => {
  const intl = useIntl();

  return (
    <Button
      onClick={() => {}}
      margin={{ right: 'medium', left: 'medium' }}
      a11yTitle={intl.formatMessage(messages.ViewersButton)}
      style={{ padding: '0' }}
      icon={
        <ViewersSVG
          baseColor={'blue-off'}
          hoverColor={'blue-active'}
          title={intl.formatMessage(messages.ViewersButton)}
          width={'45.83'}
          height={'27.08'}
        />
      }
    />
  );
};
