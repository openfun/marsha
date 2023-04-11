import { Text, Button } from 'grommet';
import { Filter } from 'grommet-icons';
import { Breakpoints } from 'lib-common';
import { Playlist, useResponsive } from 'lib-components';
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
  active: boolean;
}

const ButtonFilter = styled(Button)<ButtonFilterProps>`
  box-shadow: inset 0px 0px 0px 0px rgba(2, 117, 180, 0.3),
    rgba(2, 117, 180, 0.3) 2px 2px 3px 0px;
  border-radius: 25px;
  border: none;
  display: flex;
  padding: 7px 13px;
  width: fit-content;
  transition: all 0.3s ease-in-out;
  background: #fff;
  & > span {
    align-items: center;
    display: flex;
    gap: 10px;
    justify-content: center;
  }
  ${({ active }) =>
    active
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
  setFilter: (filter: ContentFilter) => void;
}

const ContentsFilter = ({ setFilter }: ContentsFilterProps) => {
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

  return (
    <Fragment>
      <ButtonFilter
        margin={{
          horizontal: 'small',
          top: 'small',
          bottom: showFilter ? 'small' : '0px',
        }}
        style={{
          transition: 'all 0.3s ease-in-out',
        }}
        label={
          <Text size="small" color="blue-active">
            <Filter color="blue-active" size="20px" />
            {intl.formatMessage(messages.labelFilter)}
          </Text>
        }
        onClick={() => setShowFilter(!showFilter)}
        active={showFilter}
      />
      <WhiteCard
        pad={showFilter ? 'medium' : '0px'}
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
        }}
      >
        {selectPlaylist}
      </WhiteCard>
    </Fragment>
  );
};

export default ContentsFilter;
