import { Box, Button, Heading, Select, Stack, Text, TextInput } from 'grommet';
import { Form, FormField, Organization, report, Spinner } from 'lib-components';
import { useLayoutEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';

import { useOrganizations } from 'api/useOrganizations';
import { ITEM_PER_PAGE } from 'conf/global';
import { routes } from 'routes';

import { useCreatePlaylist } from '../api/useCreatePlaylist';

const messages = defineMessages({
  errorOrganizations: {
    defaultMessage: 'An error occurred, please try again later.',
    description:
      'Message displayed in case an error occured while fetching organizations.',
    id: 'feature.Playlist.CreatePlaylistForm.errorOrganizations',
  },
  retryOrganizations: {
    defaultMessage: 'Retry',
    description:
      'Retry button title to fetch again organizations in case of error.',
    id: 'feature.Playlist.CreatePlaylistForm.retryOrganizations',
  },
  formTitle: {
    defaultMessage: 'Create a playlist',
    description: 'Create playlist modale title',
    id: 'feature.Playlist.CreatePlaylistForm.formTitle',
  },
  organizationFieldLabel: {
    defaultMessage: 'Organization',
    description: 'Organization field label in create playlist form.',
    id: 'feature.Playlist.CreatePlaylistForm.organizationFieldLabel',
  },
  organizationHelper: {
    defaultMessage:
      "If you don't find your organization, please contact your administrator.",
    description: 'Organization field in create playlist form helper.',
    id: 'feature.Playlist.CreatePlaylistForm.organizationHelper',
  },
  playlistNameFieldLabel: {
    defaultMessage: 'Name',
    description: 'Playlist name field label in create playlist form.',
    id: 'feature.Playlist.CreatePlaylistForm.playlistNameFieldLabel',
  },
  playlistNameHelper: {
    defaultMessage: 'This name will be use to search your playlist',
    description: 'Playlist name helper in create playlist form.',
    id: 'feature.Playlist.CreatePlaylistForm.playlistNameHelper',
  },
  createPlaylistButtonTitle: {
    defaultMessage: 'Create playlist',
    description: 'Create playlist button title to submit create form.',
    id: 'feature.Playlist.CreatePlaylistForm.createPlaylistButtonTitle',
  },
});

interface CreatePlaylistFormValues {
  organization: Organization;
  name: string;
}

export const CreatePlaylistForm = () => {
  const intl = useIntl();
  const history = useHistory();
  const [formValues, setFormValues] = useState<
    Partial<CreatePlaylistFormValues>
  >({ organization: undefined, name: '' });
  const [currentOrganizationPage, setCurrentOrganizationPage] = useState(0);
  const {
    isLoading,
    isError,
    data: organizationResponse,
    refetch,
  } = useOrganizations({
    offset: `${currentOrganizationPage * ITEM_PER_PAGE}`,
    limit: `${ITEM_PER_PAGE}`,
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const { mutate, isLoading: isCreating } = useCreatePlaylist({
    onSuccess: () => {
      history.push(routes.PLAYLIST.path);
    },
  });

  useLayoutEffect(() => {
    if (!organizationResponse) {
      return;
    }

    setOrganizations((currentOrganizations) => [
      ...currentOrganizations,
      ...organizationResponse.results,
    ]);
  }, [organizationResponse]);

  if (isLoading && organizations.length === 0 && !isError) {
    return (
      <Box width="large" pad="medium">
        <Box margin="auto">
          <Spinner />
        </Box>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box width="large" pad="medium">
        <Text>{intl.formatMessage(messages.errorOrganizations)}</Text>
        <Box margin="auto" pad={{ top: 'medium' }}>
          <Button
            onClick={() => {
              refetch();
            }}
            primary
          >
            {intl.formatMessage(messages.retryOrganizations)}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box width="large" pad="medium">
      <Form
        onSubmit={(event) => {
          const values = event.value;
          if (!values.name || !values.organization) {
            //  should not happen with validation.
            report(
              new Error(
                `Submit create playlist form succeed with invalid data, submited data : ${values.toString()}`,
              ),
            );
            return;
          }

          mutate({
            organization: values.organization.id,
            title: values.name,
          });
        }}
        value={formValues}
        onChange={(values) => {
          setFormValues(values);
        }}
        onSubmitError={() => ({})}
      >
        <Box gap="medium">
          <Heading
            size="3"
            alignSelf="center"
            margin={{ top: '0', bottom: 'small' }}
          >
            {intl.formatMessage(messages.formTitle)}
          </Heading>

          <Box>
            <FormField
              required
              label={intl.formatMessage(messages.organizationFieldLabel)}
              htmlFor="select-organization-id"
              name="organization"
              margin="0"
            >
              <Select
                name="organization"
                id="select-organization-id"
                options={organizations}
                onMore={() => {
                  if (!organizationResponse) {
                    return;
                  }

                  if (organizations.length < organizationResponse.count) {
                    setCurrentOrganizationPage(
                      (currentPage) => currentPage + 1,
                    );
                  }
                }}
                valueLabel={(value: Organization) => (
                  <Box margin="small">
                    <Text>{value.name}</Text>
                  </Box>
                )}
              >
                {(option: Organization) => option.name}
              </Select>
            </FormField>
            <Text margin={{ top: 'small' }}>
              {intl.formatMessage(messages.organizationHelper)}
            </Text>
          </Box>

          <Box>
            <FormField
              required
              label={intl.formatMessage(messages.playlistNameFieldLabel)}
              htmlFor="textinput-name-id"
              name="name"
              margin="0"
            >
              <TextInput name="name" id="textinput-name-id" />
            </FormField>
            <Text>{intl.formatMessage(messages.playlistNameHelper)}</Text>
          </Box>

          <Stack guidingChild="first" interactiveChild="first">
            <Box fill>
              <Button
                type="submit"
                primary
                label={intl.formatMessage(messages.createPlaylistButtonTitle)}
                disabled={isCreating}
                style={{ cursor: isCreating ? 'wait' : undefined }}
              />
            </Box>
            {isCreating && (
              <Box fill>
                <Box margin="auto">
                  <Spinner />
                </Box>
              </Box>
            )}
          </Stack>
        </Box>
      </Form>
    </Box>
  );
};
