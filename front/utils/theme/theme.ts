export type colorName = 'darkGray' | 'lightGray' | 'mediumGray' | 'primary';

export interface Color {
  contrast: string;
  main: string;
}

export const colors: { [clr in colorName]: Color } = {
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
  primary: {
    contrast: '#0069d9',
    main: '#007bff',
  },
};
