import { render } from 'lib-tests';
import React from 'react';

import { InfoWidgetModalProvider } from 'hooks/useInfoWidgetModal';

import { WidgetsContainer, WidgetSize } from '.';

const GenericComponent1 = () => <p>Generic component 1</p>;
const GenericComponent2 = () => <p>Generic component 2</p>;
const GenericComponent3 = () => <p>Generic component 3</p>;
const GenericComponent4 = () => <p>Generic component 4</p>;
const GenericComponent5 = () => <p>Generic component 5</p>;
const GenericComponent6 = () => <p>Generic component 6</p>;

const genericComponentsList = [
  { component: <GenericComponent1 key="1" />, size: WidgetSize.DEFAULT },
  { component: <GenericComponent2 key="2" />, size: WidgetSize.DEFAULT },
  { component: <GenericComponent3 key="3" />, size: WidgetSize.DEFAULT },
  { component: <GenericComponent4 key="4" />, size: WidgetSize.DEFAULT },
  { component: <GenericComponent5 key="5" />, size: WidgetSize.DEFAULT },
  { component: <GenericComponent6 key="6" />, size: WidgetSize.DEFAULT },
];

describe('<WidgetsContainer />', () => {
  it('renders WidgetsContainer empty', () => {
    const { elementContainer: container } = render(
      <InfoWidgetModalProvider value={null}>
        <WidgetsContainer>{[]}</WidgetsContainer>
      </InfoWidgetModalProvider>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders WidgetsContainer on a large screen', () => {
    const { elementContainer: container } = render(
      <InfoWidgetModalProvider value={null}>
        <WidgetsContainer>{genericComponentsList}</WidgetsContainer>
      </InfoWidgetModalProvider>,
      {
        grommetOptions: {
          responsiveSize: 'large',
        },
      },
    );

    const parentContainer = container!.firstChild;
    expect(parentContainer).not.toBeNull();

    // 3 columns and 2 divs used for gap between them
    expect(parentContainer!.childNodes.length).toEqual(3);

    const column1 = parentContainer!.childNodes[0];
    const column2 = parentContainer!.childNodes[1];
    const column3 = parentContainer!.childNodes[2];

    expect(column1.childNodes[0].firstChild!.textContent).toEqual(
      'Generic component 1',
    );
    expect(column1.childNodes[1].firstChild!.textContent).toEqual(
      'Generic component 4',
    );

    expect(column2.childNodes[0].firstChild!.textContent).toEqual(
      'Generic component 2',
    );
    expect(column2.childNodes[1].firstChild!.textContent).toEqual(
      'Generic component 5',
    );

    expect(column3.childNodes[0].firstChild!.textContent).toEqual(
      'Generic component 3',
    );
    expect(column3.childNodes[1].firstChild!.textContent).toEqual(
      'Generic component 6',
    );
  });

  it('renders WidgetsContainer on a medium screen', () => {
    const { elementContainer: container } = render(
      <InfoWidgetModalProvider value={null}>
        <WidgetsContainer>{genericComponentsList}</WidgetsContainer>
      </InfoWidgetModalProvider>,
      {
        grommetOptions: {
          responsiveSize: 'medium',
        },
      },
    );

    expect(container!.firstChild).not.toBeNull();
    const parentContainer = container!.firstChild;

    // 2 columns and 1 div used for gap between them
    expect(parentContainer!.childNodes.length).toEqual(2);

    const column1 = parentContainer!.childNodes[0];
    const column2 = parentContainer!.childNodes[1];

    expect(column1.childNodes[0].firstChild!.textContent).toEqual(
      'Generic component 1',
    );
    expect(column1.childNodes[1].firstChild!.textContent).toEqual(
      'Generic component 3',
    );
    expect(column1.childNodes[2].firstChild!.textContent).toEqual(
      'Generic component 5',
    );

    expect(column2.childNodes[0].firstChild!.textContent).toEqual(
      'Generic component 2',
    );
    expect(column2.childNodes[1].firstChild!.textContent).toEqual(
      'Generic component 4',
    );
    expect(column2.childNodes[2].firstChild!.textContent).toEqual(
      'Generic component 6',
    );
  });

  it('renders WidgetsContainer on a small screen', () => {
    const { elementContainer: container } = render(
      <InfoWidgetModalProvider value={null}>
        <WidgetsContainer>{genericComponentsList}</WidgetsContainer>
      </InfoWidgetModalProvider>,
      {
        grommetOptions: {
          responsiveSize: 'small',
        },
      },
    );

    expect(container!.firstChild).not.toBeNull();
    const parentContainer = container!.firstChild;

    // 1 column and 0 div used for gap between
    expect(parentContainer!.childNodes.length).toEqual(1);

    const column1 = parentContainer!.childNodes[0];

    expect(column1.childNodes[0].firstChild!.textContent).toEqual(
      'Generic component 1',
    );
    expect(column1.childNodes[1].firstChild!.textContent).toEqual(
      'Generic component 2',
    );
    expect(column1.childNodes[2].firstChild!.textContent).toEqual(
      'Generic component 3',
    );
    expect(column1.childNodes[3].firstChild!.textContent).toEqual(
      'Generic component 4',
    );
    expect(column1.childNodes[4].firstChild!.textContent).toEqual(
      'Generic component 5',
    );
    expect(column1.childNodes[5].firstChild!.textContent).toEqual(
      'Generic component 6',
    );
  });
});
