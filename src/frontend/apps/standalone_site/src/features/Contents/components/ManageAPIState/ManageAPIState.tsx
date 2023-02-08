import { Text, Box } from 'grommet';
import { Alert } from 'grommet-icons';
import { Fragment, PropsWithChildren, ReactElement, ReactNode } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { ReactComponent as ContentsIcon } from 'assets/svg/iko_webinairesvg.svg';
import { ContentSpinner } from 'components/Spinner';

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

const ContainerInfo = ({ children }: PropsWithChildren<ReactNode>) => {
  return (
    <Box
      direction="row"
      align="center"
      justify="center"
      margin={{ top: 'medium' }}
      gap="small"
    >
      {children}
    </Box>
  );
};

interface ManageAPIStateProps {
  isLoading: boolean;
  isError: boolean;
  itemsLength: number;
  nothingToDisplay?: ReactElement | string;
}

const ManageAPIState = ({
  isLoading,
  isError,
  itemsLength,
  children,
  nothingToDisplay,
}: PropsWithChildren<ManageAPIStateProps>) => {
  const intl = useIntl();

  let content = (
    <ContainerInfo>
      <ContentsIcon width={80} height={80} />
      <Text weight="bold">
        {typeof nothingToDisplay === 'string'
          ? nothingToDisplay
          : intl.formatMessage(messages.NoThing)}
      </Text>
    </ContainerInfo>
  );

  if (nothingToDisplay && typeof nothingToDisplay !== 'string') {
    content = nothingToDisplay;
  }

  if (isError) {
    content = (
      <ContainerInfo>
        <Alert size="large" color="#df8c00" />
        <Text weight="bold">{intl.formatMessage(messages.Error)}</Text>
      </ContainerInfo>
    );
  } else if (isLoading) {
    content = <ContentSpinner />;
  } else if (itemsLength) {
    content = <Fragment>{children}</Fragment>;
  }

  return content;
};

export default ManageAPIState;
