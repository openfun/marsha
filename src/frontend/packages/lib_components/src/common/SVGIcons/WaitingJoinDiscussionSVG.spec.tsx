import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { WaitingJoinDiscussionSVG } from './WaitingJoinDiscussionSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<WaitingJoinDiscussionSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders WaitingJoinDiscussionSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<WaitingJoinDiscussionSVG iconColor="#035ccd" />);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('renders WaitingJoinDiscussionSVG focus [screenshot]', async () => {
    await renderIconSnapshot(
      <WaitingJoinDiscussionSVG iconColor="white" focusColor="#035ccd" />,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
