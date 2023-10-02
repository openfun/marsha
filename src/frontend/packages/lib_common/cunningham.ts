//import { DefaultTokens } from '@openfun/cunningham-react';

const config = {
  theme: {
    font: {
      sizes: {
        ml: '0.938rem',
        xl: '1.50rem',
        t: '0.6875rem',
        s: '0.75rem',
        h1: '2.2rem',
        h2: '1.7rem',
        h3: '1.37rem',
        h4: '1.15rem',
        h5: '1rem',
        h6: '0.87rem',
      },
      weights: {
        thin: 100,
        extrabold: 800,
        black: 900,
      },
    },
    spacings: {
      '0': '0',
      auto: 'auto',
      bx: '2.2rem',
    },
  },
  components: {
    'forms-checkbox': {
      'background-color': {
        hover: '#055fd214',
      },
      color: 'var(--c--theme--colors--primary-500)',
      'font-size': 'var(--c--theme--font--sizes--ml)',
    },
    'forms-labelledbox': {
      'label-color': {
        small: 'var(--c--theme--colors--primary-500)',
      },
    },
    'forms-switch': {
      'accent-color': 'var(--c--theme--colors--primary-400)',
    },
  },
};

export default config;
