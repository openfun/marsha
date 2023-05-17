import { Heading } from 'grommet';
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
    <Heading
      level={3}
      style={{
        padding: '0.3rem 1rem',
        maxWidth: '100%',
      }}
      alignSelf="center"
    >
      {intl.formatMessage(messages.page404)}
    </Heading>
  );
};

export default Text404;
