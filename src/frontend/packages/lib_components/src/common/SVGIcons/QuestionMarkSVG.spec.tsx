import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { QuestionMarkSVG } from './QuestionMarkSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<QuestionMarkSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders QuestionMarkSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <QuestionMarkSVG
        containerStyle={{
          height: '15px',
          width: '15px',
        }}
        iconColor="blue-focus"
      />,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
