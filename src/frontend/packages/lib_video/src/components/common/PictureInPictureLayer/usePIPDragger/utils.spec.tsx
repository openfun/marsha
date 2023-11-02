import { faker } from '@faker-js/faker';

import { computePicturePosition, getVelocity } from './utils';

describe('usePIPDragger/getVelocity', () => {
  it('compute velocity', () => {
    expect(getVelocity({ x: 8, y: 3 })).toBe(Math.sqrt(73));
  });
});

describe('usePIPDragger/computePicturePosition', () => {
  it('computes picture position when velocity is null', () => {
    const container = { offsetWidth: 200, offsetHeight: 200 } as HTMLDivElement;

    expect(
      computePicturePosition(
        null,
        container,
        {
          offsetLeft: 20,
          offsetTop: 20,
          offsetWidth: 30,
          offsetHeight: 30,
        } as HTMLDivElement,
        40,
      ),
    ).toEqual({ x: 40, y: 40 });
    expect(
      computePicturePosition(
        null,
        container,
        {
          offsetLeft: 110,
          offsetTop: 20,
          offsetWidth: 30,
          offsetHeight: 30,
        } as HTMLDivElement,
        40,
      ),
    ).toEqual({ x: 130, y: 40 });
    expect(
      computePicturePosition(
        null,
        container,
        {
          offsetLeft: 20,
          offsetTop: 110,
          offsetWidth: 30,
          offsetHeight: 30,
        } as HTMLDivElement,
        40,
      ),
    ).toEqual({ x: 40, y: 130 });
    expect(
      computePicturePosition(
        null,
        container,
        {
          offsetLeft: 110,
          offsetTop: 110,
          offsetWidth: 30,
          offsetHeight: 30,
        } as HTMLDivElement,
        40,
      ),
    ).toEqual({ x: 130, y: 130 });
  });
  it('computes picture position when velocity is low', () => {
    const container = { offsetWidth: 200, offsetHeight: 200 } as HTMLDivElement;
    const velocity = { x: 2, y: 2 };

    expect(
      computePicturePosition(
        velocity,
        container,
        {
          offsetLeft: 20,
          offsetTop: 20,
          offsetWidth: 30,
          offsetHeight: 30,
        } as HTMLDivElement,
        40,
      ),
    ).toEqual({ x: 40, y: 40 });
    expect(
      computePicturePosition(
        velocity,
        container,
        {
          offsetLeft: 110,
          offsetTop: 20,
          offsetWidth: 30,
          offsetHeight: 30,
        } as HTMLDivElement,
        40,
      ),
    ).toEqual({ x: 130, y: 40 });
    expect(
      computePicturePosition(
        velocity,
        container,
        {
          offsetLeft: 20,
          offsetTop: 110,
          offsetWidth: 30,
          offsetHeight: 30,
        } as HTMLDivElement,
        40,
      ),
    ).toEqual({ x: 40, y: 130 });
    expect(
      computePicturePosition(
        velocity,
        container,
        {
          offsetLeft: 110,
          offsetTop: 110,
          offsetWidth: 30,
          offsetHeight: 30,
        } as HTMLDivElement,
        40,
      ),
    ).toEqual({ x: 130, y: 130 });
  });
  it('computes picture position when velocity is heigh', () => {
    const container = { offsetWidth: 200, offsetHeight: 200 } as HTMLDivElement;

    expect(
      computePicturePosition(
        { x: -100, y: -100 },
        container,
        {
          offsetLeft: faker.datatype.number(),
          offsetTop: faker.datatype.number(),
          offsetWidth: 30,
          offsetHeight: 30,
        } as HTMLDivElement,
        40,
      ),
    ).toEqual({ x: 40, y: 40 });
    expect(
      computePicturePosition(
        { x: 100, y: -100 },
        container,
        {
          offsetLeft: faker.datatype.number(),
          offsetTop: faker.datatype.number(),
          offsetWidth: 30,
          offsetHeight: 30,
        } as HTMLDivElement,
        40,
      ),
    ).toEqual({ x: 130, y: 40 });
    expect(
      computePicturePosition(
        { x: -100, y: 100 },
        container,
        {
          offsetLeft: faker.datatype.number(),
          offsetTop: faker.datatype.number(),
          offsetWidth: 30,
          offsetHeight: 30,
        } as HTMLDivElement,
        40,
      ),
    ).toEqual({ x: 40, y: 130 });
    expect(
      computePicturePosition(
        { x: 100, y: 100 },
        container,
        {
          offsetLeft: faker.datatype.number(),
          offsetTop: faker.datatype.number(),
          offsetWidth: 30,
          offsetHeight: 30,
        } as HTMLDivElement,
        40,
      ),
    ).toEqual({ x: 130, y: 130 });
  });
});
