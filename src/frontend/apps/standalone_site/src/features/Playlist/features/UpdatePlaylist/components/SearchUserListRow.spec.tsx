import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import { SearchUserListRow } from './SearchUserListRow';

describe('SearchUserListRow', () => {
  it('should render name and email', () => {
    render(
      <SearchUserListRow
        user={{
          id: '1',
          email: 'user_1@example.com',
          full_name: 'User 1',
        }}
      />,
    );
    expect(screen.getByText('User 1 (user_1@example.com)')).toBeInTheDocument();
  });

  it('should render name', () => {
    render(
      <SearchUserListRow
        user={{
          id: '1',
          email: '',
          full_name: 'User 1',
        }}
      />,
    );
    expect(screen.getByText('User 1')).toBeInTheDocument();
  });

  it('should render email', () => {
    render(
      <SearchUserListRow
        user={{
          id: '1',
          email: 'user_1@example.com',
          full_name: '',
        }}
      />,
    );
    expect(screen.getByText('user_1@example.com')).toBeInTheDocument();
  });

  it('should render anonymous and id', () => {
    render(
      <SearchUserListRow
        user={{
          id: '1',
          email: '',
          full_name: '',
        }}
      />,
    );
    expect(screen.getByText('Anonymous (1)')).toBeInTheDocument();
  });

  it('should render children', () => {
    render(
      <SearchUserListRow
        user={{
          id: '1',
          email: '',
          full_name: '',
        }}
      >
        <div>children</div>
      </SearchUserListRow>,
    );
    expect(screen.getByText('children')).toBeInTheDocument();
  });
});
