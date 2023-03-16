/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Box, Text, Tip } from 'grommet';
import { Maybe, Nullable } from 'lib-common';
import {
  AnonymousUser,
  checkLtiToken,
  decodeJwt,
  QuestionMarkSVG,
  useCurrentUser,
  useJwt,
  LiveSession,
} from 'lib-components';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { setLiveSessionDisplayName } from '@lib-video/api/setLiveSessionDisplayName';
import {
  ANONYMOUS_ID_PREFIX,
  NICKNAME_MIN_LENGTH,
  NICKNAME_MAX_LENGTH,
} from '@lib-video/conf/chat';
import { useCurrentLive } from '@lib-video/hooks/useCurrentVideo';
import { useLiveSession } from '@lib-video/hooks/useLiveSession';
import { isAnonymous } from '@lib-video/utils/chat/chat';
import { getAnonymousId } from '@lib-video/utils/localstorage';
import { converse } from '@lib-video/utils/window';

import { InputBar } from '../Chat/InputBar';

import { InputDisplayNameIncorrectAlert } from './InputDisplayNameIncorrectAlert';

const messages = defineMessages({
  closeButtonTitle: {
    defaultMessage: 'Click this button to close the overlay.',
    description: 'A title describing the close button action',
    id: 'components.InputDiplayNameOverlay.closeButtonTitle',
  },
  inputAnonymousKeywordForbiddenAlertMessage: {
    defaultMessage: 'Keyword "{forbiddenPrefix}" is not allowed.',
    description:
      'An alert message explaining why the entered display name is invalid.',
    id: 'components.InputDisplayName.inputAnonymousKeywordForbiddenAlertMessage',
  },
  inputDisplayNameInformative: {
    defaultMessage:
      "The display name is the pseudonym you will be authenticated with on this live. You won't be able to change it during the live. Other participants will see you with this name. The instructor will however be able to see your genuine identity if you have previously identified yourself with the LTI.",
    description:
      'An informative text about the display name which is asked to enter.',
    id: 'components.InputDisplayName.inputDisplayNameInformative',
  },
  inputDisplayNameLabel: {
    defaultMessage: 'Display name',
    description: 'An label describing the input below.',
    id: 'components.InputDisplayName.inputDisplayNameLabel',
  },
  inputDisplayNamePlaceholder: {
    defaultMessage: 'Enter your desired display name...',
    description: 'The input bar to fill your display name.',
    id: 'components.InputBar.inputDisplayNamePlaceholder',
  },
  inputTooShortAlertMessage: {
    defaultMessage: 'Min length is {minLength} characters.',
    description:
      'An alert message explaining why the entered display name is invalid.',
    id: 'components.InputDisplayName.inputTooShortAlertMessage',
  },
  inputTooLongAlertMessage: {
    defaultMessage: 'Max length is {maxLength} characters.',
    description:
      'An alert message explaining why the entered display name is invalid.',
    id: 'components.InputDisplayName.inputTooLongAlertMessage',
  },
  inputXmppError: {
    defaultMessage: 'Impossible to connect you to the chat. Please retry.',
    description: 'An alert message saying that the user cannot be connected.',
    id: 'components.InputDisplayName.inputXmppError',
  },
  inputXmppTimeout: {
    defaultMessage: 'The server took too long to respond. Please retry.',
    description:
      'An alert message saying that the servers answer to the nickname change request took too much time.',
    id: 'components.InputDisplayName.inputXmppTimeout',
  },
  inputNicknameAlreadyExists: {
    defaultMessage:
      'Your nickname is already used in the chat. Please choose another one.',
    description:
      "An alert message saying that the user can't select the entered nickname because someone is already using it in the chat.",
    id: 'components.InputDisplayName.inputNicknameAlreadyExists',
  },
});

interface InputDisplayNameProps {
  onSuccess?: () => void;
}

export const InputDisplayName = ({ onSuccess }: InputDisplayNameProps) => {
  const intl = useIntl();
  const jwt = useJwt((state) => state.getJwt());
  const user = useCurrentUser((state) => state.currentUser);
  const live = useCurrentLive();
  const [alertsState, setAlertsState] = useState<string[]>([]);
  const [isWaiting, setIsWaiting] = useState(false);
  const { liveSession, setLiveSession } = useLiveSession((state) => ({
    liveSession: state.liveSession,
    setLiveSession: state.setLiveSession,
  }));
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const processDisplayName = useCallback(
    async (displayName: string) => {
      displayName = displayName.trim();
      setAlertsState([]);
      setIsWaiting(true);

      const callbackSuccess = (updatedLiveSession: LiveSession) => {
        return () => {
          if (!isMounted.current) {
            return;
          }

          setLiveSession(updatedLiveSession);
          setIsWaiting(false);
          if (onSuccess) {
            onSuccess();
          }
        };
      };

      const callbackXmppError = (stanza: Nullable<HTMLElement>) => {
        if (!isMounted.current) {
          return;
        }

        const xmppAlerts = [];
        if (stanza) {
          const errorItem = stanza.getElementsByTagName('error')[0];
          if (errorItem && errorItem.getAttribute('code') === '409') {
            xmppAlerts.push(
              intl.formatMessage(messages.inputNicknameAlreadyExists),
            );
          } else {
            xmppAlerts.push(intl.formatMessage(messages.inputXmppError));
          }
        } else {
          xmppAlerts.push(intl.formatMessage(messages.inputXmppTimeout));
        }

        setAlertsState(xmppAlerts);
        setIsWaiting(false);
      };

      const manageSetDisplayNameError = (error: string | number) => {
        if (!isMounted.current) {
          return;
        }

        const errors = [];
        if (error === 409) {
          errors.push(intl.formatMessage(messages.inputNicknameAlreadyExists));
        } else {
          errors.push(intl.formatMessage(messages.inputXmppError));
        }
        setAlertsState(errors);
        setIsWaiting(false);
      };

      const alerts: string[] = [];
      if (isAnonymous(displayName)) {
        alerts.push(
          intl.formatMessage(
            messages.inputAnonymousKeywordForbiddenAlertMessage,
            { forbiddenPrefix: ANONYMOUS_ID_PREFIX },
          ),
        );
      }
      if (displayName.length < NICKNAME_MIN_LENGTH) {
        alerts.push(
          intl.formatMessage(messages.inputTooShortAlertMessage, {
            minLength: NICKNAME_MIN_LENGTH,
          }),
        );
      }
      if (displayName.length > NICKNAME_MAX_LENGTH) {
        alerts.push(
          intl.formatMessage(messages.inputTooLongAlertMessage, {
            maxLength: NICKNAME_MAX_LENGTH,
          }),
        );
      }
      if (alerts.length === 0) {
        let anonymousId: Maybe<string>;
        if (!checkLtiToken(decodeJwt(jwt))) {
          anonymousId = getAnonymousId();
        }
        const response = await setLiveSessionDisplayName(
          live.id,
          displayName,
          anonymousId,
        );
        if (response.error) {
          manageSetDisplayNameError(response.error);
          return false;
        } else if (response.success) {
          converse.claimNewNicknameInChatRoom(
            displayName,
            callbackSuccess(response.success),
            callbackXmppError,
          );
          return true;
        } else {
          return false;
        }
      } else {
        setAlertsState(alerts);
        setIsWaiting(false);
        return false;
      }
    },
    [intl, jwt, onSuccess, setLiveSession, live.id],
  );

  return (
    <Box
      margin={{
        bottom: 'medium',
        horizontal: 'medium',
        top: 'small',
      }}
      pad="3px"
    >
      <Box background="bg-marsha" gap="8px" pad="12px" round="6px">
        <Box direction="row">
          <Text
            margin={{
              right: '5px',
            }}
            size="0.875rem"
          >
            {intl.formatMessage(messages.inputDisplayNameLabel)}
          </Text>
          <Box>
            <Tip
              content={
                <Box background="white" pad="2px" round="6px" width="150px">
                  <Text size="0.625rem">
                    {intl.formatMessage(messages.inputDisplayNameInformative)}
                  </Text>
                </Box>
              }
              plain
            >
              <Box>
                <QuestionMarkSVG
                  containerStyle={{
                    height: '15px',
                    width: '15px',
                  }}
                  iconColor="blue-focus"
                />
              </Box>
            </Tip>
          </Box>
        </Box>
        <InputBar
          defaultValue={
            liveSession?.username ||
            (user !== AnonymousUser.ANONYMOUS && user?.username) ||
            ''
          }
          handleUserInput={processDisplayName}
          isChatInput={false}
          isWaiting={isWaiting}
          placeholderText={intl.formatMessage(
            messages.inputDisplayNamePlaceholder,
          )}
        />
      </Box>
      <Box>
        {alertsState.map((msg, index) => (
          <InputDisplayNameIncorrectAlert alertMsg={msg} key={index} />
        ))}
      </Box>
    </Box>
  );
};
