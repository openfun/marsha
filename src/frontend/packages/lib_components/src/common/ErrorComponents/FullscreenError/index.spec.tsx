import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import { ErrorComponents, FullScreenError } from '.';

describe('<FullScreenError />', () => {
  it('displays the content for 404 not found errors', () => {
    render(<FullScreenError code={ErrorComponents.notFound} />);

    expect(
      screen.getByText('The video you are looking for could not be found'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'This video does not exist or has not been published yet. If you are an instructor, please make sure you are properly authenticated.',
      ),
    ).toBeInTheDocument();
  });

  it('displays the content for lti related errors', () => {
    render(<FullScreenError code={ErrorComponents.lti} />);
    expect(
      screen.getByText('There was an error loading this video'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'We could not validate your access to this video. Please contact your instructor. If you are the instructor, please check your settings.',
      ),
    ).toBeInTheDocument();
  });
});
