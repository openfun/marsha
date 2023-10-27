import { Select, ThemeContext, defaultProps } from 'grommet';
import { deepMerge } from 'grommet/utils';
import { Breakpoints, theme as themeMarsha } from 'lib-common';
import { Box, Text, useResponsive } from 'lib-components';
import { Fragment, useContext } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { css } from 'styled-components';

import { REACT_LOCALES } from '../conf';
import { useLanguageStore } from '../store/languageStore';
import { getLanguageFromLocale } from '../utils';

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
  };
});

interface OptionPicker {
  value: string;
  label: JSX.Element;
}

const LanguagePicker = () => {
  const intl = useIntl();
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const { breakpoint, isSmallerBreakpoint } = useResponsive();
  const theme = useContext(ThemeContext) || defaultProps.theme;

  const customTheme = deepMerge(theme, {
    select: {
      control: {
        extend: `
        border: none; 
        padding-block: 0.5rem;
      `,
      },
      container: {
        extend: css`
          ...${themeMarsha.select?.container?.extend};
          & {
            border: none;
          }
        `,
      },
      options: {
        container: {
          pad: 'small',
          align: 'center',
        },
      },
      icons: {
        down: undefined,
      },
    },
  });

  return (
    <Fragment>
      <ThemeContext.Extend value={customTheme}>
        <Select
          options={optionsPicker}
          labelKey="label"
          replace={false}
          valueKey={{ key: 'value', reduce: true }}
          valueLabel={(value) => {
            const label = optionsPicker.find((option) => option.value === value)
              ?.label;
            return (
              <Box direction="row" gap="small" align="center">
                <span className="material-icons">language</span>
                {!isSmallerBreakpoint(breakpoint, Breakpoints.small) && (
                  <Text>{label}</Text>
                )}
              </Box>
            );
          }}
          defaultValue={intl.locale}
          onChange={({ option }: { option: OptionPicker }) =>
            setLanguage(option.value)
          }
          a11yTitle={intl.formatMessage(messages.ariaTitleLanguagePicker)}
        />
      </ThemeContext.Extend>
    </Fragment>
  );
};

export default LanguagePicker;
