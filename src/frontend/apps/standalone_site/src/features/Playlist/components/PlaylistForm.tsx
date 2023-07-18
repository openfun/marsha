import {
  Box,
  Button,
  Heading,
  Select,
  Text,
  TextInput,
  ThemeContext,
} from 'grommet';
import { Nullable } from 'lib-common';
import {
  ButtonLoaderStyle,
  FetchResponseError,
  Form,
  FormField,
  FormHelpText,
  Modal,
  ModalButton,
  Organization,
  Spinner,
  report,
} from 'lib-components';
import { ReactNode, useLayoutEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { useOrganizations } from 'api/useOrganizations';
import { ITEM_PER_PAGE } from 'conf/global';
import { routes } from 'routes';
import { disableFormTheme } from 'styles/theme.extend';

import { useDeletePlaylist } from '../api/useDeletePlaylist';

const messages = defineMessages({
  errorOrganizations: {
    defaultMessage: 'An error occurred, please try again later.',
    description:
      'Message displayed in case an error occured while fetching organizations.',
    id: 'feature.Playlist.PlaylistForm.errorOrganizations',
  },
  errorAttachedResources: {
    defaultMessage:
      'An error occurred, All attached resources must be deleted first.',
    description:
      'Message displayed in case there are attached resources to the playlist on delete.',
    id: 'feature.Playlist.PlaylistForm.errorAttachedResources',
  },
  deleteSuccessMessage: {
    defaultMessage: 'Playlist deleted with success.',
    description: 'Message displayed when playlist is successfully deleted.',
    id: 'feature.Playlist.PlaylistForm.DeleteSuccessMessage',
  },
  retryOrganizations: {
    defaultMessage: 'Retry',
    description:
      'Retry button title to fetch again organizations in case of error.',
    id: 'feature.Playlist.PlaylistForm.retryOrganizations',
  },
  organizationFieldLabel: {
    defaultMessage: 'Organization',
    description: 'Organization field label in create playlist form.',
    id: 'feature.Playlist.PlaylistForm.organizationFieldLabel',
  },
  organizationHelper: {
    defaultMessage:
      "If you don't find your organization, please contact your administrator.",
    description: 'Organization field in create playlist form helper.',
    id: 'feature.Playlist.PlaylistForm.organizationHelper',
  },
  playlistNameFieldLabel: {
    defaultMessage: 'Name',
    description: 'Playlist name field label in create playlist form.',
    id: 'feature.Playlist.PlaylistForm.playlistNameFieldLabel',
  },
  playlistNameHelper: {
    defaultMessage: 'This name will be use to search your playlist',
    description: 'Playlist name helper in create playlist form.',
    id: 'feature.Playlist.PlaylistForm.playlistNameHelper',
  },
  playlistRetentionDurationFieldLabel: {
    defaultMessage: 'Retention duration',
    description:
      'Playlist retention duration field label in create playlist form.',
    id: 'feature.Playlist.PlaylistForm.playlistRetentionDurationFieldLabel',
  },
  playlistRetentionDurationHelper: {
    defaultMessage:
      'This retention duration is use to know how long related resources will be kept.',
    description: 'Playlist retention duration helper in create playlist form .',
    id: 'feature.Playlist.PlaylistForm.playlistRetentionDurationHelper',
  },
  playlistRetentionDurationChoiceNoDuration: {
    defaultMessage: 'No retention duration',
    description:
      'Playlist retention duration choice: "no duration", in create playlist form.',
    id: 'feature.Playlist.PlaylistForm.playlistRetentionDurationChoiceNoDuration',
  },
  playlistRetentionDurationChoice30Days: {
    defaultMessage: '30 days',
    description:
      'Playlist retention duration choice: "30 days", in create playlist form.',
    id: 'feature.Playlist.PlaylistForm.playlistRetentionDurationChoice30Days',
  },
  playlistRetentionDurationChoice1Year: {
    defaultMessage: '1 year',
    description:
      'Playlist retention duration choice: "1 year", in create playlist form.',
    id: 'feature.Playlist.PlaylistForm.playlistRetentionDurationChoice1Year',
  },
  playlistRetentionDurationChoice5years: {
    defaultMessage: '5 years',
    description:
      'Playlist retention duration choice: "5 years", in create playlist form.',
    id: 'feature.Playlist.PlaylistForm.playlistRetentionDurationChoice5years',
  },
  requiredField: {
    defaultMessage: 'This field is required to create the playlist.',
    description: 'Message when playlist field is missing.',
    id: 'feature.Playlist.PlaylistForm.requiredField',
  },
  DeleteButtonText: {
    defaultMessage: 'Delete playlist',
    description: 'Delete playlist button text.',
    id: 'features.Playlist.PlaylistForm.DeleteButtonText',
  },
  confirmDeleteTitle: {
    defaultMessage: 'Confirm delete playlist',
    description: 'Title of the widget used for confirmation.',
    id: 'features.Playlist.PlaylistForm.confirmDeleteTitle',
  },
  confirmDeleteText: {
    defaultMessage:
      'Are you sure you want to delete this playlist ? This action is irreversible and all attached resources must be deleted.',
    description: 'Text of the widget used for confirmation.',
    id: 'eatures.Playlist.PlaylistForm.confirmDeleteText',
  },
  deleteModalTitle: {
    defaultMessage: 'Delete playlist',
    description: 'Title of the delete modal.',
    id: 'components.Playlist.PlaylistForm.deleteModalTitle',
  },
});

const StyledAnchorButton = styled(Button)`
  height: 50px;
  font-family: 'Roboto-Medium';
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface PlaylistFormValues {
  organizationId?: string;
  name?: string;
  retention_duration?: Nullable<number>;
}

interface PlaylistFormProps {
  playlistId?: string;
  title?: string;
  initialValues?: Partial<PlaylistFormValues>;
  onSubmit: (values: Partial<PlaylistFormValues>) => void;
  onCancel?: () => void;
  submitTitle: string;
  isSubmitting: boolean;
  isEditable?: boolean;
  actions?: ReactNode;
}

export const PlaylistForm = ({
  playlistId,
  title,
  initialValues,
  onSubmit,
  onCancel,
  submitTitle,
  isSubmitting,
  isEditable = true,
  actions,
}: PlaylistFormProps) => {
  const localItemPerPage = ITEM_PER_PAGE;

  const intl = useIntl();
  const [formValues, setFormValues] = useState<Partial<PlaylistFormValues>>({
    organizationId: initialValues?.organizationId,
    name: initialValues?.name || '',
    retention_duration: initialValues?.retention_duration || null,
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentOrganizationPage, setCurrentOrganizationPage] = useState(0);
  const [isInitOrganization, setIsInitOrganization] = useState(false);
  const navigate = useNavigate();
  const deletePlaylist = useDeletePlaylist({
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.deleteSuccessMessage), {
        position: 'bottom-center',
      });
      navigate(routes.PLAYLIST.path);
    },
    onError: (err: unknown) => {
      report(err);
      (err as FetchResponseError).response['status'] === 400
        ? toast.error(intl.formatMessage(messages.errorAttachedResources), {
            position: 'bottom-center',
          })
        : toast.error(intl.formatMessage(messages.errorOrganizations), {
            position: 'bottom-center',
          });
    },
  });
  const {
    isError,
    data: organizationResponse,
    refetch,
  } = useOrganizations(
    {
      offset: `${currentOrganizationPage * localItemPerPage}`,
      limit: `${localItemPerPage}`,
    },
    {
      onSuccess: (data) => {
        if (isInitOrganization) {
          return;
        }

        if (!data || data.count === 0) {
          setIsInitOrganization(true);
          return;
        }

        setFormValues((currentValue) => ({
          ...currentValue,
          organizationId:
            currentValue.organizationId || initialValues
              ? currentValue.organizationId
              : data.results[0].id,
        }));

        //  be sure to load the initial organization or reset it if we can't find it
        if (formValues.organizationId) {
          if (
            data.results.find(
              (element) => element.id === formValues.organizationId,
            ) !== undefined
          ) {
            //  queries results contains the selected organization
            setIsInitOrganization(true);
          } else if (
            currentOrganizationPage * localItemPerPage + localItemPerPage >=
            data.count
          ) {
            //  we have parsed all organization and we can not find the one selected
            setFormValues((currentValue) => ({
              ...currentValue,
              organizationId: undefined,
            }));
            setIsInitOrganization(true);
          } else {
            //  we have yet some page to load
            setCurrentOrganizationPage((currentPage) => currentPage + 1);
          }
        } else {
          setIsInitOrganization(true);
        }
      },
    },
  );
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const retentionDurationChoices = useMemo(
    () => [
      {
        label: intl.formatMessage(
          messages.playlistRetentionDurationChoiceNoDuration,
        ),
        value: null,
      },
      {
        label: intl.formatMessage(
          messages.playlistRetentionDurationChoice30Days,
        ),
        value: 30,
      },
      {
        label: intl.formatMessage(
          messages.playlistRetentionDurationChoice1Year,
        ),
        value: 365,
      },
      {
        label: intl.formatMessage(
          messages.playlistRetentionDurationChoice5years,
        ),
        value: 365 * 5,
      },
    ],
    [intl],
  );

  useLayoutEffect(() => {
    if (!organizationResponse) {
      return;
    }

    setOrganizations((currentOrganizationPage) => {
      const copie = [...currentOrganizationPage];
      organizationResponse.results.forEach((newItem) => {
        if (!copie.find((item) => item.id === newItem.id)) {
          copie.push(newItem);
        }
      });

      return copie;
    });
  }, [organizationResponse]);

  if (!isInitOrganization && !isError) {
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
    <ThemeContext.Extend value={isEditable ? {} : disableFormTheme}>
      <Form
        onSubmit={(event) => {
          const values = event.value;

          onSubmit(values);
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
          {title && (
            <Heading
              size="3"
              alignSelf="center"
              margin={{ top: '0', bottom: 'small' }}
            >
              {title}
            </Heading>
          )}

          <Box>
            <FormField
              required
              disabled={!isEditable}
              label={intl.formatMessage(messages.organizationFieldLabel)}
              htmlFor="select-organization-id"
              name="organizationId"
              margin="0"
            >
              <Select
                disabled={!isEditable}
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
              disabled={!isEditable}
              label={intl.formatMessage(messages.playlistNameFieldLabel)}
              htmlFor="textinput-name-id"
              name="name"
              margin="0"
            >
              <TextInput
                disabled={!isEditable}
                name="name"
                id="textinput-name-id"
              />
            </FormField>
            <FormHelpText>
              {intl.formatMessage(messages.playlistNameHelper)}
            </FormHelpText>
          </Box>
          <Box>
            <FormField
              disabled={!isEditable}
              label={intl.formatMessage(
                messages.playlistRetentionDurationFieldLabel,
              )}
              htmlFor="select-retention_duration-id"
              name="retention_duration"
              margin="0"
            >
              <Select
                aria-label={intl.formatMessage(
                  messages.playlistRetentionDurationFieldLabel,
                )}
                defaultValue={retentionDurationChoices[0]}
                id="select-retention_duration-id"
                name="retention_duration"
                labelKey="label"
                options={retentionDurationChoices}
                replace={false}
                valueKey={{ key: 'value', reduce: true }}
              />
            </FormField>
            <FormHelpText>
              {intl.formatMessage(messages.playlistRetentionDurationHelper)}
            </FormHelpText>
          </Box>
        </Box>
        <Box gap="xsmall">
          <ModalButton
            label={submitTitle}
            onClickCancel={
              onCancel
                ? () => {
                    setFormValues({
                      organizationId: initialValues?.organizationId,
                      name: initialValues?.name || '',
                    });

                    onCancel();
                  }
                : undefined
            }
            isSubmitting={isSubmitting}
            isDisabled={!formValues.name || !formValues.organizationId}
          />
          {playlistId && (
            <StyledAnchorButton
              a11yTitle={intl.formatMessage(messages.DeleteButtonText)}
              download
              fill="horizontal"
              label={intl.formatMessage(messages.DeleteButtonText)}
              target="_blank"
              rel="noopener noreferrer"
              primary
              title={intl.formatMessage(messages.DeleteButtonText)}
              onClick={() => setIsModalOpen(true)}
              color="action-danger"
            />
          )}
          {playlistId && (
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
              <Heading
                size="3"
                alignSelf="center"
                margin={{ top: '0', bottom: 'small' }}
              >
                {intl.formatMessage(messages.deleteModalTitle)}
              </Heading>
              <Text margin={{ top: 'small' }}>
                {intl.formatMessage(messages.confirmDeleteText)}
              </Text>
              <ModalButton
                label={intl.formatMessage(messages.confirmDeleteTitle)}
                onClickCancel={() => setIsModalOpen(false)}
                onClickSubmit={() => {
                  setIsModalOpen(false);
                  deletePlaylist.mutate(playlistId);
                }}
                style={ButtonLoaderStyle.DESTRUCTIVE}
              />
            </Modal>
          )}
        </Box>
        {actions}
      </Form>
    </ThemeContext.Extend>
  );
};
