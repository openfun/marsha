import { Text, TextInput, Box, TextArea } from 'grommet';
import { Alert } from 'grommet-icons';
import { Nullable } from 'lib-common';
import { Form, FormField, LiveModeType, useResponsive } from 'lib-components';
import { initiateLive, useCreateVideo } from 'lib-video';
import { Fragment, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useQueryClient } from 'react-query';
import { useHistory } from 'react-router-dom';

import { ModalButton } from 'components/Modal';
import { useSelectPlaylist } from 'features/Playlist';
import { routes } from 'routes';

const messages = defineMessages({
  titleLabel: {
    defaultMessage: 'Title',
    description: 'Label for title in webinar creation form.',
    id: 'features.Contents.features.Live.LiveCreateForm.titleLabel',
  },
  descriptionLabel: {
    defaultMessage: 'Description',
    description: 'Label for description in webinar creation form.',
    id: 'features.Contents.features.Live.LiveCreateForm.descriptionLabel',
  },
  requiredField: {
    defaultMessage: 'This field is required to create the webinar.',
    description: 'Message when webinar field is missing.',
    id: 'features.Contents.features.Live.LiveCreateForm.requiredField',
  },
  submitLabel: {
    defaultMessage: 'Add Webinar',
    description: 'Label for button submit in webinar creation form.',
    id: 'features.Contents.features.Live.LiveCreateForm.submitLabel',
  },
  Error: {
    defaultMessage: 'Sorry, an error has occurred. Please try again.',
    description: 'Text when there is an error.',
    id: 'features.Contents.features.Live.LiveCreateForm.Error',
  },
});

type LiveCreate = {
  playlist: string;
  title: string;
  description?: string;
  live_type?: Nullable<LiveModeType>;
};

const LiveCreateForm = () => {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const history = useHistory();
  const { isDesktop } = useResponsive();
  const [isUpdatingToLive, setIsUpdatingToLive] = useState(false);
  const livePath = routes.CONTENTS.subRoutes.LIVE.path;
  const [live, setLive] = useState<LiveCreate>({
    playlist: '',
    title: '',
    live_type: LiveModeType.JITSI,
  });
  const { errorPlaylist, selectPlaylist } = useSelectPlaylist((results) => {
    setLive((value) => ({
      ...value,
      playlist: results[0].id,
    }));
  });
  const {
    mutate: createLive,
    error: errorVideo,
    isLoading: isCreating,
  } = useCreateVideo({
    onSuccess: async (data) => {
      setIsUpdatingToLive(true);

      await initiateLive(data, LiveModeType.JITSI);

      // Force a refresh of the videos list to get with `is_live=true`
      await queryClient.resetQueries(['videos']);

      setIsUpdatingToLive(false);

      history.push(`${livePath}/${data.id}`);
    },
  });

  return (
    <Fragment>
      {(errorVideo || errorPlaylist) && (
        <Box
          direction="row"
          align="center"
          justify="center"
          margin={{ bottom: 'medium' }}
          gap="small"
        >
          <Alert size="42rem" color="#df8c00" />
          <Text weight="bold" size="small">
            {intl.formatMessage(messages.Error)}
          </Text>
        </Box>
      )}
      <Form
        onSubmitError={() => ({})}
        onSubmit={({ value }) => createLive(value)}
        onChange={(values) => {
          setLive(values);
        }}
        messages={{
          required: intl.formatMessage(messages.requiredField),
        }}
        value={live}
      >
        <Box
          height={{ max: isDesktop ? '58vh' : '70vh' }}
          pad={{ vertical: 'xxsmall', horizontal: 'small' }}
          style={{
            overflow: 'auto',
            display: 'block',
          }}
        >
          <FormField
            label={intl.formatMessage(messages.titleLabel)}
            htmlFor="title-id"
            name="title"
            required
          >
            <TextInput size="1rem" name="title" id="title-id" />
          </FormField>

          {selectPlaylist}

          <FormField
            label={intl.formatMessage(messages.descriptionLabel)}
            htmlFor="description-id"
            name="description"
          >
            <TextArea
              size="1rem"
              rows={5}
              name="description"
              id="description-id"
            />
          </FormField>
        </Box>

        <ModalButton
          label={intl.formatMessage(messages.submitLabel)}
          onClickCancel={() => {
            history.push(livePath);
          }}
          isSubmitting={isCreating || isUpdatingToLive}
        />
      </Form>
    </Fragment>
  );
};

export default LiveCreateForm;
