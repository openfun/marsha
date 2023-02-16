import { CheckBox, DropButton, Form } from 'grommet';
import { CheckBoxExtendedProps } from 'grommet/components/CheckBox';
import { SettingsOption } from 'grommet-icons';
import { MarkdownDocumentRenderingOptions } from 'lib-components';
import React from 'react';
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

interface ToggleCheckBoxProps extends CheckBoxExtendedProps {
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
    <CheckBox
      toggle
      checked={props.renderingOptions[props.optionName]}
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
      pad="small"
      {...props}
    />
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
      a11yTitle={intl.formatMessage(messages.settings)}
      icon={<SettingsOption />}
      dropAlign={{ top: 'bottom', left: 'left' }}
      style={{ borderColor: 'transparent' }}
      dropContent={
        <Form>
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
        </Form>
      }
    />
  );
};
