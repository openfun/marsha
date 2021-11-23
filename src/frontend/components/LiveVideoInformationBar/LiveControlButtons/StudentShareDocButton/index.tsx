import React, { useContext } from 'react';
import { Button, ResponsiveContext } from 'grommet';
import { defineMessages, useIntl } from 'react-intl';

import { UploadDocSVG } from 'components/SVGIcons/UploadDocSVG';

const messages = defineMessages({
  ShareDocTitleButton: {
    defaultMessage: 'Upload file',
    description: 'Title for the upload file button',
    id: 'components.StudentShareDocButton.ShareDocTitleButton',
  },
});

export const StudentShareDocButton = () => {
  const size = useContext(ResponsiveContext);
  const intl = useIntl();

  return (
    <Button
      onClick={() => {}}
      margin={
        size !== 'small'
          ? { right: 'medium', left: 'medium' }
          : { right: 'medium' }
      }
      a11yTitle={intl.formatMessage(messages.ShareDocTitleButton)}
      style={{ padding: '0' }}
      icon={
        <UploadDocSVG
          baseColor={'blue-off'}
          hoverColor={'blue-active'}
          width={'45.83'}
          height={'41.67'}
          title={intl.formatMessage(messages.ShareDocTitleButton)}
        />
      }
    />
  );
};
