import {
  Box,
  Button,
  DateInput,
  Form,
  FormField,
  Heading,
  StatusType,
  Notification,
  TextArea,
  TextInput,
} from 'grommet';
import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { appData } from '../../data/appData';
import { report } from '../../utils/errors/report';
import { Video } from '../../types/tracks';
import { API_ENDPOINT } from '../../settings';

const messages = defineMessages({
  intro: {
    defaultMessage: 'Schedule a webinar',
    description: 'Title of the form to create or update the scheduled webinar',
    id: 'components.ScheduledVideo.form.intro',
  },
  errorUpdate: {
    defaultMessage:
      'An error occured while updating the scheduled event, please try again.',
    description: 'Error message while saving the form',
    id: 'components.ScheduledVideo.form.error',
  },
  errorUpdateDate: {
    defaultMessage:
      'Scheduled date must be in the future and have a date and hour defined.',
    description:
      'Error message while saving the form, date is not defined or in the past',
    id: 'components.ScheduledVideo.form.error.starting_at',
  },
  errorUpdateDateAlreadyPast: {
    defaultMessage:
      "This webinar has an initial date that is already past, it can't be updated in the future. Please, create a new webinar or start this one.",
    description:
      'Error message while saving the form, initial scheduled date of this webinar is already past, invit user to create a new webinar or to start this one.',
    id: 'components.ScheduledVideo.form.error.starting_at_already_past',
  },
  errorUpdateTitle: {
    defaultMessage: 'Title must be defined.',
    description: 'Error on field title, this one cannot be empty',
    id: 'components.ScheduledVideo.form.error.title',
  },
  infoScheduledEvent: {
    defaultMessage: 'Webinar is scheduled at {date}.',
    description:
      'Message informing webinar is scheduled and giving the current date.',
    id: 'components.ScheduledVideo.infoScheduledEvent',
  },
  infoWasScheduledEvent: {
    defaultMessage: 'Webinar was scheduled at {date}.',
    description:
      'Message informing webinar was scheduled and giving the initial scheduled date.',
    id: 'components.ScheduledVideo.infoWasScheduledEvent',
  },
  infoWasScheduledEventDescription: {
    defaultMessage:
      'Date is past, please, create a new webinar or start this one',
    description:
      'Message informing that scheduled date is past and telling the user he can either start it or create a new one.',
    id: 'components.ScheduledVideo.infoWasScheduledEventDescription',
  },
  placeholderDescription: {
    defaultMessage: 'Description',
    description: 'Placeholder of the description field in the form',
    id: 'components.ScheduledVideo.form.placeholder.description',
  },
  placeholderTitle: {
    defaultMessage: 'Title',
    description: 'Placeholder of the title field in the form',
    id: 'components.ScheduledVideo.form.placeholder.title',
  },

  updateDescription: {
    defaultMessage: 'Description of your webinar',
    description:
      'Label of the input fiel to add/update the description of the webinar',
    id: 'components.ScheduledVideo.form.description',
  },
  updateDate: {
    defaultMessage: 'What is the scheduled date and time of your webinar ?',
    description:
      'Label of the input fiel to add/update the scheduled date of the webinar',
    id: 'components.ScheduledVideo.form.date',
  },
  updateTitle: {
    defaultMessage: 'Title of your webinar',
    description:
      'Label of the input fiel to add/update the title to the webinar',
    id: 'components.ScheduledVideo.form.title',
  },
  updateSuccessful: {
    defaultMessage: 'Your webinar has been updated',
    description: 'message to confirm webinar has been updated',
    id: 'components.ScheduledVideo.form.success',
  },
  updateSuccessfulOpenRegister: {
    defaultMessage: 'Your can now ask users to register to your webinar',
    description: 'message to confirm users can now register to the webinar',
    id: 'components.ScheduledVideo.form.success.openregistration',
  },
});

interface ScheduledVideoFormProps {
  video: Video;
}

export const ScheduledVideoForm = ({ video }: ScheduledVideoFormProps) => {
  const [dateEvent, setDateEvent] = useState(
    video.starting_at ? new Date(video.starting_at) : null,
  );
  const [description, setDescription] = useState(
    video.description ? video.description : '',
  );
  const [error, setError] = useState(false);
  const [errorDate, setErrorDate] = useState('');
  const [errorTitle, setErrorTitle] = useState('');
  const [newVideo, setNewVideo] = useState(video);
  const [title, setTitle] = useState(video.title ? video.title : '');
  const [udpated, setUpdated] = useState(false);
  // a video already past can't be updated
  const isAlreadyPast =
    newVideo.starting_at != null && new Date(newVideo.starting_at) < new Date();

  const getDateTime = () => {
    /** Date and time are selected directly in right GMT time */
    if (dateEvent != null) {
      return `${dateEvent.getUTCFullYear()}-${
        dateEvent.getUTCMonth() + 1
      }-${dateEvent.getUTCDate()}T${dateEvent.getUTCHours()}:${dateEvent.getUTCMinutes()}`;
    }
    return false;
  };

  const initError = () => {
    setError(false);
    setErrorDate('');
    setErrorTitle('');
  };

  const intl = useIntl();

  const updateVideo = async () => {
    const response = await fetch(`${API_ENDPOINT}/videos/${video.id}/`, {
      headers: {
        Authorization: `Bearer ${appData.jwt}`,
        'Content-Type': 'application/json',
      },
      method: 'PUT',
      body: JSON.stringify({
        title,
        description,
        starting_at: getDateTime(),
      }),
    });

    if (!response.ok) {
      setError(true);
      setUpdated(false);
      if (response.status === 400) {
        const feedback = await response.json();
        if (feedback.starting_at) {
          setErrorDate(intl.formatMessage(messages.errorUpdateDate));
        }
        if (feedback.title) {
          setErrorTitle(intl.formatMessage(messages.errorUpdateTitle));
        }
        throw { code: 'invalid', ...feedback };
      }
      throw { code: 'exception' };
    }

    setNewVideo((await response.json()) as Video);
    setUpdated(true);
    initError();
  };

  const scheduledDate = async () => {
    try {
      await updateVideo();
    } catch (error) {
      report(error);
    }
  };

  return (
    <Box margin={'large'}>
      <Heading level="2">
        <FormattedMessage
          {...(newVideo.starting_at
            ? isAlreadyPast
              ? messages.infoWasScheduledEvent
              : messages.infoScheduledEvent
            : messages.intro)}
          values={
            newVideo.starting_at
              ? { date: new Date(newVideo.starting_at!).toLocaleString() }
              : {}
          }
        />
      </Heading>
      {!isAlreadyPast && (
        <Box basis={'1/3'} margin={'medium'} gap="medium">
          <Form onSubmit={scheduledDate}>
            <Box basis={'1/2'} margin={'medium'} gap="medium">
              <FormField
                component={TextInput}
                error={errorTitle}
                htmlFor="title"
                label={intl.formatMessage(messages.updateTitle)}
              >
                <TextInput
                  id="title"
                  maxLength={255}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={intl.formatMessage(messages.placeholderTitle)}
                  required={true}
                  size="medium"
                  value={title}
                />
              </FormField>
            </Box>
            <Box basis={'1/2'} margin={'medium'} gap="medium">
              <FormField
                label={intl.formatMessage(messages.updateDescription)}
                htmlFor="description"
                component={TextArea}
              >
                <TextArea
                  id="description"
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={intl.formatMessage(
                    messages.placeholderDescription,
                  )}
                  required={false}
                  size="large"
                  value={description}
                />
              </FormField>
            </Box>
            <Box basis={'1/2'} margin={'medium'} gap="medium">
              <FormField
                label={intl.formatMessage(messages.updateDate)}
                htmlFor={'datePicker'}
                error={errorDate}
                component={DateInput}
              >
                <DatePicker
                  id="datePicker"
                  className="scheduled-date-picker"
                  dateFormat="dd/MM/yyyy H:mm aa"
                  dayClassName={() => 'scheduled-date-picker-day'}
                  onChange={(date) => setDateEvent(date as any)}
                  placeholderText="dd/MM/yyyy H:mm"
                  selected={dateEvent}
                  showTimeSelect
                  timeFormat="H:mm"
                  timeIntervals={5}
                  timeInputLabel="Time:"
                  wrapperClassName="wrapper-scheduled-date-picker"
                />
              </FormField>
            </Box>

            <Box direction="row" gap="medium">
              <Button type="submit" primary label="Submit" />
            </Box>
          </Form>
        </Box>
      )}
      {udpated && (
        <Notification
          status={'normal' as StatusType}
          title={intl.formatMessage(messages.updateSuccessful)}
          message={intl.formatMessage(messages.updateSuccessfulOpenRegister)}
        />
      )}
      {error && (
        <Notification
          status={'critical' as StatusType}
          title={intl.formatMessage(messages.errorUpdate)}
          message={`${errorDate} ${errorTitle}`}
        />
      )}
      {isAlreadyPast && (
        <Notification
          status={'warning' as StatusType}
          title={intl.formatMessage(messages.infoWasScheduledEvent, {
            date: new Date(newVideo.starting_at!).toLocaleString(),
          })}
          message={intl.formatMessage(
            messages.infoWasScheduledEventDescription,
          )}
        />
      )}
    </Box>
  );
};
