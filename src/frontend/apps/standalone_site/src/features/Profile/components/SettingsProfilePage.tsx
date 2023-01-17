import { Tab, Tabs } from 'grommet';
import { defineMessages, useIntl } from 'react-intl';

import { AccountSettings } from '../features/AccountSettings';

import { InfoSettings } from './InfoSettings';
import { OrganizationSettings } from './OrganizationSettings';

const messages = defineMessages({
  info: {
    defaultMessage: 'My informations',
    description:
      'Info tab title in settings page, to update name and other general infos.',
    id: 'components.Profile.components.SettingsProfilePage.info',
  },
  account: {
    defaultMessage: 'My account',
    description:
      'Account tab title in settings page, to update password and link to other site.',
    id: 'components.Profile.components.SettingsProfilePage.account',
  },
  organizations: {
    defaultMessage: 'My organizations',
    description:
      'Organization tab title in settings page, to config organizations.',
    id: 'components.Profile.components.SettingsProfilePage.organizations',
  },
});

export const SettingsProfilePage = () => {
  const intl = useIntl();

  return <AccountSettings />;

  return (
    <Tabs flex activeIndex={1}>
      {false && (
        <Tab title={intl.formatMessage(messages.info)}>
          <InfoSettings />
        </Tab>
      )}
      <Tab title={intl.formatMessage(messages.account)}>
        <AccountSettings />
      </Tab>
      {false && (
        <Tab title={intl.formatMessage(messages.organizations)}>
          <OrganizationSettings />
        </Tab>
      )}
    </Tabs>
  );
};
