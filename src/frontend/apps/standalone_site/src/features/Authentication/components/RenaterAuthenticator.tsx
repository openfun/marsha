import { Box, FormField, Select, Text } from 'grommet';
import React, { useEffect } from 'react';
import { useIntl, defineMessages } from 'react-intl';

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
  const [optionsDefault, setOptionsDefault] = React.useState<
    RenaterSamlFerIdp[]
  >([]);
  const [options, setOptions] = React.useState<RenaterSamlFerIdp[]>([]);

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

  return (
    <Box
      background="bg-select"
      pad={{ horizontal: 'large', top: 'medium', bottom: 'large' }}
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
          <Text size="small" textAlign="center" weight="bold">
            {intl.formatMessage(messages.textConnectWith)}
          </Text>
        </Box>
        <Box background="blue-active" height="1px" width="100%" />
      </Box>
      <FormField
        label={intl.formatMessage(messages.labelSelectRenater)}
        htmlFor="select-renater-id"
        name="renater"
      >
        <Select
          id="select-renater-id"
          name="renater"
          size="medium"
          labelKey="display_name"
          options={options}
          onChange={({ option }: { option: RenaterSamlFerIdp }) => {
            window.location.replace(option.login_url);
          }}
          onSearch={(text) => {
            // The line below escapes regular expression special characters:
            // [ \ ^ $ . | ? * + ( )
            const escapedText = text.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');

            // Create the regular expression with modified value which
            // handles escaping special characters. Without escaping special
            // characters, errors will appear in the console
            const exp = new RegExp(escapedText, 'i');
            setOptions(optionsDefault.filter((o) => exp.test(o.display_name))); // defaultOptions
          }}
        />
      </FormField>
    </Box>
  );
};
