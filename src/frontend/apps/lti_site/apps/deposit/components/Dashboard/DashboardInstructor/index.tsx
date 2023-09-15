import { Select } from '@openfun/cunningham-react';
import { Box, Pagination, Paragraph, Text } from 'grommet';
import { Maybe } from 'lib-common';
import { FileDepository, Heading, Loader } from 'lib-components';
import React, { FocusEvent, useState } from 'react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';

import { DepositedFileRow } from 'apps/deposit/components/Dashboard/common/DepositedFileRow';
import {
  useDepositedFiles,
  useUpdateFileDepository,
} from 'apps/deposit/data/queries';

type SelectProps = React.ComponentPropsWithoutRef<typeof Select>;

const PAGE_SIZE = 10;

const messages = defineMessages({
  currentPaginatedItems: {
    defaultMessage: 'Showing {firstIndex} - {lastIndex} of {total}',
    description: 'Message to inform the user of the current displayed files.',
    id: 'apps.deposit.components.DashboardInstructor.currentPaginatedItems',
  },
  noTitle: {
    defaultMessage: 'Click here to add a title',
    description: 'Instruction message to set a title for a file deposit',
    id: 'apps.deposit.components.DashboardInstructor.noTitle',
  },
  noDescription: {
    defaultMessage: 'Click here to add a description',
    description: 'Instruction message to set a description for a file deposit',
    id: 'apps.deposit.components.DashboardInstructor.noDescription',
  },
  fetchFilesError: {
    defaultMessage: 'Error fetching files',
    description: 'Error message when fetching files.',
    id: 'apps.deposit.components.DashboardInstructor.fetchFilesError',
  },
  readFilterOptionsAll: {
    defaultMessage: 'All',
    description: 'Filter option for all files.',
    id: 'apps.deposit.components.DashboardInstructor.readFilterOptionsAll',
  },
  readFilterOptionsUnread: {
    defaultMessage: 'Unread',
    description: 'Filter option for unread files.',
    id: 'apps.deposit.components.DashboardInstructor.readFilterOptionsUnread',
  },
  readFilterOptionsRead: {
    defaultMessage: 'Read',
    description: 'Filter option for read files.',
    id: 'apps.deposit.components.DashboardInstructor.readFilterOptionsRead',
  },
  readFilterTitle: {
    defaultMessage: 'Filter files',
    description: 'Title for filter files select.',
    id: 'apps.deposit.components.DashboardInstructor.readFilterTitle',
  },
  readFilterPlaceholder: {
    defaultMessage: 'Filter',
    description: 'Placeholder for filter files select.',
    id: 'apps.deposit.components.DashboardInstructor.readFilterPlaceholder',
  },
  filesListHeader: {
    defaultMessage: 'Students files',
    description: 'Header for student files list.',
    id: 'apps.deposit.components.DashboardInstructor.filesListHeader',
  },
});

interface DashboardInstructorProps {
  fileDepository: FileDepository;
}

export const DashboardInstructor = ({
  fileDepository,
}: DashboardInstructorProps) => {
  const intl = useIntl();
  const [depositedFilesOffset, setDepositedFilesOffset] = useState(0);
  const [indices, setIndices] = useState([0, PAGE_SIZE]);
  const [readFilter, setReadFilter] = useState<Maybe<string>>(undefined);

  const { data, isError, isLoading } = useDepositedFiles(
    fileDepository.id,
    {
      limit: `${PAGE_SIZE}`,
      offset: `${depositedFilesOffset}`,
      read: readFilter,
    },
    {
      keepPreviousData: true,
    },
  );
  const readFilterOptions = [
    {
      label: intl.formatMessage(messages.readFilterOptionsAll),
      value: undefined,
    },
    {
      label: intl.formatMessage(messages.readFilterOptionsUnread),
      value: 'false',
    },
    {
      label: intl.formatMessage(messages.readFilterOptionsRead),
      value: 'true',
    },
  ];

  const onReadFilterChange: SelectProps['onChange'] = (event) => {
    setReadFilter(event.target.value as Maybe<string>);
  };

  const { mutate } = useUpdateFileDepository(fileDepository.id);

  const onFocusTitle = (event: FocusEvent) => {
    if (event.target.textContent === intl.formatMessage(messages.noTitle)) {
      event.target.textContent = '';
    }
  };
  const onBlurTitle = (event: FocusEvent) => {
    mutate({ title: event.target.textContent });
    if (event.target.textContent === '') {
      event.target.textContent = intl.formatMessage(messages.noTitle);
    }
  };

  const onFocusDescription = (event: FocusEvent) => {
    if (
      event.target.textContent === intl.formatMessage(messages.noDescription)
    ) {
      event.target.textContent = '';
    }
  };

  const onBlurDescription = (event: FocusEvent) => {
    mutate({ description: event.target.textContent });
    if (event.target.textContent === '') {
      event.target.textContent = intl.formatMessage(messages.noDescription);
    }
  };

  return (
    <React.Fragment>
      <Box
        background="white"
        elevation="medium"
        fill
        pad="xlarge"
        round="xsmall"
      >
        <Heading
          contentEditable={true}
          onBlur={onBlurTitle}
          onFocus={onFocusTitle}
          suppressContentEditableWarning={true}
          style={{ lineHeight: '50px' }}
        >
          {fileDepository.title || intl.formatMessage(messages.noTitle)}
        </Heading>
        <Paragraph
          contentEditable={true}
          onBlur={onBlurDescription}
          onFocus={onFocusDescription}
          suppressContentEditableWarning={true}
        >
          {fileDepository.description ||
            intl.formatMessage(messages.noDescription)}
        </Paragraph>
      </Box>

      <Box
        background="white"
        elevation="medium"
        fill
        margin={{ top: 'small' }}
        pad="xlarge"
        round="xsmall"
      >
        <Heading>
          <FormattedMessage {...messages.filesListHeader} />
        </Heading>
        {isLoading ? (
          <Loader />
        ) : isError ? (
          <FormattedMessage {...messages.fetchFilesError} />
        ) : (
          data && (
            <React.Fragment>
              <Box
                align="center"
                direction="row"
                justify="between"
                pad="medium"
              >
                <Select
                  aria-label={intl.formatMessage(messages.readFilterTitle)}
                  label={intl.formatMessage(messages.readFilterTitle)}
                  onChange={onReadFilterChange}
                  options={readFilterOptions}
                  value={readFilter}
                />
                <Text>
                  <FormattedMessage
                    {...messages.currentPaginatedItems}
                    values={{
                      firstIndex: indices[0] + 1,
                      lastIndex: Math.min(indices[1], data.count),
                      total: data.count,
                    }}
                  />
                </Text>
                <Pagination
                  step={PAGE_SIZE}
                  numberItems={data.count}
                  onChange={({
                    startIndex,
                    endIndex,
                  }: {
                    startIndex: number;
                    endIndex: number;
                  }) => {
                    setDepositedFilesOffset(startIndex);
                    setIndices([startIndex, Math.min(endIndex, data.count)]);
                  }}
                />
              </Box>
              <Box fill margin={{ top: 'small' }} pad="medium" round="xsmall">
                {data.results.map((file) => (
                  <DepositedFileRow key={file.id} file={file} />
                ))}
              </Box>
            </React.Fragment>
          )
        )}
      </Box>
    </React.Fragment>
  );
};
