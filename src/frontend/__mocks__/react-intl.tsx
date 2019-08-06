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
Intl.FormattedMessage = (props: FormattedMessage.Props) => {
  if (props.values && props.defaultMessage) {
    const keys = Object.keys(props.values);
    return keys.reduce((message, key) => {
      return message.replace(`{${key}}`, props.values![key] as any);
    }, props.defaultMessage);
  }

  return props.defaultMessage;
};

module.exports = Intl;
