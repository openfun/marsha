import { Input } from '@openfun/cunningham-react';
import { Box, Heading, Paragraph } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { Nullable, theme } from 'lib-common';
import { EditionSVG, report } from 'lib-components';
import { DateTime } from 'luxon';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { useUpdateVideo } from '@lib-video/api/useUpdateVideo';
import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';
import { useParticipantsStore } from '@lib-video/hooks/useParticipantsStore';

const StyledBoxInput = styled(Box)`
  & .c__input__wrapper {
    border: none;
  }
`;

const messages = defineMessages({
  noTitle: {
    defaultMessage: 'No title',
    description: 'Title placeholder when no title is defined for this live',
    id: 'components.LiveInfoBar.noTitle',
  },
  placeholderTitleInput: {
    defaultMessage: 'Enter title of your {videoType} here',
    description:
      'A placeholder text indicating the purpose of the input and what it is supposed to received.',
    id: 'components.LiveInfoBar.placeholderTitleInput',
  },
  nbViewers: {
    defaultMessage:
      '{numberOfStudents, plural, =0 {No viewers connected.} one {# viewer connected.} other {# viewers connected}}',
    description: 'Number of user connected on the live',
    id: 'component.LiveInfoBar.nbViewers',
  },
  updateVideoSucces: {
    defaultMessage: 'Video updated.',
    description: 'Message displayed when video is successfully updated.',
    id: 'components.LiveInfoBar.updateVideoSuccess',
  },
  updateVideoFail: {
    defaultMessage: 'Video update has failed !',
    description: 'Message displayed when video update has failed.',
    id: 'components.LiveInfoBar.updateVideoFail',
  },
  updateTitleBlank: {
    defaultMessage: "Title can't be blank !",
    description:
      'Message displayed when the user tried to enter a blank title.',
    id: 'components.LiveInfoBar.updateTitleBlank',
  },
});

interface VideoInfoBarProps {
  startDate: Nullable<string>;
  isTeacher: boolean;
}

export const VideoInfoBar = ({ isTeacher, startDate }: VideoInfoBarProps) => {
  const numberOfStudents = useParticipantsStore(
    (state) => state.participants,
  ).filter((client) => !client.isInstructor).length;
  const video = useCurrentVideo();
  const intl = useIntl();
  const [title, setTitle] = useState<string>(
    video.title || intl.formatMessage(messages.noTitle),
  );
  const localStartDate = useMemo(() => {
    if (!startDate) {
      return null;
    }

    const dt = DateTime.fromISO(startDate);
    return dt.isValid ? dt.setLocale(intl.locale).toFormat('D  ·  tt') : null;
  }, [startDate, intl]);

  const videoMutation = useUpdateVideo(video.id, {
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.updateVideoSucces), {
        position: 'bottom-center',
      });
    },
    onError: (err, variables) => {
      if ('title' in variables) {
        setTitle(video.title || intl.formatMessage(messages.noTitle));
      }
      report(err);
      toast.error(intl.formatMessage(messages.updateVideoFail), {
        position: 'bottom-center',
      });
    },
  });

  const handleChange = useCallback(
    (inputText: string) => {
      setTitle(inputText);

      if (inputText) {
        videoMutation.mutate({ title: inputText });
      }
    },
    [videoMutation],
  );

  useEffect(() => {
    if (title === '') {
      toast.error(intl.formatMessage(messages.updateTitleBlank), {
        position: 'bottom-center',
      });
      setTitle(video.title || intl.formatMessage(messages.noTitle));
      return;
    }
  }, [intl, title, video.title]);

  useEffect(() => {
    setTitle(video.title || intl.formatMessage(messages.noTitle));
  }, [intl, video.title]);

  return (
    <Fragment>
      {isTeacher ? (
        <StyledBoxInput alignContent="center" direction="row">
          <Input
            icon={
              <EditionSVG
                iconColor={normalizeColor('blue-chat', theme)}
                width="25px"
                height="25px"
                containerStyle={{ margin: 'auto' }}
              />
            }
            aria-label={intl.formatMessage(messages.placeholderTitleInput, {
              videoType: video.is_live ? 'live' : 'video',
            })}
            label={intl.formatMessage(messages.placeholderTitleInput, {
              videoType: video.is_live ? 'live' : 'video',
            })}
            fullWidth
            onBlur={(event) => handleChange(event.target.value)}
            value={title}
            state={!title ? 'error' : undefined}
          />
        </StyledBoxInput>
      ) : (
        <Heading
          a11yTitle={title}
          color="blue-active"
          level="1"
          margin={{ bottom: 'small' }}
          size="1.3rem"
          title={title}
          truncate
          style={{ maxWidth: '100%' }}
        >
          {title}
        </Heading>
      )}
      {numberOfStudents > 0 || localStartDate ? (
        <Box direction="row">
          {numberOfStudents > 0 && (
            <Paragraph
              color="blue-active"
              margin={{
                left: isTeacher ? 'small' : '',
                right: 'large',
                bottom: 'small',
              }}
              size="small"
            >
              {intl.formatMessage(messages.nbViewers, {
                numberOfStudents,
              })}
            </Paragraph>
          )}
          {localStartDate && (
            <Paragraph
              color="blue-active"
              margin={{
                bottom: 'small',
                left: numberOfStudents ? '' : 'small',
              }}
              size="small"
            >
              {localStartDate}
            </Paragraph>
          )}
        </Box>
      ) : null}
    </Fragment>
  );
};
