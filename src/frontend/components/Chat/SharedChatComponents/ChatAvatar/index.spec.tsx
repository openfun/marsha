import React from 'react';
import { screen } from '@testing-library/react';

import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import { ChatAvatar } from './index';

describe('<ChatAvatar />', () => {
  it('renders the avatar for student and compares it with snapshot', async () => {
    await renderIconSnapshot(<ChatAvatar isInstructor={false} />);
    screen.getByTitle("The user's avatar");
  });

  it('renders the avatar for instructor and compares it with snapshot', async () => {
    await renderIconSnapshot(<ChatAvatar isInstructor={true} />);
    screen.getByTitle("The user's avatar");
  });
});
