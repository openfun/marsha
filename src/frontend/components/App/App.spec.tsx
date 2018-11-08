import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { Video } from '../../types/Video';
import { App, AppDataContext } from './App';

jest.mock('../..', () => ({
  appData: { video: { id: 'some-id', state: 'processing' } },
}));

describe('<App />', () => {
  it('renders the children and provides an updateVideo method', () => {
    let getCurrentVideo: () => Video;
    let doUpdateVideo: (video: Video) => void;

    const wrapper = shallow(
      <App>
        <AppDataContext.Consumer>
          {({ video, updateVideo }) => {
            // Assign current values to the outside closure so we can run assertions on them
            if (updateVideo) {
              doUpdateVideo = updateVideo;
            }
            getCurrentVideo = () => video!;
            return <div />;
          }}
        </AppDataContext.Consumer>
      </App>,
    );

    // Force a render pass to ensure our local refences are assigned
    wrapper.render();
    expect(getCurrentVideo!()).toEqual({ id: 'some-id', state: 'processing' });

    // Update the video through the same mechanism consumers will use
    doUpdateVideo!({ id: 'some-id', state: 'ready' } as Video);
    wrapper.render();
    expect(getCurrentVideo!()).toEqual({ id: 'some-id', state: 'ready' });
  });
});
