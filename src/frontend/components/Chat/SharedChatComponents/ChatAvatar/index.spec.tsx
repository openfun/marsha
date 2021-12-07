import React from 'react';
import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import { screen } from '@testing-library/react';

import { ChatAvatar } from './index';

describe('<ChatAvatar />', () => {
  it('renders the avatar and compares it with snapshot', () => {
    renderIconSnapshot(<ChatAvatar />);
    screen.getByTitle("The user's avatar");
  });
});
