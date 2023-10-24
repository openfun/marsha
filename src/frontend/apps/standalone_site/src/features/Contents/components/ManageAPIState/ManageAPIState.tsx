import { Box, BoxError, BoxLoader, Text } from 'lib-components';
import { Fragment, PropsWithChildren, ReactElement } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { ReactComponent as ContentsIcon } from 'assets/svg/iko_webinairesvg.svg';

const messages = defineMessages({
  NoThing: {
    defaultMessage: 'There is nothing to display.',
    description: 'Text when there is nothing to display.',
    id: 'components.ManageAPIState.NoThing',
  },
  Error: {
    defaultMessage: 'Sorry, an error has occurred.',
    description: 'Text when there is an error.',
    id: 'components.ManageAPIState.Error',
  },
});

interface ManageAPIStateProps {
  isLoading: boolean;
  isError: boolean;
  hasResult: boolean;
  error?: ReactElement | string;
  nothingToDisplay?: ReactElement | string;
}

const ManageAPIState = ({
  isLoading,
  isError,
  hasResult,
  children,
  error,
  nothingToDisplay,
}: PropsWithChildren<ManageAPIStateProps>) => {
  const intl = useIntl();

  let content = (
    <Box margin={{ top: 'medium' }} align="center" justify="center" gap="small">
      <ContentsIcon width={60} height={60} />
      <Text weight="bold">
        {typeof nothingToDisplay === 'string'
          ? nothingToDisplay
          : intl.formatMessage(messages.NoThing)}
      </Text>
    </Box>
  );

  if (nothingToDisplay && typeof nothingToDisplay !== 'string') {
    content = nothingToDisplay;
  }

  if (isError) {
    if (error && typeof error !== 'string') {
      content = error;
    } else {
      content = (
        <BoxError
          message={
            typeof error === 'string'
              ? error
              : intl.formatMessage(messages.Error)
          }
          className="mt-b"
        />
      );
    }
  } else if (isLoading) {
    content = <BoxLoader />;
  } else if (hasResult) {
    content = <Fragment>{children}</Fragment>;
  }

  return content;
};

export default ManageAPIState;
