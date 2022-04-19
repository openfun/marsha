import React, { useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { toast } from 'react-hot-toast';

import { Video } from 'types/tracks';
import { Maybe } from 'utils/types';
import { DashboardVideoLiveWidgetTextInput } from 'components/DashboardVideoLiveControlPane/inputs/DashboardVideoLiveWidgetTextInput';
import { DashboardVideoLiveWidgetToggleInput } from 'components/DashboardVideoLiveControlPane/inputs/DashboardVideoLiveWidgetToggleInput';
import { DashboardVideoLiveWidgetTemplate } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetTemplate';
import { Box } from 'grommet';
import { useUpdateVideo } from 'data/queries';
import { report } from 'utils/errors/report';

const messages = defineMessages({
  info: {
    defaultMessage:
      'This widget allows you to set the title of your live, alongside activate / deactivate recording of it.',
    description:
      'Info of the widget used for setting title and live recording.',
    id: 'components.DashboardVideoLiveWidgetGeneralTitle.info',
  },
  title: {
    defaultMessage: 'General',
    description:
      'Title of the widget used for setting live title and activate recording.',
    id: 'components.DashboardVideoLiveWidgetGeneralTitle.title',
  },
  placeholderTitleInput: {
    defaultMessage: 'Enter title of your live here',
    description:
      'A placeholder text indicating the purpose of the inpu and what it is supposed to received.',
    id: 'components.DashboardVideoLiveWidgetGeneralTitle.placeholderTitleInput',
  },
  updateTitleSuccess: {
    defaultMessage: 'Title updated.',
    description: 'Message displayed when title update is successful.',
    id: 'component.DashboardVideoLiveWidgetGeneralTitle.updateTitleSuccess',
  },
  updateTitleBlank: {
    defaultMessage: "Title can't be blank !",
    description:
      'Message displayed when the user tried to enter a blank title.',
    id: 'component.DashboardVideoLiveWidgetGeneralTitle.updateTitleBlank',
  },
  updateTitleFail: {
    defaultMessage: 'Title update has failed !',
    description: 'Message displayed when title update failed.',
    id: 'component.DashboardVideoLiveWidgetGeneralTitle.updateTitleFail',
  },
  recordingToggleLabel: {
    defaultMessage: 'Activate live recording',
    description:
      'The label associated to the toggle button reponsible of live recording activation / deactivation.',
    id: 'components.DashboardVideoLiveWidgetGeneralTitle.liveRecordingToggleLabel',
  },
  updateAllowRecordingSuccess: {
    defaultMessage: 'Recording activation status updated.',
    description:
      'Message when recording activation status update is successful.',
    id: 'component.DashboardVideoLiveWidgetGeneralTitle.updateAllowRecordingSuccess',
  },
  updateAllowRecordingFail: {
    defaultMessage: 'Recording activation status update has failed !',
    description: 'Message when recording activation status update failed.',
    id: 'component.DashboardVideoLiveWidgetGeneralTitle.updateAllowRecordingFail',
  },
});

interface DashboardVideoLiveWidgetGeneralTitleProps {
  video: Video;
}

export const DashboardVideoLiveWidgetGeneralTitle = ({
  video,
}: DashboardVideoLiveWidgetGeneralTitleProps) => {
  const intl = useIntl();
  const [titleState, setTitleState] = useState(video.title);
  const [checked, setChecked] = useState(video.allow_recording);

  const titleMutation = useUpdateVideo(video.id, {
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.updateTitleSuccess));
    },
    onError: (err) => {
      report(err);
      toast.error(intl.formatMessage(messages.updateTitleFail));
      setTitleState(video.title);
    },
  });

  const allowRecordingMutation = useUpdateVideo(video.id, {
    onSuccess: (data: Video) => {
      setChecked(data.allow_recording);
    },
    onError: (err) => {
      report(err);
      toast.error(intl.formatMessage(messages.updateAllowRecordingFail));
    },
  });

  const timeoutId = useRef<Maybe<number>>();

  const debounce = (fn: (updatedTitle: string) => void, ms = 500) => {
    return (updatedTitle: string) => {
      window.clearTimeout(timeoutId.current);
      timeoutId.current = window.setTimeout(() => fn(updatedTitle), ms);
    };
  };

  const debouncedUpdatedTitle = React.useRef(
    debounce((updatedTitle: string) => {
      if (updatedTitle) {
        titleMutation.mutate({ title: updatedTitle });
      } else {
        toast.error(intl.formatMessage(messages.updateTitleBlank));
        setTitleState(video.title);
      }
    }),
  ).current;

  const onToggleChange = () => {
    allowRecordingMutation.mutate({
      allow_recording: !video.allow_recording,
    });
  };

  const handleChange = async (text: string) => {
    window.clearTimeout(timeoutId.current);
    debouncedUpdatedTitle(text);
  };

  return (
    <DashboardVideoLiveWidgetTemplate
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue={true}
      title={intl.formatMessage(messages.title)}
    >
      <Box direction="column" gap="small">
        <DashboardVideoLiveWidgetTextInput
          placeholder={intl.formatMessage(messages.placeholderTitleInput)}
          value={titleState || ''}
          setValue={(inputText: string) => {
            setTitleState(inputText);
            handleChange(inputText);
          }}
          title={intl.formatMessage(messages.placeholderTitleInput)}
        />
        <DashboardVideoLiveWidgetToggleInput
          disabled={video.is_recording}
          checked={checked}
          onChange={onToggleChange}
          label={intl.formatMessage(messages.recordingToggleLabel)}
        />
      </Box>
    </DashboardVideoLiveWidgetTemplate>
  );
};
