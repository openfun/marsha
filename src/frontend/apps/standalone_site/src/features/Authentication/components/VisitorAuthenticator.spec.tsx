import { screen } from '@testing-library/react';
import { useJwt } from 'lib-components';
import { render } from 'lib-tests';

import { VisitorAuthenticator } from './VisitorAuthenticator';

let mockInviteId = '123456';
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({
    inviteId: mockInviteId,
  }),
}));

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  Loader: () => <div>My Loader</div>,
}));

describe('<VisitorAuthenticator />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: '',
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('checks render with inviteId', () => {
    render(<VisitorAuthenticator>My children</VisitorAuthenticator>);

    expect(screen.getByText(/My children/i)).toBeInTheDocument();
  });

  it('checks render without inviteId', () => {
    mockInviteId = '';
    render(<VisitorAuthenticator>My children</VisitorAuthenticator>);

    expect(screen.getByText(/My Loader/i)).toBeInTheDocument();
    expect(screen.queryByText(/My children/i)).not.toBeInTheDocument();
  });
});
