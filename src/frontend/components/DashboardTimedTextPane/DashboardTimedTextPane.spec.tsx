import { flushAllPromises } from '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

jest.mock(
  '../../data/sideEffects/getTimedTextTrackList/getTimedTextTrackList',
  () => ({
    getTimedTextTrackList: jest.fn(),
  }),
);

import { getTimedTextTrackList } from '../../data/sideEffects/getTimedTextTrackList/getTimedTextTrackList';
import { DashboardTimedTextManager } from '../DashboardTimedTextManager/DashboardTimedTextManager';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { DashboardTimedTextPane } from './DashboardTimedTextPane';

const mockGetTimedTextTrackList: jest.Mock<
  typeof getTimedTextTrackList
> = getTimedTextTrackList as any;

describe('<DashboardTimedTextPane />', () => {
  const mockAddAllTimedTextTracks = jest.fn();

  afterEach(jest.resetAllMocks);

  it('gets the list of timedtexttracks and displays them by mode', async () => {
    mockGetTimedTextTrackList.mockResolvedValue([{ id: '42' }, { id: '43' }]);
    const wrapper = shallow(
      <DashboardTimedTextPane
        addAllTimedTextTracks={mockAddAllTimedTextTracks}
        jwt={'some token'}
      />,
    );

    await flushAllPromises();

    expect(wrapper.find(DashboardTimedTextManager).length).toEqual(3);
    expect(mockGetTimedTextTrackList).toHaveBeenCalledWith('some token');
    expect(mockAddAllTimedTextTracks).toHaveBeenCalledWith([
      { id: '42' },
      { id: '43' },
    ]);
    expect(wrapper.instance().state).toEqual({
      timedtexttracks: [{ id: '42' }, { id: '43' }],
    });
  });

  it('redirects to the error view when it fails to get the timedtexttracks', async () => {
    mockGetTimedTextTrackList.mockRejectedValue(
      new Error('Failed to get timedtexttrack list.'),
    );
    const wrapper = shallow(
      <DashboardTimedTextPane
        addAllTimedTextTracks={mockAddAllTimedTextTracks}
        jwt={'some token'}
      />,
    );

    await flushAllPromises();

    expect(mockGetTimedTextTrackList).toHaveBeenCalledWith('some token');
    expect(mockAddAllTimedTextTracks).not.toHaveBeenCalled();
    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual(ERROR_COMPONENT_ROUTE('notFound'));
  });
});
