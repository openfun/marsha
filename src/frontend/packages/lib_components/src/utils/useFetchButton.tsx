import { Button } from '@openfun/cunningham-react';
import React, {
  ComponentPropsWithRef,
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { Box, BoxLoader } from '..';

type ButtonProps = ComponentPropsWithRef<typeof Button>;

const messages = defineMessages({
  defaultErrorMessage: {
    defaultMessage: 'An error occurred, please try again later.',
    description:
      'Default error toasted on user input error while performing the async action.',
    id: 'components.useFetchButton.defaultErrorMessage',
  },
});

type Status =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'error'; error: unknown };

type ErrorCallback = string | ((error: unknown) => string);

interface FetchButtonProps extends Omit<ButtonProps, 'children'> {
  label: string;
}

export const useFetchButton = (
  errorMessage?: ErrorCallback,
): [
  Status,
  Dispatch<SetStateAction<Status>>,
  (data: FetchButtonProps) => JSX.Element,
] => {
  const intl = useIntl();
  const [state, setState] = useState<Status>({ type: 'idle' });
  const memoButton = useCallback(
    ({ label, ...props }: FetchButtonProps) => (
      <Button
        disabled={state.type === 'loading'}
        fullWidth
        onClick={() => {
          setState({ type: 'loading' });
        }}
        {...props}
      >
        <Box direction="row" align="center">
          {label}
          {state.type === 'loading' && (
            <BoxLoader
              whiteBackground
              size="small"
              boxProps={{
                margin: { left: 'small' },
              }}
            />
          )}
        </Box>
      </Button>
    ),
    [state],
  );

  useEffect(() => {
    if (state.type !== 'error') {
      return;
    }

    let message;
    if (errorMessage && typeof errorMessage === 'string') {
      message = errorMessage;
    } else if (errorMessage && typeof errorMessage === 'function') {
      message = errorMessage(state.error);
    } else {
      message = intl.formatMessage(messages.defaultErrorMessage);
    }
    toast.error(message);
    setState({ type: 'idle' });
  }, [state, intl, errorMessage]);

  return [state, setState, memoButton];
};
