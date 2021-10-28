import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { wrapInIntlProvider } from 'utils/tests/intl';
import DashboardMeetingJoin from '.';

const onClick = jest.fn();

describe('<DashboardMeetingJoin />', () => {
  it('displays a clickable link', () => {
    const { getByText } = render(
      wrapInIntlProvider(
        <DashboardMeetingJoin href="https://example.com" onClick={onClick} />,
      ),
    );
    getByText('Your browser is blocking popups.');

    const link = screen.getByRole('link', {
      name: /please click here to access meeting./i,
    });
    expect(link.getAttribute('href')).toEqual('https://example.com');
    expect(link.getAttribute('target')).toEqual('_blank');
    expect(link.getAttribute('rel')).toEqual('noopener');

    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
