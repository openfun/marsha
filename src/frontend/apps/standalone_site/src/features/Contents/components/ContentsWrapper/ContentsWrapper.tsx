import { Pagination } from 'grommet';
import { APIList } from 'lib-components';
import { UseQueryResult } from 'react-query';

import { ITEM_PER_PAGE } from 'conf/global';

import { ContentCards } from '../ContentCard/ContentCard';
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

  return (
    <ManageAPIState
      isError={isError}
      isLoading={isLoading}
      itemsLength={dataset?.results.length || 0}
      nothingToDisplay={noContentMessage}
    >
      <ContentCards style={isFetching ? { filter: 'blur(8px)' } : {}}>
        {dataset?.results.map((data, index) => dataComponent(data, index))}
      </ContentCards>
      {(dataset?.count || 0) > ITEM_PER_PAGE && withPagination && (
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
          step={ITEM_PER_PAGE}
          alignSelf="center"
          margin={{ top: 'medium' }}
        />
      )}
    </ManageAPIState>
  );
};

export default ContentsWrapper;
