import { flushAllPromises } from '../../testSetup';

import { shallow, ShallowWrapper } from 'enzyme';
import * as React from 'react';

jest.mock(
  '../../data/sideEffects/createTimedTextTrack/createTimedTextTrack',
  () => ({
    createTimedTextTrack: jest.fn(),
  }),
);

import { createTimedTextTrack } from '../../data/sideEffects/createTimedTextTrack/createTimedTextTrack';
import { modelName } from '../../types/models';
import { timedTextMode } from '../../types/tracks';
import { UPLOAD_FORM_ROUTE } from '../UploadForm/route';
import { TimedTextCreationForm } from './TimedTextCreationForm';

const mockCreateTimedTextTrack: jest.Mock<
  typeof createTimedTextTrack
> = createTimedTextTrack as any;

const mockCreateTimedTextTrackRecord = jest.fn();

describe('<TimedTextCreationForm />', () => {
  afterEach(jest.resetAllMocks);

  it('renders and loads the language choices', async () => {
    const wrapper = shallow(
      <TimedTextCreationForm
        getTimedTextTrackLanguageChoices={jest.fn()}
        languageChoices={[
          { label: 'English', value: 'en' },
          { label: 'French', value: 'fr' },
        ]}
        createTimedTextTrack={mockCreateTimedTextTrackRecord}
        jwt={'some token'}
        mode={timedTextMode.SUBTITLE}
      />,
    );

    await flushAllPromises();

    expect(wrapper.html()).toContain('Add a language');
  });

  describe('createAndGoToUpload()', () => {
    let instance: TimedTextCreationForm;
    let wrapper: ShallowWrapper;

    beforeEach(() => {
      wrapper = shallow(
        <TimedTextCreationForm
          getTimedTextTrackLanguageChoices={jest.fn()}
          languageChoices={[
            { label: 'English', value: 'en' },
            { label: 'French', value: 'fr' },
          ]}
          createTimedTextTrack={mockCreateTimedTextTrackRecord}
          jwt={'some token'}
          mode={timedTextMode.SUBTITLE}
        />,
      );
      instance = wrapper.instance() as TimedTextCreationForm;
    });

    it('creates a timedtexttrack, adds it to store and retirects to the upload form', async () => {
      mockCreateTimedTextTrack.mockResolvedValue({ id: '42' });

      instance.setState({ newTTLanguage: 'fr' });
      await instance.createAndGoToUpload();

      expect(mockCreateTimedTextTrack).toHaveBeenCalledWith(
        'some token',
        'fr',
        timedTextMode.SUBTITLE,
      );
      expect(mockCreateTimedTextTrackRecord).toHaveBeenCalledWith({ id: '42' });
      expect(wrapper.name()).toEqual('Redirect');
      expect(wrapper.prop('push')).toBeTruthy();
      expect(wrapper.prop('to')).toEqual(
        UPLOAD_FORM_ROUTE(modelName.TIMEDTEXTTRACKS, '42'),
      );
    });

    it('shows an error message when it fails to create a timedtexttrack', async () => {
      mockCreateTimedTextTrack.mockRejectedValue(
        new Error('Failed to create a timedtexttrack.'),
      );

      instance.setState({ newTTLanguage: 'en' });
      await instance.createAndGoToUpload();

      expect(mockCreateTimedTextTrack).toHaveBeenCalledWith(
        'some token',
        'en',
        timedTextMode.SUBTITLE,
      );
      expect(mockCreateTimedTextTrackRecord).not.toHaveBeenCalled();
      expect(wrapper.html()).toContain(
        'There was an error during track creation.',
      );
    });
  });
});
