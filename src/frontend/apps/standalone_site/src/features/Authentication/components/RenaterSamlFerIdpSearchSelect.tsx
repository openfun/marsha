import { Box, Select } from 'grommet';
import { Nullable } from 'lib-common';
import { Loader } from 'lib-components';
import React from 'react';

import {
  getRenaterFerIdpList,
  RenaterSamlFerIdp,
} from '../api/getRenaterFerIdpList';

const renderOption = (option: RenaterSamlFerIdp) => (
  <Box pad="small">{option.display_name}</Box>
);

export const RenaterSamlFerIdpSearchSelect = () => {
  const [options, setOptions] = React.useState([] as RenaterSamlFerIdp[]);
  const [value, setValue] = React.useState(null as Nullable<RenaterSamlFerIdp>);

  if (options.length === 0) {
    getRenaterFerIdpList().then((results) => setOptions(results));
    return <Loader />;
  }

  return (
    <Select
      size="medium"
      placeholder="Select single option"
      value={value ? renderOption(value) : ''}
      options={options}
      onChange={({ option }: { option: RenaterSamlFerIdp }) => {
        setValue(option);
        window.location.replace(option.login_url);
      }}
      //onClose={() => setOptions(options)} // defaultOptions
      onSearch={(text) => {
        // The line below escapes regular expression special characters:
        // [ \ ^ $ . | ? * + ( )
        const escapedText = text.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');

        // Create the regular expression with modified value which
        // handles escaping special characters. Without escaping special
        // characters, errors will appear in the console
        const exp = new RegExp(escapedText, 'i');
        setOptions(options.filter((o) => exp.test(o.display_name))); // defaultOptions
      }}
    >
      {renderOption}
    </Select>
  );
};
