import { Box } from 'grommet';
import { ClassroomSharedNote, FoldableItem, ItemList } from 'lib-components';
import React from 'react';
import { useIntl, defineMessages } from 'react-intl';

import { useCurrentClassroom } from '@lib-classroom/hooks/useCurrentClassroom';

const messages = defineMessages({
  title: {
    defaultMessage: 'Shared notes',
    description: 'Label for shared notes download in classroom form.',
    id: 'component.SharedNotes.title',
  },
  info: {
    defaultMessage: `All available shared notes can be downloaded here.`,
    description: 'Helptext for the widget.',
    id: 'component.SharedNotes.info',
  },
  noSharedNoteAvailable: {
    defaultMessage: 'No shared note available',
    description: 'Message when no recordings are available.',
    id: 'component.SharedNotes.noSharedNoteAvailable',
  },
  downloadSharedNoteLabel: {
    defaultMessage: 'Download shared note',
    description: 'Label for download recording button.',
    id: 'component.SharedNotes.downloadSharedNoteLabel',
  },
});

export const SharedNotes = () => {
  const classroom = useCurrentClassroom();
  const intl = useIntl();

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <ItemList
        itemList={classroom.shared_notes}
        noItemsMessage={intl.formatMessage(messages.noSharedNoteAvailable)}
      >
        {(sharedNote: ClassroomSharedNote) => (
          <Box
            key={sharedNote.id}
            direction="row"
            align="center"
            fill="horizontal"
            height="60px"
            gap="medium"
            pad="small"
          >
            <a
              title={intl.formatMessage(messages.downloadSharedNoteLabel)}
              href={sharedNote.shared_note_url}
              target="_blank"
              rel="noreferrer noopener"
            >
              {intl.formatDate(sharedNote.updated_on, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              }) +
                ' - ' +
                intl.formatDate(sharedNote.updated_on, {
                  hour: 'numeric',
                  minute: 'numeric',
                })}
            </a>
          </Box>
        )}
      </ItemList>
    </FoldableItem>
  );
};
