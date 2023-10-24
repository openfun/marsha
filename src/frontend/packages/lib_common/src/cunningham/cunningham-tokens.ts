export const tokens = {
  themes: {
    default: {
      theme: {
        colors: {
          'secondary-text': '#555F6B',
          'secondary-100': '#F2F7FC',
          'secondary-200': '#EBF3FA',
          'secondary-300': '#E2EEF8',
          'secondary-400': '#DDEAF7',
          'secondary-500': '#D4E5F5',
          'secondary-600': '#C1D0DF',
          'secondary-700': '#97A3AE',
          'secondary-800': '#757E87',
          'secondary-900': '#596067',
          'info-text': '#FFFFFF',
          'info-100': '#EBF2FC',
          'info-200': '#8CB5EA',
          'info-300': '#5894E1',
          'info-400': '#377FDB',
          'info-500': '#055FD2',
          'info-600': '#0556BF',
          'info-700': '#044395',
          'info-800': '#033474',
          'info-900': '#022858',
          'greyscale-100': '#FAFAFB',
          'greyscale-200': '#F3F4F4',
          'greyscale-300': '#E7E8EA',
          'greyscale-400': '#C2C6CA',
          'greyscale-500': '#9EA3AA',
          'greyscale-600': '#79818A',
          'greyscale-700': '#555F6B',
          'greyscale-800': '#303C4B',
          'greyscale-900': '#0C1A2B',
          'greyscale-000': '#FFFFFF',
          'primary-100': '#EDF5FA',
          'primary-200': '#8CB5EA',
          'primary-300': '#5894E1',
          'primary-400': '#377FDB',
          'primary-500': '#055FD2',
          'primary-600': '#0556BF',
          'primary-700': '#044395',
          'primary-800': '#033474',
          'primary-900': '#022858',
          'success-100': '#EFFCD3',
          'success-200': '#DBFAA9',
          'success-300': '#BEF27C',
          'success-400': '#A0E659',
          'success-500': '#76D628',
          'success-600': '#5AB81D',
          'success-700': '#419A14',
          'success-800': '#2C7C0C',
          'success-900': '#1D6607',
          'warning-100': '#FFF8CD',
          'warning-200': '#FFEF9B',
          'warning-300': '#FFE469',
          'warning-400': '#FFDA43',
          'warning-500': '#FFC805',
          'warning-600': '#DBA603',
          'warning-700': '#B78702',
          'warning-800': '#936901',
          'warning-900': '#7A5400',
          'danger-100': '#F4B0B0',
          'danger-200': '#EE8A8A',
          'danger-300': '#E65454',
          'danger-400': '#E13333',
          'danger-500': '#DA0000',
          'danger-600': '#C60000',
          'danger-700': '#9B0000',
          'danger-800': '#780000',
          'danger-900': '#5C0000',
          'primary-text': '#FFFFFF',
          'success-text': '#FFFFFF',
          'warning-text': '#FFFFFF',
          'danger-text': '#FFFFFF',
          'primary-150': '#E5EEFA',
        },
        font: {
          sizes: {
            h1: '2.2rem',
            h2: '1.7rem',
            h3: '1.37rem',
            h4: '1.15rem',
            h5: '1rem',
            h6: '0.87rem',
            l: '1rem',
            m: '0.8125rem',
            s: '0.75rem',
            ml: '0.938rem',
            xl: '1.50rem',
            t: '0.6875rem',
          },
          weights: {
            thin: 100,
            light: 300,
            regular: 400,
            medium: 500,
            bold: 600,
            extrabold: 800,
            black: 900,
          },
          families: {
            base: '"Roboto Flex Variable", sans-serif',
            accent: '"Roboto Flex Variable", sans-serif',
          },
          letterSpacings: {
            h1: 'normal',
            h2: 'normal',
            h3: 'normal',
            h4: 'normal',
            h5: '1px',
            h6: 'normal',
            l: 'normal',
            m: 'normal',
            s: 'normal',
          },
        },
        spacings: {
          '0': '0',
          xl: '4rem',
          l: '3rem',
          b: '1.625rem',
          s: '1rem',
          t: '0.5rem',
          st: '0.25rem',
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
        transitions: {
          'ease-in': 'cubic-bezier(0.32, 0, 0.67, 0)',
          'ease-out': 'cubic-bezier(0.33, 1, 0.68, 1)',
          'ease-in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
          duration: '250ms',
        },
      },
      components: {
        'forms-checkbox': {
          'background-color': { hover: '#055fd214' },
          color: 'var(--c--theme--colors--primary-500)',
          'font-size': 'var(--c--theme--font--sizes--ml)',
        },
        'forms-labelledbox': {
          'label-color': { small: 'var(--c--theme--colors--primary-500)' },
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
            border: { 'color-active': 'transparent' },
          },
          secondary: {
            color: 'var(--c--theme--colors--primary-500)',
            'color-hover': 'var(--c--theme--colors--primary-text)',
            background: {
              color: 'white',
              'color-hover': 'var(--c--theme--colors--primary-700)',
            },
            border: { color: 'var(--c--theme--colors--primary-200)' },
          },
          tertiary: {
            color: 'var(--c--theme--colors--primary-500)',
            'color-disabled': 'var(--c--theme--colors--greyscale-600)',
            background: {
              'color-hover': 'var(--c--theme--colors--primary-100)',
              'color-disabled': 'var(--c--theme--colors--greyscale-200)',
            },
          },
          disabled: { color: 'white', background: { color: '#b3cef0' } },
        },
      },
    },
    dark: {
      theme: {
        colors: {
          'greyscale-100': '#182536',
          'greyscale-200': '#303C4B',
          'greyscale-300': '#555F6B',
          'greyscale-400': '#79818A',
          'greyscale-500': '#9EA3AA',
          'greyscale-600': '#C2C6CA',
          'greyscale-700': '#E7E8EA',
          'greyscale-800': '#F3F4F4',
          'greyscale-900': '#FAFAFB',
          'greyscale-000': '#0C1A2B',
          'primary-100': '#3B4C62',
          'primary-200': '#4D6481',
          'primary-300': '#6381A6',
          'primary-400': '#7FA5D5',
          'primary-500': '#8CB5EA',
          'primary-600': '#A3C4EE',
          'primary-700': '#C3D8F4',
          'primary-800': '#DDE9F8',
          'primary-900': '#F4F8FD',
          'success-100': '#EEF8D7',
          'success-200': '#D9F1B2',
          'success-300': '#BDE985',
          'success-400': '#A0E25D',
          'success-500': '#76D628',
          'success-600': '#5BB520',
          'success-700': '#43941A',
          'success-800': '#307414',
          'success-900': '#225D10',
          'warning-100': '#F7F3D5',
          'warning-200': '#F0E5AA',
          'warning-300': '#E8D680',
          'warning-400': '#E3C95F',
          'warning-500': '#D9B32B',
          'warning-600': '#BD9721',
          'warning-700': '#9D7B1C',
          'warning-800': '#7E6016',
          'warning-900': '#684D12',
          'danger-100': '#F8D0D0',
          'danger-200': '#F09898',
          'danger-300': '#F09898',
          'danger-400': '#ED8585',
          'danger-500': '#E96666',
          'danger-600': '#DD6666',
          'danger-700': '#C36666',
          'danger-800': '#AE6666',
          'danger-900': '#9D6666',
        },
      },
    },
  },
};
