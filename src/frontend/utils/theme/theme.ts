import { rgba } from 'polished';

export type colorName =
  | 'danger'
  | 'darkGray'
  | 'lightGray'
  | 'mediumGray'
  | 'mediumTextGray'
  | 'primary';

export interface Color {
  contrast: string;
  main: string;
}

export const colors: { [clr in colorName]: Color } = {
  danger: {
    contrast: '#ca1111',
    main: '#e41313',
  },
  darkGray: {
    contrast: '#495057',
    main: '#343a40',
  },
  lightGray: {
    contrast: 'white',
    main: '#f8f9fa',
  },
  mediumGray: {
    contrast: '#dee2e6',
    main: '#ced4da',
  },
  mediumTextGray: {
    contrast: '#949ca4',
    main: '#6e7881',
  },
  primary: {
    contrast: '#0069d9',
    main: '#007bff',
  },
};

const colorsGeneric = {
  'accent-1': 'brand',
  'accent-2': '#f72b2f',
  'accent-3': 'dark1',
  'accent-4': '#ffca58',
  'dark-1': '#08223c',
  'dark-2': '#183653',
  'dark-3': '#2e4d6b',
  'dark-4': '#456787',
  'dark-5': '#456787',
  'dark-6': '#456787',
  'light-1': '#f7f7f7',
  'light-2': '#eeeeef',
  'light-3': '#e5e6e6',
  'light-4': '#dcddde',
  'light-5': '#d3d4d5',
  'light-6': '#cbcccd',
  'neutral-1': '#00873D',
  'neutral-2': '#3D138D',
  'neutral-3': '#00739D',
  'neutral-4': '#A2423D',
  'status-critical': 'accent-2',
  'status-disabled': '#cccccc',
  'status-error': 'accent-2',
  'status-ok': '#00c781',
  'status-unknown': '#cccccc',
  'status-warning': '#ffaa15',
};

const colorsMain = {
  active: rgba(221, 221, 221, 0.5),
  black: '#000000',
  border: {
    dark: rgba(255, 255, 255, 0.33),
    light: rgba(0, 0, 0, 0.33),
  },
  brand: '#007bff',
  control: {
    dark: 'accent-1',
    light: 'brand',
  },
  focus: 'accent-1',
  icon: {
    dark: '#f8f8f8',
    light: '#666666',
  },
  placeholder: '#aaaaaa',
  selected: 'brand',
  text: {
    dark: '#f8f8f8',
    light: '#444444',
  },
  white: '#ffffff',
};

export const theme = {
  global: {
    colors: {
      ...colorsGeneric,
      ...colorsMain,
    },
  },
};
