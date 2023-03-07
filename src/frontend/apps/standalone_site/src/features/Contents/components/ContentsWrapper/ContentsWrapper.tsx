import { Pagination } from 'grommet';
import { APIList, ContentCards } from 'lib-components';
import { UseQueryResult } from 'react-query';

import { useContentPerPage } from 'features/Contents';

import ManageAPIState from '../ManageAPIState/ManageAPIState';

interface ContentsWrapperProps<ContentType> {
  apiResponse: UseQueryResult<APIList<ContentType>>;
  dataComponent: (data: ContentType, index: number) => JSX.Element;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  noContentMessage?: string;
  withPagination?: boolean;
}

const ContentsWrapper = <ContentType,>({
  apiResponse,
  dataComponent,
  currentPage,
  setCurrentPage,
  noContentMessage,
  withPagination = true,
}: ContentsWrapperProps<ContentType>) => {
  const { isLoading, isFetching, isError, data: dataset } = apiResponse;
  const contentPerPage = useContentPerPage();

  return (
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
  );
};

export default ContentsWrapper;
