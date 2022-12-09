import { Box, Button, Heading, Select, Text, TextInput } from 'grommet';
import {
  Form,
  FormField,
  Organization,
  report,
  Spinner,
  FormHelpText,
} from 'lib-components';
import { useLayoutEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';

import { useOrganizations } from 'api/useOrganizations';
import { ModalButton } from 'components/Modal';
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
  requiredField: {
    defaultMessage: 'This field is required to create the playlist.',
    description: 'Message when playlist field is missing.',
    id: 'feature.Playlist.CreatePlaylistForm.requiredField',
  },
});

interface CreatePlaylistFormValues {
  organizationId: string;
  name: string;
}

export const CreatePlaylistForm = () => {
  const intl = useIntl();
  const history = useHistory();
  const [formValues, setFormValues] = useState<
    Partial<CreatePlaylistFormValues>
  >({ organizationId: undefined, name: '' });
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
      <Box width="large">
        <Box margin="auto">
          <Spinner />
        </Box>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box width="large">
        <Text>{intl.formatMessage(messages.errorOrganizations)}</Text>
        <Box margin="auto" pad={{ top: 'medium' }}>
          <Button
            onClick={() => {
              refetch();
            }}
            primary
            label={intl.formatMessage(messages.retryOrganizations)}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box width="large">
      <Form
        onSubmit={(event) => {
          const values = event.value;
          if (!values.name || !values.organizationId) {
            //  should not happen with validation.
            report(
              new Error(
                `Submit create playlist form succeed with invalid data, submited data : ${values.toString()}`,
              ),
            );
            return;
          }

          mutate({
            organization: values.organizationId,
            title: values.name,
          });
        }}
        value={formValues}
        onChange={(values) => {
          setFormValues(values);
        }}
        onSubmitError={() => ({})}
        messages={{
          required: intl.formatMessage(messages.requiredField),
        }}
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
              name="organizationId"
              margin="0"
            >
              <Select
                name="organizationId"
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
                labelKey="name"
                valueKey={{ key: 'id', reduce: true }}
              />
            </FormField>
            <FormHelpText>
              {intl.formatMessage(messages.organizationHelper)}
            </FormHelpText>
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
            <FormHelpText>
              {intl.formatMessage(messages.playlistNameHelper)}
            </FormHelpText>
          </Box>
        </Box>
        <ModalButton
          label={intl.formatMessage(messages.createPlaylistButtonTitle)}
          onClickCancel={() => {
            history.push(routes.PLAYLIST.path);
          }}
          isSubmiting={isCreating}
        />
      </Form>
    </Box>
  );
};
