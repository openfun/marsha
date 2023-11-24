import { Select } from '@openfun/cunningham-react';
import { Breakpoints } from 'lib-common';
import { Box, Text, useResponsive } from 'lib-components';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { REACT_LOCALES } from '../conf';
import { useLanguageStore } from '../store/languageStore';
import { getLanguageFromLocale } from '../utils';

const SelectStyled = styled(Select)<{ $isSmall: boolean }>`
  flex-shrink: 0;

  .c__select__wrapper .labelled-box .labelled-box__children {
    padding-right: 2rem;

    .c_select__render .typo-text {
      ${({ $isSmall }) => $isSmall && `display: none;`}
    }
  }
  .c__select__menu {
    border-radius: 4px;

    .icon-language {
      display: none;
    }
  }
`;

const messages = defineMessages({
  ariaTitleLanguagePicker: {
    defaultMessage: 'Language Picker',
    description: 'Aria title for the language picker',
    id: 'features.Language.components.LanguagePicker.ariaTitleLanguagePicker',
  },
});

const optionsPicker = REACT_LOCALES.map((reactLocale) => {
  const locale = reactLocale.replace('_', '-');

  return {
    value: locale,
    label: getLanguageFromLocale(locale),
    render: () => (
      <Box
        className="c_select__render"
        direction="row"
        gap="small"
        align="center"
      >
        <span className="material-icons icon-language">language</span>
        <Text>{getLanguageFromLocale(locale)}</Text>
      </Box>
    ),
  };
});

const LanguagePicker = () => {
  const intl = useIntl();
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const { breakpoint, isSmallerBreakpoint } = useResponsive();

  return (
    <SelectStyled
      defaultValue={intl.locale}
      options={optionsPicker}
      label={intl.formatMessage(messages.ariaTitleLanguagePicker)}
      showLabelWhenSelected={false}
      clearable={false}
      hideLabel
      className="c_select__no_border c_select__no_bg"
      onChange={({ target: { value } }) => setLanguage(value as string)}
      $isSmall={isSmallerBreakpoint(breakpoint, Breakpoints.small)}
    />
  );
};

export default LanguagePicker;
