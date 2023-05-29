import { Pagination } from 'grommet';
import { APIList, ContentCards } from 'lib-components';
import { Fragment } from 'react';
import { UseQueryResult } from 'react-query';

import useContentPerPage from '../../hooks/useContentPerPage';
import ContentsFilter, {
  ContentsFilterProps,
} from '../ContentsFilter/ContentsFilter';
import ManageAPIState from '../ManageAPIState/ManageAPIState';

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
          <Pagination
            numberItems={dataset?.count || 0}
            onChange={({ page: newPage }: { page: number }) => {
              setCurrentPage(newPage);
              setTimeout(() => {
                scrollTo({
                  top: 0,
                  behavior: 'smooth',
                });
              }, 200);
            }}
            page={currentPage}
            step={contentPerPage}
            alignSelf="center"
            margin={{ top: '2rem' }}
          />
        )}
      </ManageAPIState>
    </Fragment>
  );
};

export default ContentsWrapper;
