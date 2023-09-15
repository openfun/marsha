import { Heading } from 'lib-components';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  page404: {
    defaultMessage: 'Sorry, this page does not exist.',
    description: 'Website page 404',
    id: 'components.Text.Text404',
  },
});

const Text404 = () => {
  const intl = useIntl();

  return (
    <Heading level={2} textAlign="center">
      {intl.formatMessage(messages.page404)}
    </Heading>
  );
};

export default Text404;
