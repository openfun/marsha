import {
  act,
  render as testingLibraryRender,
  RenderOptions as TestingLibraryRenderOptions,
  RenderResult,
  screen,
} from '@testing-library/react';
import { Grommet, ResponsiveContext, ThemeType } from 'grommet';
import MatchMediaMock from 'jest-matchmedia-mock';
import { BreadCrumbsProvider, GlobalStyles, theme, Nullable } from 'lib-common';
import React, { CSSProperties, ReactElement } from 'react';
import toast, { Toast, Toaster, useToaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';
import { RouteProps } from 'react-router-dom';

import { wrapInIntlProvider } from './intl';
import { wrapInRouter } from './router';

//  ------- interfaces -------
interface IntlOptions {
  locale?: string;
}
interface RouterOptions {
  routes?: RouteProps[];
  componentPath?: string;
  header?: React.ReactElement;
  history?: string[];
  wrapper?: (routing: JSX.Element) => JSX.Element;
}
interface QueryOptions {
  client: QueryClient;
}
interface GrommetOptions {
  theme?: ThemeType;
  style?: CSSProperties;
  responsiveSize?: string;
}

/**
 * Options to configure the render of a component for a test
 *
 * @property testingLibraryOptions options provided by react-testing-library to the render method
 * @property intlOptions options to configure i18n context
 * @property routerOptions options to configure router and routes in the test
 * @property queryOptions options to configure a custom client used by react-query for a test
 * @property grommetOptions options to configure grommet theme, responsive and add style to the mounted base div
 */
export interface RenderOptions {
  grommetOptions: GrommetOptions;
  intlOptions: IntlOptions;
  queryOptions: QueryOptions;
  routerOptions: RouterOptions;
  testingLibraryOptions: TestingLibraryRenderOptions;
}

//  ------- utils -------
/////////////////////////
//  hacks for react-hot-toast

//  matchMedia is required for recat-hot-toast
const matchMedia = new MatchMediaMock();

//  stores toast to be able to clean up at the end of the test
//  @see {@link afterEach}
let getToastHook: () => ReturnType<typeof useToaster> | null = () => null;
const ToastHack = () => {
  const toasts = useToaster();
  getToastHook = () => toasts;
  return null;
};

/////////////////////////
//  react-query setup

//  create the default client used by react-query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

/////////////////////////
//  wrap the component
export const appendUtilsElement = (
  element: ReactElement,
  options?: Partial<RenderOptions>,
) => {
  return wrapInIntlProvider(
    <Grommet
      theme={options?.grommetOptions?.theme || theme}
      style={options?.grommetOptions?.style}
    >
      <ResponsiveContext.Provider
        value={options?.grommetOptions?.responsiveSize ?? 'large'}
      >
        <BreadCrumbsProvider>
          <GlobalStyles />
          <QueryClientProvider
            client={options?.queryOptions?.client ?? queryClient}
          >
            <Toaster />
            <ToastHack />
            {wrapInRouter(
              <div data-testid="test-component-container">{element}</div>,
              options?.routerOptions?.routes,
              options?.routerOptions?.componentPath || '/',
              options?.routerOptions?.history,
              options?.routerOptions?.header,
              options?.routerOptions?.wrapper,
            )}
          </QueryClientProvider>
        </BreadCrumbsProvider>
      </ResponsiveContext.Provider>
    </Grommet>,
    options?.intlOptions?.locale || 'en',
  );
};

//  ------- setup -------

window.scrollTo = jest.fn(); // required to test, see grommet
window.HTMLElement.prototype.scrollTo = jest.fn();

beforeEach(() => {
  /*
      make sure to remove all body children, grommet layer gets rendered twice, known issue
      https://github.com/grommet/grommet/issues/5200
    */
  document.body.innerHTML = '';
  document.body.appendChild(document.createElement('div'));
});
afterEach(() => {
  matchMedia.clear();

  queryClient.clear();

  const toasts = getToastHook();
  if (toasts && toasts.hasOwnProperty('toasts')) {
    toasts.toasts.forEach((item: Toast) => {
      act(() => {
        toast.remove(item.id);
      });
    });
  }
});

type customRenderResult = Omit<RenderResult, 'rerender'> & {
  elementContainer: Nullable<HTMLElement>;
  rerender: (
    element: ReactElement,
    options?: Partial<Omit<RenderOptions, 'testingLibraryOptions'>>,
  ) => void;
};

type renderFunction = (
  element: ReactElement,
  options?: Partial<RenderOptions>,
) => customRenderResult;

/**
 *
 * Custom render method base on react-testing-library render method.
 * This will render {@param element} in JSDom and read options to configure context and render.
 * It also override react-testing-library rerender method to also wrap the provided component in
 * the same contexts.
 *
 * The provided {@param element} is to be wrapped in :
 * - grommet main context (grommet)
 * - grommet specific responsive context (grommet)
 * - react router (react-router-dom)
 * - react i18n context (react-intl)
 * - breadcrumb context (custom one)
 * - query context (react-query)
 * It also added to the rended tree :
 * - styles from styled-reboot for styled-components
 * - toast and its hack to clean up toast (react-hot-toast)
 *
 * This function uses default values:
 * options.intlOptions.locale : 'en'
 * options.routerOptions.componentPath : '/'
 * options.queryOptions.client : {@see queryClient}
 * options.grommetOptions.responsiveSize : 'large'
 *
 *
 * @param element element to wrap in application contexts and test
 * @param options options to configure and/or customize wrapped context for the test {@see RenderOptions}
 * @returns an object with all values return by react-testing-library render methods
 * and an other property {@property elementContainer} refering to the exact element containing the {@param element} to test
 *
 *
 * @example
 * customRender(<SomeComponentToTest />);
 * customRender(<SomeComponentToTest />, { grommetOptions: { responsiveSize: 'small' }});
 */
export const render: renderFunction = (
  element: ReactElement,
  options?: Partial<RenderOptions>,
) => {
  const renderResult = testingLibraryRender(
    appendUtilsElement(element, options),
    options?.testingLibraryOptions,
  );

  return {
    ...renderResult,
    elementContainer: screen.queryByTestId('test-component-container'),
    rerender: (
      rerenderElement: ReactElement,
      rerenderOptions?: Partial<Omit<RenderOptions, 'testingLibraryOptions'>>,
    ) => {
      return renderResult.rerender(
        appendUtilsElement(rerenderElement, rerenderOptions),
      );
    },
  };
};
