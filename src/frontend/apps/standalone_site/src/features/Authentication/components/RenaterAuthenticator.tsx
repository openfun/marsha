import { Box, FormField, Image, Select, Text, ThemeContext } from 'grommet';
import React, { useEffect, useRef, useState } from 'react';
import { useIntl, defineMessages } from 'react-intl';

import { useResponsive } from 'hooks/useResponsive';

import {
  getRenaterFerIdpList,
  RenaterSamlFerIdp,
} from '../api/getRenaterFerIdpList';

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
});

export const RenaterAuthenticator = () => {
  const intl = useIntl();
  const [optionsDefault, setOptionsDefault] = useState<RenaterSamlFerIdp[]>([]);
  const [options, setOptions] = useState<RenaterSamlFerIdp[]>([]);
  const { breakpoint, isSmallerBreakpoint } = useResponsive();
  const refSelect = useRef<HTMLInputElement>(null);
  const [selectDropWidth, setSelectDropWidth] = useState(0);
  const [selectDropPosition, setSelectDropPosition] = useState<{
    bottom?: 'bottom' | 'top';
    top?: 'bottom' | 'top';
  }>({ bottom: 'top' });

  const selectDropHeight = 400; // px

  const renderOption = (option: RenaterSamlFerIdp) => (
    <Box align="center" direction="row">
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
        setOptionsDefault(results);
        setOptions(results);
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    function handleResize() {
      setSelectDropWidth(refSelect.current?.clientWidth || 0);
      setSelectDropPosition(
        window.innerHeight - (refSelect.current?.offsetTop || 0) <
          selectDropHeight
          ? { bottom: 'top' }
          : { top: 'bottom' },
      );
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <Box
      background="bg-select"
      pad={{
        horizontal: isSmallerBreakpoint(breakpoint, 'medium')
          ? 'large'
          : 'xlarge',
        vertical: 'medium',
      }}
      round="xsmall"
    >
      <Box
        margin={{ bottom: 'medium' }}
        direction="row"
        justify="center"
        align="center"
        gap="small"
      >
        <Box background="blue-active" height="1px" width="100%" />
        <Box width="100%">
          <Text
            size={isSmallerBreakpoint(breakpoint, 'small') ? 'xsmall' : 'small'}
            textAlign="center"
            weight="bold"
          >
            {intl.formatMessage(messages.textConnectWith)}
          </Text>
        </Box>
        <Box background="blue-active" height="1px" width="100%" />
      </Box>

      <ThemeContext.Extend value={{ select: { step: options.length || 20 } }}>
        <FormField label={intl.formatMessage(messages.labelSelectRenater)}>
          <Select
            ref={refSelect}
            size="medium"
            options={options}
            onChange={({ option }: { option: RenaterSamlFerIdp }) => {
              window.location.replace(option.login_url);
            }}
            dropAlign={{ ...selectDropPosition, left: 'left' }}
            dropHeight={`${selectDropHeight}px}`}
            dropProps={{
              width: `${selectDropWidth}px`,
            }}
            onSearch={(text) => {
              // The line below escapes regular expression special characters:
              // [ \ ^ $ . | ? * + ( )
              const escapedText = text.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');

              // Create the regular expression with modified value which
              // handles escaping special characters. Without escaping special
              // characters, errors will appear in the console
              const exp = new RegExp(escapedText, 'i');
              setOptions(
                optionsDefault.filter((o) => exp.test(o.display_name)),
              ); // defaultOptions
            }}
          >
            {renderOption}
          </Select>
        </FormField>
      </ThemeContext.Extend>
    </Box>
  );
};
