import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { JoinDiscussionSVG } from './JoinDiscussionSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<JoinDiscussionSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders JoinDiscussionSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<JoinDiscussionSVG iconColor="#035ccd" />);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('renders JoinDiscussionSVG focus [screenshot]', async () => {
    await renderIconSnapshot(
      <JoinDiscussionSVG iconColor="white" focusColor="#035ccd" />,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
