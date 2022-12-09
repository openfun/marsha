import { Nullable } from 'lib-common';
import { report } from 'lib-components';

export interface RenaterSamlFerIdp {
  id: string;
  display_name: string;
  organization_name: string;
  organization_display_name: string;
  logo: Nullable<string>;
  login_url: string;
}

export const getRenaterFerIdpList = async (): Promise<RenaterSamlFerIdp[]> => {
  const response = await fetch(`/account/api/saml/renater_fer_idp_list/`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    report(new Error('Failed to fetch Renater SAML FER IDP list'));
    return [];
  }

  return (await response.json()) as RenaterSamlFerIdp[];
};
