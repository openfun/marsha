import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import ContentsHeader from './ContentsHeader';

describe('<ContentsHeader />', () => {
  test('renders ContentsHeader', () => {
    render(<ContentsHeader>Webinar</ContentsHeader>);
    expect(screen.getByText('Webinar')).toBeInTheDocument();
  });
});
