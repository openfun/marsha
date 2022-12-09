import fetchMock from 'fetch-mock';
import { report } from 'lib-components';

import { getRenaterFerIdpList } from './index';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('features/Authentication/api/getRenaterFerIdpList', () => {
  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  describe('getRenaterFerIdpList', () => {
    it('successfully fetches list', async () => {
      fetchMock.getOnce('/account/api/saml/renater_fer_idp_list/', [
        {
          id: 'idp-1',
          display_name: 'Idp 1',
          organization_name: 'Organization 1',
          organization_display_name: 'Organization 1',
          logo: null,
          login_url: 'https://idp-1/login',
        },
      ]);

      const idpList = await getRenaterFerIdpList();

      expect(idpList).toEqual([
        {
          id: 'idp-1',
          display_name: 'Idp 1',
          organization_name: 'Organization 1',
          organization_display_name: 'Organization 1',
          logo: null,
          login_url: 'https://idp-1/login',
        },
      ]);
    });

    it('returns empty list when fetching fails', async () => {
      fetchMock.getOnce('/account/api/saml/renater_fer_idp_list/', 400);

      const idpList = await getRenaterFerIdpList();

      expect(idpList).toEqual([]);
      expect(report).toHaveBeenCalledWith(
        Error('Failed to fetch Renater SAML FER IDP list'),
      );
    });
  });
});
