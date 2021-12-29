import {
  Box,
  Heading,
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
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { usePlaylists } from '../../data/queries';
import { theme } from '../../utils/theme/theme';
import { ErrorMessage } from '../ErrorComponents';
import { Loader } from '../Loader';

const messages = defineMessages({
  emptyTable: {
    defaultMessage: 'There are no playlists for this organization yet.',
    description:
      'Empty state for the table in the organization view list of playlists.',
    id: 'components.OrganizationView.OrganizationPlaylists.emptyTable',
  },
  loadingPlaylists: {
    defaultMessage: 'Loading playlists...',
    description:
      'Accessible message for the spinner in the list of playlists for an organization.',
    id: 'components.OrganizationView.OrganizationPlaylists.loadingPlaylists',
  },
  thConsumerSite: {
    defaultMessage: 'Consumer site',
    description:
      'Column title for the consumer site column in the list of playlists.',
    id: 'components.OrganizationView.OrganizationPlaylists.thConsumerSite',
  },
  thLTIId: {
    defaultMessage: 'LTI ID',
    description: 'Column title for the LTI ID column in the list of playlists.',
    id: 'components.OrganizationView.OrganizationPlaylists.thLTIId',
  },
  thTitle: {
    defaultMessage: 'Title',
    description: 'Column title for the title column in the list of playlists.',
    id: 'components.OrganizationView.OrganizationPlaylists.thTitle',
  },
  title: {
    defaultMessage: 'Playlists',
    description: 'Title for the list of playlists in the organization view.',
    id: 'components.OrganizationView.OrganizationPlaylists.title',
  },
});

const TableRowLinked = styled(TableRow)`
  cursor: pointer;

  &:hover {
    background: ${normalizeColor('light-4', theme)};
  }
`;

const OrganizationPlaylistsStructure: React.FC = ({ children }) => (
  <Box width="full">
    <Heading level={2}>
      <FormattedMessage {...messages.title} />
    </Heading>
    {children}
  </Box>
);

interface OrganizationPlaylistsProps {
  organizationId: string;
}

export const OrganizationPlaylists: React.FC<OrganizationPlaylistsProps> = ({
  organizationId,
}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const { data, status } = usePlaylists({ organization: organizationId });

  switch (status) {
    case 'idle':
    case 'loading':
      return (
        <OrganizationPlaylistsStructure>
          <Loader>
            <FormattedMessage {...messages.loadingPlaylists} />
          </Loader>
        </OrganizationPlaylistsStructure>
      );

    case 'error':
      return (
        <OrganizationPlaylistsStructure>
          <ErrorMessage code="generic" />
        </OrganizationPlaylistsStructure>
      );

    case 'success':
      return (
        <OrganizationPlaylistsStructure>
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
                    <FormattedMessage {...messages.thLTIId} />
                  </Text>
                </TableCell>
                <TableCell scope="col">
                  <Text>
                    <FormattedMessage {...messages.thConsumerSite} />
                  </Text>
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data!.count === 0 ? (
                <TableRow>
                  <TableCell colSpan={3}>
                    <FormattedMessage {...messages.emptyTable} />
                  </TableCell>
                </TableRow>
              ) : (
                <React.Fragment>
                  {data!.results.map((playlist) => (
                    <TableRowLinked
                      key={playlist.id}
                      onClick={() => {
                        navigate(`${pathname}/playlist/${playlist.id}`);
                      }}
                    >
                      <TableCell scope="row">
                        <Link to={`${pathname}/playlist/${playlist.id}`}>
                          {playlist.title}
                        </Link>
                      </TableCell>
                      <TableCell>{playlist.lti_id}</TableCell>
                      <TableCell>{playlist.consumer_site}</TableCell>
                    </TableRowLinked>
                  ))}
                </React.Fragment>
              )}
            </TableBody>
          </Table>
        </OrganizationPlaylistsStructure>
      );
  }
};
