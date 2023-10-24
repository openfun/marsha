//import { DefaultTokens } from '@openfun/cunningham-react';

const config = {
  themes: {
    default: {
      theme: {
        colors: {
          'primary-100': '#EDF5FA',
          'primary-150': '#E5EEFA',
        },
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
          sizes: {
            none: '0',
            small: '192px',
            xsmedium: '240px',
            medium: '384px',
            xlmedium: '480px',
            large: '768px',
            xlarge: '1152px',
            xxlarge: '1536px',
            full: '100%',
          },
          none: '0',
          xxsmall: 'var(--c--theme--spacings--st)',
          xsmall: 'var(--c--theme--spacings--t)',
          small: 'var(--c--theme--spacings--s)',
          medium: 'var(--c--theme--spacings--b)',
          xmedium: 'var(--c--theme--spacings--bx)',
          large: 'var(--c--theme--spacings--l)',
          xlarge: 'var(--c--theme--spacings--xl)',
          full: '100%',
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
        button: {
          'border-radius': {
            active: 'var(--c--components--button--border-radius)',
          },
          success: {
            color: 'white',
            'color-disabled': 'white',
            'color-hover': 'white',
            background: {
              color: 'var(--c--theme--colors--success-600)',
              'color-disabled': 'var(--c--theme--colors--greyscale-300)',
              'color-hover': 'var(--c--theme--colors--success-800)',
            },
          },
          danger: {
            'color-hover': 'white',
            background: {
              color: 'var(--c--theme--colors--danger-400)',
              'color-hover': 'var(--c--theme--colors--danger-500)',
              'color-disabled': 'var(--c--theme--colors--danger-100)',
            },
          },
          primary: {
            color: 'var(--c--theme--colors--primary-text)',
            'color-active': 'var(--c--theme--colors--primary-text)',
            background: {
              color: 'var(--c--theme--colors--primary-400)',
              'color-active': 'var(--c--theme--colors--primary-500)',
            },
            border: {
              'color-active': 'transparent',
            },
          },
          secondary: {
            color: 'var(--c--theme--colors--primary-500)',
            'color-hover': 'var(--c--theme--colors--primary-text)',
            background: {
              color: 'white',
              'color-hover': 'var(--c--theme--colors--primary-700)',
            },
            border: {
              color: 'var(--c--theme--colors--primary-200)',
            },
          },
          tertiary: {
            color: 'var(--c--theme--colors--primary-500)',
            'color-disabled': 'var(--c--theme--colors--greyscale-600)',
            background: {
              'color-hover': 'var(--c--theme--colors--primary-100)',
              'color-disabled': 'var(--c--theme--colors--greyscale-200)',
            },
          },
          disabled: {
            color: 'white',
            background: {
              color: '#b3cef0',
            },
          },
        },
      },
    },
  },
};

export default config;
