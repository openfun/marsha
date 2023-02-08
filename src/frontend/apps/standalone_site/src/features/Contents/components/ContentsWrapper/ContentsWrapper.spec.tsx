import { screen } from '@testing-library/react';
import { APIList } from 'lib-components';
import { render } from 'lib-tests';
import { Fragment } from 'react';
import { UseQueryResult } from 'react-query';

import ContentsWrapper from './ContentsWrapper';

const TestComponent = ({
  isLoading = false,
  isError = false,
  results = [],
  withPagination = true,
}: {
  isLoading?: boolean;
  isError?: boolean;
  results?: string[];
  withPagination?: boolean;
}) => {
  return (
    <ContentsWrapper
      apiResponse={
        {
          isLoading,
          isError,
          data: {
            results,
            count: 21,
          },
        } as unknown as UseQueryResult<APIList<string[]>>
      }
      dataComponent={(data, index) => <Fragment key={index}>{data}</Fragment>}
      currentPage={1}
      setCurrentPage={(page) => {
        page;
      }}
      noContentMessage="No Content Message"
      withPagination={withPagination}
    />
  );
};

describe('<ContentsWrapper />', () => {
  test('renders ContentsWrapper with Error', () => {
    render(<TestComponent isError />);
    expect(
      screen.getByText(/Sorry, an error has occurred./),
    ).toBeInTheDocument();
  });

  test('renders ContentsWrapper with Loading', () => {
    render(<TestComponent isLoading />);
    expect(
      screen.getByRole('alert', {
        name: /spinner/i,
      }),
    ).toBeInTheDocument();
  });

  test('renders ContentsWrapper with nothing to display', () => {
    render(<TestComponent />);
    expect(screen.getByText(/No Content Message/)).toBeInTheDocument();
  });

  test('renders ContentsWrapper with results', () => {
    render(<TestComponent results={['john', 'kent', 'louis']} />);
    expect(screen.getByText(/john/)).toBeInTheDocument();
    expect(screen.getByText(/kent/)).toBeInTheDocument();
    expect(screen.getByText(/louis/)).toBeInTheDocument();
  });

  test('renders ContentsWrapper with pagination', () => {
    render(<TestComponent results={['john', 'kent', 'louis']} />);
    expect(screen.getByLabelText(/Go to next page/)).toBeInTheDocument();
  });

  test('renders ContentsWrapper without pagination', () => {
    render(
      <TestComponent
        results={['john', 'kent', 'louis']}
        withPagination={false}
      />,
    );
    expect(screen.queryByLabelText(/Go to next page/)).not.toBeInTheDocument();
  });
});
