import { Anchor, Nav, Tip } from 'grommet';
import { DocumentImage, DocumentText, Split } from 'grommet-icons';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

export enum ScreenDisposition {
  editorOnly = 1,
  splitScreen = 2,
  renderingOnly = 3,
}

const messages = defineMessages({
  editorOnly: {
    defaultMessage: 'Editor only',
    description: 'Navigation bar, icon to display editor only',
    id: 'component.ScreenDispositionSelector.editorOnly',
  },
  splitScreen: {
    defaultMessage: 'Split screen',
    description: 'Navigation bar, icon to display both editor and rendering',
    id: 'component.ScreenDispositionSelector.splitScreen',
  },
  renderingOnly: {
    defaultMessage: 'Rendering only',
    description: 'Navigation bar, icon to display rendering only',
    id: 'component.ScreenDispositionSelector.renderingOnly',
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

  return (
    <Nav direction="row" pad="none" gap="none">
      <Tip content={intl.formatMessage(messages.editorOnly)}>
        <Anchor
          a11yTitle={intl.formatMessage(messages.editorOnly)}
          icon={<DocumentText />}
          onClick={() => {
            setScreenDisposition(ScreenDisposition.editorOnly);
          }}
          color={
            screenDisposition === ScreenDisposition.editorOnly
              ? 'status-ok'
              : 'brand'
          }
          data-testid="disposition-editor-only"
        />
      </Tip>
      <Tip content={intl.formatMessage(messages.splitScreen)}>
        <Anchor
          a11yTitle={intl.formatMessage(messages.splitScreen)}
          icon={<Split />}
          onClick={() => {
            setScreenDisposition(ScreenDisposition.splitScreen);
          }}
          color={
            screenDisposition === ScreenDisposition.splitScreen
              ? 'status-ok'
              : 'brand'
          }
          data-testid="disposition-split-screen"
        />
      </Tip>
      <Tip content={intl.formatMessage(messages.renderingOnly)}>
        <Anchor
          a11yTitle={intl.formatMessage(messages.renderingOnly)}
          icon={<DocumentImage />}
          onClick={() => {
            setScreenDisposition(ScreenDisposition.renderingOnly);
          }}
          color={
            screenDisposition === ScreenDisposition.renderingOnly
              ? 'status-ok'
              : 'brand'
          }
          data-testid="disposition-rendering-only"
        />
      </Tip>
    </Nav>
  );
};
