import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  Text,
} from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Link, useHistory } from 'react-router-dom';
import styled from 'styled-components';

import { useVideos } from '../../data/queries';
import { Video } from '../../types/tracks';
import { theme } from '../../utils/theme/theme';
import { ErrorMessage } from '../ErrorComponents';
import { Spinner } from '../Loader';
import { UploadableObjectStatusBadge } from '../UploadableObjectStatusBadge';

const messages = defineMessages({
  emptyTable: {
    defaultMessage: 'There are no videos for this list yet.',
    description: 'Empty state for the table in the videos list.',
    id: 'components.VideosList.emptyTable',
  },
  loadingVideosList: {
    defaultMessage: 'Loading videos...',
    description:
      'Accessible message for the spinner while loading videos in the videos list.',
    id: 'components.VideosList.loadingVideosList',
  },
  thUploadState: {
    defaultMessage: 'Upload state',
    description:
      'Column title for the upload state column in the list of videos.',
    id: 'components.VideosList.thUploadState',
  },
  thPlaylistTitle: {
    defaultMessage: 'Playlist',
    description:
      'Column title for the playlist title column in the list of videos.',
    id: 'components.VideosList.thPlaylistTitle',
  },
  thTitle: {
    defaultMessage: 'Title',
    description: 'Column title for the title column in the list of videos.',
    id: 'components.VideosList.thTitle',
  },
});

const VideoTitleLink = styled(Link)`
  &,
  &:active {
    text-decoration: none;
    color: black;
  }

  &:hover {
    text-decoration: underline;
    color: ${normalizeColor('brand', theme)};
  }
`;

const TableRowLinkable = styled(TableRow)`
  ${({ onClick }) =>
    !!onClick
      ? `
    cursor: pointer;

    &:hover {
      background: ${normalizeColor('light-4', theme)};
    }
  `
      : ''}
`;

const VideosListStructure: React.FC = ({ children }) => (
  <Box width="full">
    <Table width="full">
      <TableHeader>
        <TableRow>
          <TableCell scope="col">
            <Text>
              <FormattedMessage {...messages.thTitle} />
            </Text>
          </TableCell>
          <TableCell scope="col">
            <Text>
              <FormattedMessage {...messages.thPlaylistTitle} />
            </Text>
          </TableCell>
          <TableCell scope="col">
            <Text>
              <FormattedMessage {...messages.thUploadState} />
            </Text>
          </TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>{children}</TableBody>
    </Table>
  </Box>
);

interface VideosListProps {
  getRowLink?: (video: Video) => string;
  params?: { organization?: string; playlist?: string };
}

export const VideosList: React.FC<VideosListProps> = ({
  getRowLink,
  params,
}) => {
  const history = useHistory();
  const { data, status } = useVideos(params || {});

  switch (status) {
    case 'idle':
    case 'loading':
      return (
        <VideosListStructure>
          <TableRow>
            <TableCell colSpan={3}>
              <Box
                fill="horizontal"
                align="center"
                pad={{ vertical: 'xlarge' }}
              >
                <Spinner size="large">
                  <FormattedMessage {...messages.loadingVideosList} />
                </Spinner>
              </Box>
            </TableCell>
          </TableRow>
        </VideosListStructure>
      );

    case 'error':
      return (
        <VideosListStructure>
          <TableRow>
            <TableCell colSpan={3}>
              <ErrorMessage code="generic" />
            </TableCell>
          </TableRow>
        </VideosListStructure>
      );

    case 'success':
      return (
        <VideosListStructure>
          {data!.count === 0 ? (
            <TableRow>
              <TableCell colSpan={3} pad="medium" align="center">
                <FormattedMessage {...messages.emptyTable} />
              </TableCell>
            </TableRow>
          ) : (
            <React.Fragment>
              {data!.results.map((video) => (
                <TableRowLinkable
                  key={video.id}
                  {...(getRowLink
                    ? {
                        onClick: () => history.push(getRowLink(video)),
                      }
                    : {})}
                >
                  <TableCell scope="row">
                    {getRowLink ? (
                      <VideoTitleLink to={getRowLink(video)}>
                        {video.title}
                      </VideoTitleLink>
                    ) : (
                      video.title
                    )}
                  </TableCell>
                  <TableCell>{video.playlist.title}</TableCell>
                  <TableCell>
                    <UploadableObjectStatusBadge object={video} />
                  </TableCell>
                </TableRowLinkable>
              ))}
            </React.Fragment>
          )}
        </VideosListStructure>
      );
  }
};
