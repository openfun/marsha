import { flushAllPromises } from '../../testSetup';

import { shallow, ShallowWrapper } from 'enzyme';
import * as React from 'react';

jest.mock(
  '../../data/sideEffects/createTimedTextTrack/createTimedTextTrack',
  () => ({
    createTimedTextTrack: jest.fn(),
  }),
);

jest.mock(
  '../../data/sideEffects/getTimedTextTrackLanguageChoices/getTimedTextTrackLanguageChoices',
  () => ({
    getTimedTextTrackLanguageChoices: jest.fn(),
  }),
);

import { createTimedTextTrack } from '../../data/sideEffects/createTimedTextTrack/createTimedTextTrack';
import { getTimedTextTrackLanguageChoices } from '../../data/sideEffects/getTimedTextTrackLanguageChoices/getTimedTextTrackLanguageChoices';
import { modelName } from '../../types/models';
import { timedTextMode } from '../../types/tracks';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { UPLOAD_FORM_ROUTE } from '../UploadForm/route';
import { TimedTextCreationForm } from './TimedTextCreationForm';

const mockCreateTimedTextTrack: jest.Mock<
  typeof createTimedTextTrack
> = createTimedTextTrack as any;
const mockGetTimedTextTrackLanguageChoices: jest.Mock<
  typeof getTimedTextTrackLanguageChoices
> = getTimedTextTrackLanguageChoices as any;

const mockCreateTimedTextTrackRecord = jest.fn();

describe('<TimedTextCreationForm />', () => {
  afterEach(jest.resetAllMocks);

  it('renders and loads the language choices', async () => {
    mockGetTimedTextTrackLanguageChoices.mockResolvedValue([
      { label: 'English', value: 'en' },
      { label: 'French', value: 'fr' },
    ]);
    const wrapper = shallow(
      <TimedTextCreationForm
        createTimedTextTrack={mockCreateTimedTextTrackRecord}
        jwt={'some token'}
        mode={timedTextMode.SUBTITLE}
      />,
    );

    await flushAllPromises();

    expect(wrapper.html()).toContain('Add a language');
    expect(mockGetTimedTextTrackLanguageChoices).toHaveBeenCalled();
    expect(wrapper.instance().state).toEqual({
      languageChoices: [
        { label: 'English', value: 'en' },
        { label: 'French', value: 'fr' },
      ],
    });
  });

  it('redirects to <ErrorComponent /> when it fails to get the language choices', async () => {
    mockGetTimedTextTrackLanguageChoices.mockRejectedValue(
      new Error('Failed to get language choices.'),
    );
    const wrapper = shallow(
      <TimedTextCreationForm
        createTimedTextTrack={jest.fn()}
        jwt={'some token'}
        mode={timedTextMode.SUBTITLE}
      />,
    );

    await flushAllPromises();

    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual(ERROR_COMPONENT_ROUTE('notFound'));
  });

  describe('createAndGoToUpload()', () => {
    let instance: TimedTextCreationForm;
    let wrapper: ShallowWrapper;

    beforeEach(() => {
      wrapper = shallow(
        <TimedTextCreationForm
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
