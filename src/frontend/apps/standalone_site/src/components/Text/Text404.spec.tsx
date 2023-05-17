import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import Text404 from './Text404';

describe('<Text404 />', () => {
  test('renders Text404', () => {
    render(<Text404 />);

    expect(
      screen.getByText(/Sorry, this page does not exist./i),
    ).toBeInTheDocument();
  });
});
