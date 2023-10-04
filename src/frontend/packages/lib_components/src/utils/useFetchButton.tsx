import { Box, Button, ButtonProps } from 'grommet';
import React, {
  CSSProperties,
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { BoxLoader } from '..';

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

interface FetchButtonProps extends Omit<ButtonProps, 'label' | 'children'> {
  label: string;
  style?: CSSProperties;
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
    ({ label, style, ...props }: FetchButtonProps) => (
      <Button
        disabled={state.type === 'loading'}
        primary
        label={
          <Box>
            <Box
              direction="row"
              flex
              margin="auto"
              style={{ whiteSpace: 'nowrap' }}
              align="center"
            >
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
          </Box>
        }
        onClick={() => {
          setState({ type: 'loading' });
        }}
        style={style}
        {...props}
      />
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
