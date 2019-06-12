import '../../testSetup';

import { shallow } from 'enzyme';
import React from 'react';
import { defineMessages } from 'react-intl';

import { TimedText, timedTextMode } from '../../types/tracks';
import { TimedTextListItem } from '../TimedTextListItem';
import { DashboardTimedTextManager } from './DashboardTimedTextManager';

describe('<DashboardTimedTextManager />', () => {
  it('renders the message & tracks it is passed', () => {
    const message = defineMessages({
      key: {
        defaultMessage: 'Our title',
        description: '',
        id: 'message.key',
      },
    });

    const tracks = [
      {
        id: '42',
        language: 'fr',
        mode: timedTextMode.TRANSCRIPT,
      } as TimedText,
      {
        id: '43',
        language: 'en',
        mode: timedTextMode.TRANSCRIPT,
      } as TimedText,
    ];

    const wrapper = shallow(
      <DashboardTimedTextManager
        message={message.key}
        mode={timedTextMode.TRANSCRIPT}
        tracks={tracks}
      />,
    );

    expect(
      wrapper
        .dive()
        .childAt(0)
        .html(),
    ).toContain('Our title');
    expect(wrapper.find(TimedTextListItem).length).toEqual(2);
  });
});
