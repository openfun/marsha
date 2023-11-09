import { Field, Input, TextArea } from '@openfun/cunningham-react';
import { useQueryClient } from '@tanstack/react-query';
import { Nullable } from 'lib-common';
import {
  Box,
  BoxError,
  Form,
  LiveModeType,
  ModalButton,
  useResponsive,
} from 'lib-components';
import { initiateLive, useCreateVideo } from 'lib-video';
import { Fragment, useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import { useSelectPlaylist } from 'features/Playlist';

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

type LiveManage = {
  playlist: string;
  title: string;
  description?: string;
  live_type?: Nullable<LiveModeType>;
};

const LiveCreateForm = () => {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isDesktop } = useResponsive();
  const [isUpdatingToLive, setIsUpdatingToLive] = useState(false);
  const [live, setLive] = useState<LiveManage>({
    playlist: '',
    title: '',
    live_type: LiveModeType.JITSI,
  });
  const { errorPlaylist, selectPlaylist, playlistResponse } = useSelectPlaylist(
    { withPlaylistCreation: true },
  );
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

      navigate(`../${data.id}`);
    },
  });

  useEffect(() => {
    if (!playlistResponse?.results || !playlistResponse?.count) {
      return;
    }

    setLive((value) => ({
      ...value,
      playlist: playlistResponse.results[0].id,
    }));
  }, [playlistResponse?.results, playlistResponse?.count]);

  return (
    <Fragment>
      {(errorVideo || errorPlaylist) && (
        <BoxError message={intl.formatMessage(messages.Error)} />
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
          <Field className="mb-s" fullWidth>
            <Input
              aria-label={intl.formatMessage(messages.titleLabel)}
              fullWidth
              label={intl.formatMessage(messages.titleLabel)}
              name="title"
              required
              onChange={(e) => {
                setLive((value) => ({
                  ...value,
                  title: e.target.value,
                }));
              }}
            />
          </Field>

          {selectPlaylist}

          <TextArea
            label={intl.formatMessage(messages.descriptionLabel)}
            rows={5}
            fullWidth
            onChange={(e) => {
              setLive((value) => ({
                ...value,
                description: e.target.value,
              }));
            }}
          />
        </Box>

        <ModalButton
          aria-label={intl.formatMessage(messages.submitLabel)}
          onClickCancel={() => {
            navigate('..');
          }}
          isSubmitting={isCreating || isUpdatingToLive}
          isDisabled={!live.title || !live.playlist}
        >
          {intl.formatMessage(messages.submitLabel)}
        </ModalButton>
      </Form>
    </Fragment>
  );
};

export default LiveCreateForm;
