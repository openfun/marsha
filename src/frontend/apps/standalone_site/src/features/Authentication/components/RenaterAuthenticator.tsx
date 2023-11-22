import { Select } from '@openfun/cunningham-react';
import { Image } from 'grommet';
import { colorsTokens } from 'lib-common';
import { Box, ClosingCard, Text, useResponsive } from 'lib-components';
import React, {
  ComponentPropsWithRef,
  Fragment,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useLocation } from 'react-router-dom';

import {
  RenaterSamlFerIdp,
  getRenaterFerIdpList,
} from '../api/getRenaterFerIdpList';

type SelectProps = ComponentPropsWithRef<typeof Select>;

const messages = defineMessages({
  textConnectWith: {
    defaultMessage: 'OR LOGIN WITH',
    description: 'Text above select box for Renater login',
    id: 'features.Authentication.components.RenaterAuthenticator.textConnectWith',
  },
  labelSelectRenater: {
    defaultMessage: 'Select single option',
    description: 'Label for select box for Renater login',
    id: 'features.Authentication.components.RenaterAuthenticator.labelSelectRenater',
  },
  errorMessage: {
    defaultMessage: 'Sorry, a problem occured. Please try again.',
    description: 'Label when error query string Renater login',
    id: 'features.Authentication.components.RenaterAuthenticator.errorMessage',
  },
});

export const RenaterAuthenticator = () => {
  const intl = useIntl();
  const [options, setOptions] = useState<SelectProps['options']>([]);
  const { breakpoint, isSmallerBreakpoint } = useResponsive();

  const { search } = useLocation();
  const [errorQuery, messageErrorQuery] = useMemo(() => {
    const searchParam = new URLSearchParams(search);
    return [searchParam.get('error'), searchParam.get('message')];
  }, [search]);
  const ERRORTOKEN = 'social-auth';

  const renderOption = (option: RenaterSamlFerIdp) => (
    <Box direction="row">
      <Image
        src={
          option.logo ||
          'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==' // 1x1 transparent gif
        }
        height="16"
        width="16"
        margin={{ right: 'small' }}
      />
      <Text size="small">{option.display_name}</Text>
    </Box>
  );

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      const signal = controller.signal;
      try {
        const results = await getRenaterFerIdpList(signal);
        setOptions(
          results.map((o) => ({
            value: o.login_url,
            label: o.display_name,
            render: () => renderOption(o),
          })),
        );
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <Box
      background={colorsTokens['primary-150']}
      pad={{
        horizontal: isSmallerBreakpoint(breakpoint, 'medium')
          ? 'small'
          : 'xlarge',
        vertical: 'small',
      }}
      round="xxsmall"
    >
      {errorQuery && errorQuery === ERRORTOKEN && (
        <ClosingCard
          message={
            <Fragment>
              <Text size="small" weight="bold" color="white">
                {intl.formatMessage(messages.errorMessage)}
              </Text>
              {messageErrorQuery && (
                <Text
                  size="small"
                  weight="bold"
                  className="mt-st"
                  color="white"
                >
                  {messageErrorQuery}
                </Text>
              )}
            </Fragment>
          }
          background={colorsTokens['danger-400']}
          width="full"
          margin={{ bottom: 'small' }}
        />
      )}
      <Box
        margin={{ bottom: 'small' }}
        direction="row"
        justify="center"
        align="center"
        gap="small"
      >
        <Box background={colorsTokens['info-500']} height="1px" width="100%" />
        <Box width="100%">
          <Text
            size={isSmallerBreakpoint(breakpoint, 'small') ? 'tiny' : 'small'}
            textAlign="center"
            weight="bold"
          >
            {intl.formatMessage(messages.textConnectWith)}
          </Text>
        </Box>
        <Box background={colorsTokens['info-500']} height="1px" width="100%" />
      </Box>
      <Select
        options={options}
        label={intl.formatMessage(messages.labelSelectRenater)}
        showLabelWhenSelected={false}
        clearable={false}
        onChange={({ target: { value } }) => {
          window.location.assign(value as string);
        }}
        searchable
      />
    </Box>
  );
};
