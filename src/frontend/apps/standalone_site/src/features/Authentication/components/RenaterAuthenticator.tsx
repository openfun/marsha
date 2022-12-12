import { Select } from 'grommet';
import React, { useEffect } from 'react';

import {
  getRenaterFerIdpList,
  RenaterSamlFerIdp,
} from '../api/getRenaterFerIdpList';

export const RenaterAuthenticator = () => {
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
    <Select
      size="medium"
      placeholder="Select single option"
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
  );
};
