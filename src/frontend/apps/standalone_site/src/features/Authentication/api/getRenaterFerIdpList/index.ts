import { Nullable } from 'lib-common';
import { fetchWrapper, report } from 'lib-components';

export interface RenaterSamlFerIdp {
  id: string;
  display_name: string;
  organization_name: string;
  organization_display_name: string;
  logo: Nullable<string>;
  login_url: string;
}

export const getRenaterFerIdpList = async (
  signal?: AbortSignal,
): Promise<RenaterSamlFerIdp[]> => {
  const response = await fetchWrapper(
    `/account/api/saml/renater_fer_idp_list/`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
    },
  );

  if (!response.ok) {
    report(new Error('Failed to fetch Renater SAML FER IDP list'));
    return [];
  }

  return (await response.json()) as RenaterSamlFerIdp[];
};
