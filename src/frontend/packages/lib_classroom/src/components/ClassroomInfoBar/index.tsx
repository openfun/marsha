import { Box, BoxProps, Paragraph } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { Nullable, theme } from 'lib-common';
import { Classroom, EditionSVG, report, TextInput } from 'lib-components';
import { DateTime } from 'luxon';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { useUpdateClassroom } from '@lib-classroom/data';
import { useCurrentClassroom } from '@lib-classroom/hooks/useCurrentClassroom';

const StyledTitleTextInput = styled(TextInput)`
  border: 1px solid ${normalizeColor('blue-active', theme)};
  border-radius: 4px;
  color: ${normalizeColor('blue-chat', theme)};
  font-size: 1.125rem;
  :not(:focus) {
    color: ${normalizeColor('blue-chat', theme)};
    font-weight: bold;
    opacity: unset;
    font-size: 1.125rem;
    border: unset;
  }
`;

const messages = defineMessages({
  noTitle: {
    defaultMessage: 'No title',
    description:
      'Title placeholder when no title is defined for this classroom',
    id: 'components.ClassroomInfoBar.noTitle',
  },
  placeholderTitleInput: {
    defaultMessage: 'Enter title of your classroom here',
    description:
      'A placeholder text indicating the purpose of the input and what it is supposed to received.',
    id: 'components.ClassroomInfoBar.placeholderTitleInput',
  },
  updateClassroomSucces: {
    defaultMessage: 'Classroom updated.',
    description: 'Message displayed when classroom is successfully updated.',
    id: 'components.ClassroomInfoBar.updateClassroomSucces',
  },
  updateClassroomFail: {
    defaultMessage: 'Classroom update has failed!',
    description: 'Message displayed when classroom update has failed.',
    id: 'components.ClassroomInfoBar.updateClassroomFail',
  },
  updateTitleBlank: {
    defaultMessage: "Title can't be blank!",
    description:
      'Message displayed when the user tried to enter a blank title.',
    id: 'components.ClassroomInfoBar.updateTitleBlank',
  },
});

interface ClassroomInfoBarProps extends BoxProps {
  startDate: Nullable<string>;
}

export const ClassroomInfoBar = ({
  startDate,
  ...props
}: ClassroomInfoBarProps) => {
  const classroom = useCurrentClassroom();
  const intl = useIntl();

  const [title, setTitle] = useState<string>(
    classroom.title || intl.formatMessage(messages.noTitle),
  );

  const localStartDate = useMemo(() => {
    if (!startDate) {
      return null;
    }
    const dt = DateTime.fromISO(startDate);
    return dt.isValid ? dt.setLocale(intl.locale).toFormat('D  ·  tt') : null;
  }, [startDate, intl.locale]);

  const classroomMutation = useUpdateClassroom(classroom.id, {
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.updateClassroomSucces), {
        position: 'bottom-center',
      });
    },
    onError: (err, variables) => {
      if ('title' in variables) {
        setTitle(classroom.title || intl.formatMessage(messages.noTitle));
      }
      report(err);
      toast.error(intl.formatMessage(messages.updateClassroomFail), {
        position: 'bottom-center',
      });
    },
  });

  const updateClassroom = useCallback(
    (updatedVideoProperty: Partial<Classroom>) => {
      if (updatedVideoProperty.title === '') {
        toast.error(intl.formatMessage(messages.updateTitleBlank), {
          position: 'bottom-center',
        });
        setTitle(classroom.title || intl.formatMessage(messages.noTitle));
        return;
      }
      classroomMutation.mutate(updatedVideoProperty);
    },
    [classroomMutation, intl, classroom.title],
  );

  useEffect(() => {
    setTitle(classroom.title || intl.formatMessage(messages.noTitle));
  }, [intl, classroom.title]);

  const handleChange = (inputText: string) => {
    setTitle(inputText);
    updateClassroom({ title: inputText });
  };

  return (
    <Box
      direction="column"
      justify="center"
      style={{ flexBasis: '0%', minWidth: '0' }}
      {...props}
    >
      <Box
        margin={{ right: 'small' }}
        gap="small"
        alignContent="center"
        direction="row"
      >
        <StyledTitleTextInput
          icon={
            <EditionSVG
              iconColor={normalizeColor('blue-chat', theme)}
              width="25px"
              height="25px"
              containerStyle={{ margin: 'auto', marginRight: '8px' }}
            />
          }
          onBlur={(event) => handleChange(event.target.value)}
          placeholder={intl.formatMessage(messages.placeholderTitleInput)}
          setValue={(value) => setTitle(value)}
          title={intl.formatMessage(messages.placeholderTitleInput)}
          value={title}
          plain
          reverse
        />
      </Box>
      <Box direction="row">
        {localStartDate && (
          <Paragraph
            color="blue-active"
            margin={{ right: 'large', bottom: 'small' }}
            size="xsmall"
          >
            {localStartDate}
          </Paragraph>
        )}
      </Box>
    </Box>
  );
};
