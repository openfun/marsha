import { screen } from '@testing-library/react';
import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { ChatAvatar } from './index';

describe('<ChatAvatar />', () => {
  it('renders the avatar for student and compares it with snapshot [screenshot]', async () => {
    await renderIconSnapshot(<ChatAvatar isInstructor={false} />);

    expect(screen.getByTitle("The user's avatar")).toBeInTheDocument();
  });

  it('renders the avatar for instructor and compares it with snapshot [screenshot]', async () => {
    await renderIconSnapshot(<ChatAvatar isInstructor={true} />);

    expect(screen.getByTitle("The user's avatar")).toBeInTheDocument();
  });
});
