import { colorsTokens } from '@lib-common/cunningham';
import { Switch } from '@openfun/cunningham-react';
import { SettingsOption } from 'grommet-icons';
import {
  Box,
  DropButton,
  MarkdownDocumentRenderingOptions,
} from 'lib-components';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  settings: {
    defaultMessage: 'Settings',
    description: 'Accessibility text for settings menu in markdown editor',
    id: 'component.MarkdownEditor.settings',
  },
  mdxEnabled: {
    defaultMessage: 'MDX enabled',
    description: 'Button to toggle MDX rendering option when MDX is enabled',
    id: 'component.MarkdownEditor.mdxEnabled',
  },
  mdxDisabled: {
    defaultMessage: 'MDX disabled',
    description: 'Button to toggle MDX rendering option when MDX is disabled',
    id: 'component.MarkdownEditor.mdxDisabled',
  },
  mathjaxEnabled: {
    defaultMessage: 'Mathjax enabled',
    description:
      'Button to toggle MDX rendering option when Mathjax is enabled',
    id: 'component.MarkdownEditor.mathjaxEnabled',
  },
  mathjaxDisabled: {
    defaultMessage: 'Mathjax disabled',
    description:
      'Button to toggle MDX rendering option when Mathjax is disabled',
    id: 'component.MarkdownEditor.mathjaxDisabled',
  },
});

interface ToggleCheckBoxProps {
  optionName: keyof MarkdownDocumentRenderingOptions;
  renderingOptions: MarkdownDocumentRenderingOptions;
  setRenderingOptions: (
    newRenderingOptions: MarkdownDocumentRenderingOptions,
  ) => void;
  enabledLabel: string;
  disabledLabel: string;
}

const ToggleCheckBox = (props: ToggleCheckBoxProps) => {
  return (
    <Box pad="small">
      <Switch
        checked={props.renderingOptions[props.optionName] || false}
        onChange={(event) => {
          const options = { ...props.renderingOptions };
          options[props.optionName] = event.target.checked;
          props.setRenderingOptions(options);
        }}
        label={
          props.renderingOptions[props.optionName]
            ? props.enabledLabel
            : props.disabledLabel
        }
        labelSide="right"
      />
    </Box>
  );
};

type MdxRenderingOptionsSelectorProps = {
  renderingOptions: MarkdownDocumentRenderingOptions;
  setRenderingOptions: (
    newRenderingOptions: MarkdownDocumentRenderingOptions,
  ) => void;
};

export const MdxRenderingOptionsSelector = ({
  renderingOptions,
  setRenderingOptions,
}: MdxRenderingOptionsSelectorProps) => {
  const intl = useIntl();

  return (
    <DropButton
      containerProps={{ justify: 'center' }}
      pad={{ vertical: 'xsmall' }}
      button={
        <SettingsOption
          a11yTitle={intl.formatMessage(messages.settings)}
          color={colorsTokens['primary-500']}
        />
      }
    >
      <Box>
        <ToggleCheckBox
          optionName="useMdx"
          enabledLabel={intl.formatMessage(messages.mdxEnabled)}
          disabledLabel={intl.formatMessage(messages.mdxDisabled)}
          renderingOptions={renderingOptions}
          setRenderingOptions={setRenderingOptions}
        />
        <ToggleCheckBox
          optionName="useMathjax"
          enabledLabel={intl.formatMessage(messages.mathjaxEnabled)}
          disabledLabel={intl.formatMessage(messages.mathjaxDisabled)}
          renderingOptions={renderingOptions}
          setRenderingOptions={setRenderingOptions}
        />
      </Box>
    </DropButton>
  );
};
