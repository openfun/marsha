import '../../testSetup';

import { shallow } from 'enzyme';
import { Text } from 'grommet';
import * as React from 'react';
import { VTTCue } from 'vtt.js';

import { ActiveSentence, TranscriptSentence } from './TranscriptSentence';

describe('<TranscriptSentence />', () => {
  it('display a simple <Text /> when not active', () => {
    const cue: VTTCue = {
      endTime: 1,
      id: 'e67ba62e-ec93-4e04-a8da-bdaed3655262',
      startTime: 0,
      text: 'Lorem ipsum dolor sit amet.',
    };

    const wrapper = shallow(<TranscriptSentence cue={cue} active={false} />);

    expect(wrapper.equals(<Text>Lorem ipsum dolor sit amet. </Text>)).toBe(
      true,
    );
  });

  it('display a <ActiveSentence /> when active', () => {
    const cue: VTTCue = {
      endTime: 1,
      id: 'e67ba62e-ec93-4e04-a8da-bdaed3655262',
      startTime: 0,
      text: 'Lorem ipsum dolor sit amet.',
    };

    const wrapper = shallow(<TranscriptSentence cue={cue} active={true} />);

    expect(
      wrapper.equals(
        <ActiveSentence>Lorem ipsum dolor sit amet. </ActiveSentence>,
      ),
    ).toBe(true);
  });
});
