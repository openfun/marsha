import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';
import { PropsWithChildren } from 'react';

import { InfoWidgetModalProvider } from '@lib-components/hooks/stores/useInfoWidgetModal';

import { FoldableItem } from '.';

const mockSetInfoWidgetModal = jest.fn();
jest.mock('hooks/stores/useInfoWidgetModal', () => ({
  useInfoWidgetModal: () => [
    { isVisible: false, text: null, title: null },
    mockSetInfoWidgetModal,
  ],
  InfoWidgetModalProvider: ({ children }: PropsWithChildren<{}>) => children,
}));

const GenericComponent = () => <p>Generic component</p>;

const genericTitle = 'An example title';
const genericInfoText = 'An example info text';

describe('<FoldableItem />', () => {
  it('renders FoldableItem opened, with an info text', () => {
    render(
      <InfoWidgetModalProvider value={null}>
        <FoldableItem
          initialOpenValue={true}
          infoText={genericInfoText}
          title={genericTitle}
        >
          <GenericComponent />
        </FoldableItem>
      </InfoWidgetModalProvider>,
    );
    screen.getByText(genericTitle);
    screen.getByText('Generic component');
    screen.getByRole('button', { name: genericTitle });
    const infoButton = screen.getAllByRole('button')[0];
    expect(infoButton).not.toBeDisabled();
    expect(screen.queryByText(genericInfoText)).toEqual(null);
  });

  it('renders FoldableItem closed without info text and clicks on the title.', async () => {
    render(
      <InfoWidgetModalProvider value={null}>
        <FoldableItem initialOpenValue={false} title={genericTitle}>
          <GenericComponent />
        </FoldableItem>
      </InfoWidgetModalProvider>,
    );
    screen.getByText(genericTitle);
    const openButton = screen.getByRole('button', { name: genericTitle });
    expect(screen.queryByText('Generic component')).toEqual(null);
    const infoButton = screen.queryByRole('button', { name: 'help' });
    expect(infoButton).not.toBeInTheDocument();
    expect(screen.queryByText(genericInfoText)).toEqual(null);

    await userEvent.click(openButton);
    screen.getByText('Generic component');
  });

  it('renders FoldableItem closed with info text and clicks on info button', async () => {
    render(
      <InfoWidgetModalProvider value={null}>
        <FoldableItem
          initialOpenValue={false}
          infoText={genericInfoText}
          title={genericTitle}
        >
          <GenericComponent />
        </FoldableItem>
      </InfoWidgetModalProvider>,
    );
    screen.getByText(genericTitle);
    screen.getByRole('button', { name: genericTitle });
    expect(screen.queryByText('Generic component')).toEqual(null);
    const infoButton = screen.getByRole('button', {
      name: 'help',
    });
    expect(screen.queryByText(genericInfoText)).toEqual(null);

    await userEvent.click(infoButton);
    expect(mockSetInfoWidgetModal).toHaveBeenCalled();
    expect(mockSetInfoWidgetModal).toHaveBeenCalledWith({
      title: genericTitle,
      text: genericInfoText,
      refWidget: expect.any(HTMLDivElement),
    });
  });
});
