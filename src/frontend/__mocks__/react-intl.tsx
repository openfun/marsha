import * as React from 'react';
import { FormattedMessage, Messages } from 'react-intl';

const Intl: any = jest.genMockFromModule('react-intl');

// Make a defineMessage implementation that just returns the messages (so they can be reused at the call site)
Intl.defineMessages.mockImplementation((messages: Messages) => messages);

// intl context that will be injected into components by injectIntl
const intl = {
  formatMessage: ({ defaultMessage }: { defaultMessage: string }) =>
    defaultMessage,
};

// Patch injectIntl to do the context injecting
Intl.injectIntl = (Node: any) => {
  const renderWrapped: any = (props: any) => <Node {...props} intl={intl} />;
  renderWrapped.displayName = Node.displayName || Node.name || 'Component';
  return renderWrapped;
};

// Patch FormattedMessage to just spit out the default message
Intl.FormattedMessage = (props: FormattedMessage.Props) => props.defaultMessage;

module.exports = Intl;
