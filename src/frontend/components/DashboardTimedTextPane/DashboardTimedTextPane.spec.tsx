import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { requestStatus } from '../../types/api';
import { TimedText } from '../../types/tracks';
import { DashboardTimedTextManager } from '../DashboardTimedTextManager/DashboardTimedTextManager';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { DashboardTimedTextPane } from './DashboardTimedTextPane';

const mockGetTimedTextTrackList = jest.fn();

describe('<DashboardTimedTextPane />', () => {
  afterEach(jest.resetAllMocks);

  it('gets the list of timedtexttracks and displays them by mode', () => {
    const timedtexttracks = {
      objects: [{ id: '42' } as TimedText, { id: '43' } as TimedText],
      status: requestStatus.SUCCESS,
    };
    const wrapper = shallow(
      <DashboardTimedTextPane
        getTimedTextTrackList={mockGetTimedTextTrackList}
        timedtexttracks={timedtexttracks}
      />,
    );

    expect(wrapper.find(DashboardTimedTextManager).length).toEqual(3);
    expect(mockGetTimedTextTrackList).toHaveBeenCalled();
  });

  it('redirects to the error view when the timedtexttrack list request fails', () => {
    const timedtexttracks = { objects: [], status: requestStatus.FAILURE };
    const wrapper = shallow(
      <DashboardTimedTextPane
        getTimedTextTrackList={mockGetTimedTextTrackList}
        timedtexttracks={timedtexttracks}
      />,
    );

    expect(mockGetTimedTextTrackList).toHaveBeenCalledWith();
    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual(ERROR_COMPONENT_ROUTE('notFound'));
  });
});
