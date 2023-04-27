import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import Footer from './Footer';

jest.mock('assets/svg/logo_marsha.svg', () => ({
  ReactComponent: () => <div>My LogoIcon</div>,
}));

jest.mock('grommet-icons', () => ({
  ...jest.requireActual('grommet-icons'),
  Twitter: () => <div>Twitter</div>,
  Facebook: () => <div>Facebook</div>,
  Mail: () => <div>Mail</div>,
  Linkedin: () => <div>Linkedin</div>,
  Github: () => <div>Github</div>,
}));

describe('<Footer />', () => {
  beforeEach(() => {
    fetchMock.get('/api/pages/', {
      results: [
        {
          slug: 'test',
          name: 'Test Page',
          content: 'My test page',
        },
        {
          slug: 'cgi',
          name: 'General Conditions',
          content: 'Bla bla bla',
        },
      ],
    });
  });

  afterEach(() => {
    fetchMock.restore();
  });

  test('render Footer', async () => {
    useJwt.setState({
      jwt: undefined,
    });

    render(<Footer />);
    expect(await screen.findByText(/Test Page/i)).toBeInTheDocument();
    expect(screen.getByText(/General Conditions/i)).toBeInTheDocument();
    expect(screen.getByText(/© 2023 Marsha Education/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Twitter' })).toHaveAttribute(
      'href',
      'https://twitter.com/FunMooc',
    );
    expect(screen.getByRole('link', { name: 'Facebook' })).toHaveAttribute(
      'href',
      'https://www.facebook.com/france.universite.numerique/',
    );
    expect(screen.getByRole('link', { name: 'Linkedin' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/school/franceuniversitenumerique/',
    );
    expect(screen.getByRole('link', { name: 'Github' })).toHaveAttribute(
      'href',
      'https://github.com/openfun',
    );
    expect(screen.getByRole('link', { name: 'Mail' })).toHaveAttribute(
      'href',
      'mailto:communication@fun-mooc.fr',
    );
  });
});
