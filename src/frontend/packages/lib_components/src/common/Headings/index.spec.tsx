import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import { Heading, HeadingPropsOnly } from './';

describe('<Heading />', () => {
  it('renders the component and children by default', () => {
    render(<Heading>My Heading</Heading>);

    const typo = screen.getByText('My Heading');
    expect(typo).toBeInTheDocument();
    expect(typo).toHaveClass('fs-h fs-h1');
    expect(typo.tagName).toBe('H1');
  });

  [1, 2, 3, 4, 5, 6].forEach((level) => {
    it(`renders the component and children with level ${level}`, () => {
      render(
        <Heading level={level as HeadingPropsOnly['level']}>
          My Heading {level}
        </Heading>,
      );

      const typo = screen.getByText(`My Heading ${level}`);
      expect(typo).toBeInTheDocument();
      expect(typo).toHaveClass(`fs-h fs-h${level}`);
      expect(typo.tagName).toBe(`H${level}`);
    });
  });

  it('throws an error if level is not in the range', () => {
    jest.spyOn(console, 'error').mockImplementation(() => jest.fn());

    const level = 7;
    expect(() =>
      render(
        <Heading level={level as HeadingPropsOnly['level']}>
          My Heading
        </Heading>,
      ),
    ).toThrow(`Heading level must be between 1 and 6`);

    jest.restoreAllMocks();
  });
});
