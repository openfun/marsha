import { fireEvent, screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import DashboardClassroomJoin from '.';

const onClick = jest.fn();

describe('<DashboardClassroomJoin />', () => {
  it('displays a clickable link', () => {
    render(
      <DashboardClassroomJoin href="https://example.com" onClick={onClick} />,
    );

    const link = screen.getByRole('link', {
      name: /please click here to access classroom./i,
    });
    expect(link.getAttribute('href')).toEqual('https://example.com');
    expect(link.getAttribute('target')).toEqual('_blank');
    expect(link.getAttribute('rel')).toEqual('noopener noreferrer');

    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
