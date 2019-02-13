import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import { TranscriptReaderConnected } from '../TranscriptReaderConnected/TranscriptReaderConnected';
import { Transcripts } from './Transcripts';

const transcripts = [
  {
    id: '1',
    language: 'fr',
    url: 'https://example.com/vtt/fr.vtt',
  },
  {
    id: '2',
    language: 'en',
    url: 'https://example.com/vtt/en.vtt',
  },
] as any;

const languageChoices = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
];

describe('<Transcripts />', () => {
  afterEach(jest.resetAllMocks);

  it('displays a list of available transcripts', async () => {
    const wrapper = shallow(
      <Transcripts
        languageChoices={languageChoices}
        getTimedTextTrackLanguageChoices={jest.fn()}
        transcripts={transcripts}
        jwt="foo"
      />,
    );

    const options = wrapper.find('select').find('option');

    expect(
      wrapper
        .find('select')
        .find(FormattedMessage)
        .exists(),
    ).toEqual(true);
    expect(options.at(0).html()).toEqual('<option value="1">French</option>');
    expect(options.at(1).html()).toEqual('<option value="2">English</option>');

    expect(wrapper.find(TranscriptReaderConnected).exists()).toEqual(false);
  });

  it('render <TranscriptReaderConnected /> when a transcript is selected', async () => {
    const wrapper = shallow(
      <Transcripts
        languageChoices={languageChoices}
        getTimedTextTrackLanguageChoices={jest.fn()}
        transcripts={transcripts}
        jwt="foo"
      />,
    );

    wrapper.setState({
      selectedTranscript: transcripts[0],
    });

    expect(wrapper.find(TranscriptReaderConnected).exists()).toEqual(true);
  });
});
