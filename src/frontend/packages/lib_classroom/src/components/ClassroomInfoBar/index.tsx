import { Input } from '@openfun/cunningham-react';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import { Box, BoxProps, EditionSVG, report } from 'lib-components';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { useUpdateClassroom } from '@lib-classroom/data';
import { useCurrentClassroom } from '@lib-classroom/hooks/useCurrentClassroom';

const StyledBoxInput = styled(Box)`
  & .c__input__wrapper {
    border: none;
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

export const ClassroomInfoBar = (props: BoxProps<'div'>) => {
  const classroom = useCurrentClassroom();
  const intl = useIntl();

  const [title, setTitle] = useState<string>(
    classroom.title || intl.formatMessage(messages.noTitle),
  );

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

  const handleChange = useCallback(
    (inputText: string) => {
      setTitle(inputText);

      if (inputText) {
        classroomMutation.mutate({ title: inputText });
      }
    },
    [classroomMutation],
  );

  useEffect(() => {
    if (title === '') {
      toast.error(intl.formatMessage(messages.updateTitleBlank), {
        position: 'bottom-center',
      });
      setTitle(classroom.title || intl.formatMessage(messages.noTitle));
      return;
    }
  }, [intl, title, classroom.title]);

  useEffect(() => {
    setTitle(classroom.title || intl.formatMessage(messages.noTitle));
  }, [intl, classroom.title]);

  return (
    <Box
      justify="center"
      style={{ flex: 'auto' }}
      width={{ min: 'small' }}
      {...props}
    >
      <StyledBoxInput align="center" direction="row">
        <Input
          icon={
            <EditionSVG
              iconColor={normalizeColor('blue-chat', theme)}
              width="25px"
              height="25px"
              containerStyle={{ margin: 'auto' }}
            />
          }
          aria-label={intl.formatMessage(messages.placeholderTitleInput)}
          label={intl.formatMessage(messages.placeholderTitleInput)}
          fullWidth
          onBlur={(event) => handleChange(event.target.value)}
          value={title}
        />
      </StyledBoxInput>
    </Box>
  );
};
