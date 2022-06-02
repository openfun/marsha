import { render } from '@testing-library/react';
import React from 'react';
import { ResponsiveContext } from 'grommet';

import { InfoWidgetModalProvider } from 'data/stores/useInfoWidgetModal';
import { DashboardVideoLiveWidgetsContainer } from '.';

const GenericComponent1 = () => <p>Generic component 1</p>;
const GenericComponent2 = () => <p>Generic component 2</p>;
const GenericComponent3 = () => <p>Generic component 3</p>;
const GenericComponent4 = () => <p>Generic component 4</p>;
const GenericComponent5 = () => <p>Generic component 5</p>;
const GenericComponent6 = () => <p>Generic component 6</p>;

const genericComponentsList = [
  <GenericComponent1 key="1" />,
  <GenericComponent2 key="2" />,
  <GenericComponent3 key="3" />,
  <GenericComponent4 key="4" />,
  <GenericComponent5 key="5" />,
  <GenericComponent6 key="6" />,
];

describe('<DashboardVideoLiveWidgetContainer />', () => {
  it('renders DashboardVideoLiveWidgetContainer empty', () => {
    const { container } = render(
      <InfoWidgetModalProvider value={null}>
        <DashboardVideoLiveWidgetsContainer>
          {[]}
        </DashboardVideoLiveWidgetsContainer>
      </InfoWidgetModalProvider>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders DashboardVideoLiveWidgetContainer on a large screen', () => {
    const { container } = render(
      <ResponsiveContext.Provider value="large">
        <InfoWidgetModalProvider value={null}>
          <DashboardVideoLiveWidgetsContainer>
            {genericComponentsList}
          </DashboardVideoLiveWidgetsContainer>
        </InfoWidgetModalProvider>
      </ResponsiveContext.Provider>,
    );

    const parentContainer = container.firstChild;
    expect(parentContainer).not.toBeNull();

    // 3 columns and 2 divs used for gap between them
    expect(parentContainer!.childNodes.length).toEqual(3 + 2);

    const column1 = parentContainer!.childNodes[0];
    const column2 = parentContainer!.childNodes[2];
    const column3 = parentContainer!.childNodes[4];

    expect(column1.childNodes[0].firstChild!.textContent).toEqual(
      'Generic component 1',
    );
    expect(column1.childNodes[2].firstChild!.textContent).toEqual(
      'Generic component 4',
    );

    expect(column2.childNodes[0].firstChild!.textContent).toEqual(
      'Generic component 2',
    );
    expect(column2.childNodes[2].firstChild!.textContent).toEqual(
      'Generic component 5',
    );

    expect(column3.childNodes[0].firstChild!.textContent).toEqual(
      'Generic component 3',
    );
    expect(column3.childNodes[2].firstChild!.textContent).toEqual(
      'Generic component 6',
    );
  });

  it('renders DashboardVideoLiveWidgetContainer on a medium screen', () => {
    const { container } = render(
      <ResponsiveContext.Provider value="medium">
        <InfoWidgetModalProvider value={null}>
          <DashboardVideoLiveWidgetsContainer>
            {genericComponentsList}
          </DashboardVideoLiveWidgetsContainer>
        </InfoWidgetModalProvider>
      </ResponsiveContext.Provider>,
    );

    expect(container.firstChild).not.toBeNull();
    const parentContainer = container.firstChild;

    // 2 columns and 1 div used for gap between them
    expect(parentContainer!.childNodes.length).toEqual(2 + 1);

    const column1 = parentContainer!.childNodes[0];
    const column2 = parentContainer!.childNodes[2];

    expect(column1.childNodes[0].firstChild!.textContent).toEqual(
      'Generic component 1',
    );
    expect(column1.childNodes[2].firstChild!.textContent).toEqual(
      'Generic component 3',
    );
    expect(column1.childNodes[4].firstChild!.textContent).toEqual(
      'Generic component 5',
    );

    expect(column2.childNodes[0].firstChild!.textContent).toEqual(
      'Generic component 2',
    );
    expect(column2.childNodes[2].firstChild!.textContent).toEqual(
      'Generic component 4',
    );
    expect(column2.childNodes[4].firstChild!.textContent).toEqual(
      'Generic component 6',
    );
  });

  it('renders DashboardVideoLiveWidgetContainer on a small screen', () => {
    const { container } = render(
      <ResponsiveContext.Provider value="small">
        <InfoWidgetModalProvider value={null}>
          <DashboardVideoLiveWidgetsContainer>
            {genericComponentsList}
          </DashboardVideoLiveWidgetsContainer>
        </InfoWidgetModalProvider>
      </ResponsiveContext.Provider>,
    );

    expect(container.firstChild).not.toBeNull();
    const parentContainer = container.firstChild;

    // 1 column and 0 div used for gap between
    expect(parentContainer!.childNodes.length).toEqual(1 + 0);

    const column1 = parentContainer!.childNodes[0];

    expect(column1.childNodes[0].firstChild!.textContent).toEqual(
      'Generic component 1',
    );
    expect(column1.childNodes[2].firstChild!.textContent).toEqual(
      'Generic component 2',
    );
    expect(column1.childNodes[4].firstChild!.textContent).toEqual(
      'Generic component 3',
    );
    expect(column1.childNodes[6].firstChild!.textContent).toEqual(
      'Generic component 4',
    );
    expect(column1.childNodes[8].firstChild!.textContent).toEqual(
      'Generic component 5',
    );
    expect(column1.childNodes[10].firstChild!.textContent).toEqual(
      'Generic component 6',
    );
  });
});
