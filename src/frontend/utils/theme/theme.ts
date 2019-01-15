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
