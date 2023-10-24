import { Pagination } from '@openfun/cunningham-react';
import { UseQueryResult } from '@tanstack/react-query';
import { APIList, Box, ContentCards } from 'lib-components';
import { Fragment } from 'react';
import styled from 'styled-components';

import useContentPerPage from '../../hooks/useContentPerPage';
import ContentsFilter, {
  ContentsFilterProps,
} from '../ContentsFilter/ContentsFilter';
import ManageAPIState from '../ManageAPIState/ManageAPIState';

const BoxPagination = styled(Box)`
  .c__pagination__goto {
    display: none;
  }
  .c__pagination__list {
    border: none;
    background: none;
  }
`;

interface ContentsWrapperProps<ContentType> extends ContentsFilterProps {
  apiResponse: UseQueryResult<APIList<ContentType>>;
  dataComponent: (data: ContentType, index: number) => JSX.Element;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  withPagination: boolean;
  withFilter: boolean;
  noContentMessage?: string;
}

const ContentsWrapper = <ContentType,>({
  apiResponse,
  dataComponent,
  currentPage,
  filter,
  setCurrentPage,
  setFilter,
  withPagination,
  withFilter,
  noContentMessage,
}: ContentsWrapperProps<ContentType>) => {
  const { isLoading, isFetching, isError, data: dataset } = apiResponse;
  const contentPerPage = useContentPerPage();

  return (
    <Fragment>
      {withFilter && (
        <ContentsFilter
          filter={filter}
          setFilter={(newFilter) => setFilter(newFilter)}
        />
      )}
      <ManageAPIState
        isError={isError}
        isLoading={isLoading}
        hasResult={!!dataset?.results.length}
        nothingToDisplay={noContentMessage}
      >
        <ContentCards style={isFetching ? { filter: 'blur(8px)' } : {}}>
          {dataset?.results.map((data, index) => dataComponent(data, index))}
        </ContentCards>
        {(dataset?.count || 0) > contentPerPage && withPagination && (
          <BoxPagination align="center" margin={{ top: 'large' }}>
            <Pagination
              pageSize={contentPerPage}
              page={currentPage}
              pagesCount={Math.ceil((dataset?.count || 0) / contentPerPage)}
              onPageChange={(newPage) => {
                setCurrentPage(newPage);
                setTimeout(() => {
                  scrollTo({
                    top: 0,
                    behavior: 'smooth',
                  });
                }, 200);
              }}
            />
          </BoxPagination>
        )}
      </ManageAPIState>
    </Fragment>
  );
};

export default ContentsWrapper;
