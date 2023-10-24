import { Filter } from 'grommet-icons';
import { Breakpoints } from 'lib-common';
import { Badge, Box, Playlist, Text, useResponsive } from 'lib-components';
import { Fragment, useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { WhiteCard } from 'components/Cards';
import { useSelectPlaylist } from 'features/Playlist';

const messages = defineMessages({
  selectLabelPlaylist: {
    defaultMessage: 'Filter by playlist',
    description: 'Label for the select to filter by playlist',
    id: 'features.Contents.ContentsFilter.selectLabelPlaylist',
  },
  noFilterPlaylist: {
    defaultMessage: 'All',
    description: 'Label when no filter',
    id: 'features.Contents.ContentsFilter.noFilterPlaylist',
  },
  labelFilter: {
    defaultMessage: 'Filter',
    description: 'Label for filter',
    id: 'features.Contents.ContentsFilter.labelFilter',
  },
});

interface ButtonFilterProps {
  $active: boolean;
}

const ButtonFilter = styled(Box)<ButtonFilterProps>`
  box-shadow:
    inset 0px 0px 0px 0px rgba(2, 117, 180, 0.3),
    rgba(2, 117, 180, 0.3) 2px 2px 3px 0px;
  transition: all 0.3s ease-in-out;
  cursor: pointer;
  & > span {
    align-items: center;
    display: flex;
    gap: 10px;
    justify-content: center;
  }
  ${({ $active }) =>
    $active
      ? `
    &, &:focus:not(:focus-visible), &[tabindex] {
      box-shadow: inset 2px 2px 3px 0px rgba(2, 117, 180, 0.3),
        rgba(2, 117, 180, 0.3) 0px 0px 0px 0px;
    }`
      : `&:focus:not(:focus-visible) {
      outline: none;
      box-shadow: inset 0px 0px 0px 0px rgba(2, 117, 180, 0.3),
        rgba(2, 117, 180, 0.3) 2px 2px 3px 0px;
    }`}
`;

export interface ContentFilter {
  playlist: string;
}

export interface ContentsFilterProps {
  filter: ContentFilter;
  setFilter: (filter: ContentFilter) => void;
}

const ContentsFilter = ({ setFilter, filter }: ContentsFilterProps) => {
  const intl = useIntl();
  const [showFilter, setShowFilter] = useState(false);
  const [playlistOption, setPlaylistOption] = useState<Partial<Playlist>[]>([]);
  const { breakpoint, isSmallerBreakpoint } = useResponsive();
  const { selectPlaylist, playlistResponse } = useSelectPlaylist({
    formFieldProps: {
      label: intl.formatMessage(messages.selectLabelPlaylist),
      margin: { bottom: '0' },
      width: isSmallerBreakpoint(breakpoint, Breakpoints.small)
        ? '100%'
        : 'fit-content',
    },
    selectProps: {
      options: playlistOption,
      onChange: ({ value }) => {
        setFilter({ playlist: value as string });
      },
      value: filter.playlist,
    },
  });

  useEffect(() => {
    if (typeof playlistResponse?.results === 'undefined') {
      return;
    }

    setPlaylistOption((currentPlaylists) => [
      {
        title: intl.formatMessage(messages.noFilterPlaylist),
        id: '',
      },
      ...currentPlaylists,
      ...playlistResponse.results,
    ]);
  }, [playlistResponse?.results, intl]);

  const badgeCounter = Object.values(filter).filter((value) => value).length;

  return (
    <Fragment>
      <ButtonFilter
        role="button"
        onClick={() => setShowFilter(!showFilter)}
        $active={showFilter}
        width="fit-content"
        pad={{
          vertical: 'xsmall',
          horizontal: 'small',
        }}
        margin={{
          bottom: showFilter ? 'small' : 'none',
          horizontal: 'small',
          top: 'small',
        }}
        background="#fff"
        round="xlarge"
      >
        <Text>
          <Filter color="blue-active" size="20px" />
          {intl.formatMessage(messages.labelFilter)}
        </Text>
        {badgeCounter > 0 && (
          <Badge
            value={badgeCounter.toString()}
            position={{
              top: '-8px',
              right: '-8px',
            }}
          />
        )}
      </ButtonFilter>
      <WhiteCard
        pad={showFilter ? 'small' : 'none'}
        height={{ max: showFilter ? '300px' : '0px' }}
        style={{
          transform: showFilter ? 'scaleY(1)' : 'scaleY(0)',
          transformOrigin: 'top',
          opacity: showFilter ? '1' : '0',
          transition: 'all 0.3s ease-in-out',
          boxShadow: 'inset rgba(2, 117, 180, 0.3) 1px 1px 6px 0px',
        }}
        margin={{
          bottom: 'medium',
          horizontal: 'small',
          top: 'none',
        }}
      >
        {selectPlaylist}
      </WhiteCard>
    </Fragment>
  );
};

export default ContentsFilter;
