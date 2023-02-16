import { Tab, Tabs, ThemeContext } from 'grommet';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

export enum ScreenDisposition {
  editor = 0,
  rendering = 1,
}

const messages = defineMessages({
  editor: {
    defaultMessage: 'Markdown',
    description: 'Navigation bar, tab to display editor',
    id: 'component.ScreenDispositionSelector.editor',
  },
  rendering: {
    defaultMessage: 'Preview',
    description: 'Navigation bar, tab to display rendering',
    id: 'component.ScreenDispositionSelector.rendering',
  },
});

type ScreenDispositionSelectorProps = {
  screenDisposition: ScreenDisposition;
  setScreenDisposition: (newDisposition: ScreenDisposition) => void;
};

export const ScreenDispositionSelector = ({
  screenDisposition,
  setScreenDisposition,
}: ScreenDispositionSelectorProps) => {
  const intl = useIntl();
  const extendedTheme = {
    tab: {
      extend: 'text-transform: uppercase;',
      margin: 'none',
      border: {
        color: 'white',
        size: 'medium',
      },
      active: {
        border: {
          size: 'medium',
        },
      },
    },
  };

  return (
    <ThemeContext.Extend value={extendedTheme}>
      <Tabs activeIndex={screenDisposition}>
        <Tab
          title={intl.formatMessage(messages.editor)}
          onClick={() => {
            setScreenDisposition(ScreenDisposition.editor);
          }}
        />
        <Tab
          title={intl.formatMessage(messages.rendering)}
          onClick={() => {
            setScreenDisposition(ScreenDisposition.rendering);
          }}
        />
      </Tabs>
    </ThemeContext.Extend>
  );
};
