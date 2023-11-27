import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { ResponsiveContext } from 'grommet';
import { useSiteConfig } from 'lib-components';
import { render } from 'lib-tests';

import { getFullThemeExtend } from 'styles/theme.extend';

import { BaseAuthenticationPage } from './BaseAuthenticationPage';

const fullTheme = getFullThemeExtend();

jest.mock('features/Header', () => ({
  HeaderLight: () => <div>My HeaderLight</div>,
}));

describe('<BaseAuthenticationPage />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('checks render.', () => {
    render(
      <BaseAuthenticationPage>
        <div>My content</div>
      </BaseAuthenticationPage>,
    );

    expect(screen.getByLabelText(/Marsha logo/i)).toBeInTheDocument();
    expect(screen.getByText(/My content/i)).toBeInTheDocument();
  });

  it('checks responsive layout', () => {
    render(
      <ResponsiveContext.Provider value="xsmall">
        <BaseAuthenticationPage>
          <div>My content</div>
        </BaseAuthenticationPage>
      </ResponsiveContext.Provider>,
      {
        grommetOptions: {
          theme: fullTheme,
        },
      },
    );

    expect(screen.queryByLabelText(/Marsha logo/i)).not.toBeInTheDocument();
    expect(screen.getByText(/My HeaderLight/i)).toBeInTheDocument();
    expect(screen.getByText(/My content/i)).toBeInTheDocument();
  });

  it('checks render for custom site', () => {
    useSiteConfig.setState({
      siteConfig: {
        is_default_site: false,
        footer_copyright: 'custom copyright',
        logo_url: 'custom logo',
        is_logo_enabled: false,
        login_html: 'custom login markdown',
        vod_conversion_enabled: true,
        homepage_banner_title: 'banner title',
        homepage_banner_text: 'banner text',
        meta_description: 'meta description',
        meta_title: 'meta title',
      },
    });

    render(
      <BaseAuthenticationPage>
        <div>My content</div>
      </BaseAuthenticationPage>,
    );

    expect(screen.getByText(/custom login markdown/i)).toBeInTheDocument();
    expect(screen.getByText(/My content/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Marsha logo/i)).not.toBeInTheDocument();
  });
});
