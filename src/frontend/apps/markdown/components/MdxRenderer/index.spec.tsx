import * as fs from 'fs';
import path from 'path';

import { screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';

import render from 'utils/tests/render';

import MdxRenderer from '.';
import { useJwt } from 'data/stores/useJwt';

jest.mock('data/stores/useAppConfig', () => ({
  modelName: 'markdown_documents',
  resource: {
    id: '1',
  },
}));

jest.mock('apps/markdown/components/MdxRenderer/constants', () => ({
  debouncingTime: 0, // override the debouncing time to make tests twice faster
}));

jest.mock('uuid', () => ({
  // Mock UUID for Mermaid rendering
  v4: () => '01fefe81-ce68-4427-af99-9b76bed63e67',
}));

describe('<MdxRenderer />', () => {
  // Mock getBBox SVG for tests
  beforeEach(() => {
    useJwt.setState({
      jwt: 'some token',
    });

    // @ts-ignore
    window.SVGElement.prototype.getBBox = () => ({
      x: 200,
      y: 200,
      width: 100,
      height: 100,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
    // @ts-ignore
    delete window.SVGElement.prototype.getBBox;
  });

  it('renders empty document', async () => {
    const markdownDocumentId = '1'; // unused: no API call
    const onRenderedContentChange = jest.fn();

    const markdownText = '';

    const { container } = render(
      <MdxRenderer
        markdownText={markdownText}
        markdownDocumentId={markdownDocumentId}
        onRenderedContentChange={onRenderedContentChange}
        renderingOptions={{}}
      />,
    );

    const loader = screen.getByRole('status');

    // Wait for rendered content
    await waitFor(() => expect(loader).not.toBeInTheDocument());

    expect(
      container.getElementsByClassName('markdown-body')[0],
    ).toMatchSnapshot();
  });

  it('renders simple markdown', async () => {
    const markdownDocumentId = '1'; // unused: no API call
    const onRenderedContentChange = jest.fn();
    const renderingOptions = {};

    const file = path.join(__dirname, '__tests__', 'simpleMarkdown.md');
    const markdownText = fs.readFileSync(file, { encoding: 'utf8' });

    const { container } = render(
      <MdxRenderer
        markdownText={markdownText}
        markdownDocumentId={markdownDocumentId}
        onRenderedContentChange={onRenderedContentChange}
        renderingOptions={renderingOptions}
      />,
    );

    // Wait for rendered content
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 3, name: 'An h3 header' }),
      ).toBeInTheDocument(),
    );

    expect(
      container.getElementsByClassName('markdown-body')[0],
    ).toMatchSnapshot();
  });

  it('renders very simple markdown with brace', async () => {
    const markdownText = '# This is a {title}';
    const markdownDocumentId = '1'; // unused: no API call
    const onRenderedContentChange = jest.fn();
    const renderingOptions = { useMdx: false };

    render(
      <MdxRenderer
        markdownText={markdownText}
        markdownDocumentId={markdownDocumentId}
        onRenderedContentChange={onRenderedContentChange}
        renderingOptions={renderingOptions}
      />,
    );

    // Wait for rendered content
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: 'This is a {title}' }),
      ).toBeInTheDocument(),
    );
  });

  it('renders markdown with math to KaTeX', async () => {
    const markdownText =
      '# This is a math content\n' +
      '\n' +
      '$I = \\int \\rho R^{2} dV$\n' + // inline
      '\n' +
      '$$\n' +
      'I = \\int \\rho R^{2} dV\n' + // display mode
      '$$\n';
    const markdownDocumentId = '1'; // unused: no API call
    const onRenderedContentChange = jest.fn();
    const renderingOptions = { useMathjax: false };

    const { container } = render(
      <MdxRenderer
        markdownText={markdownText}
        markdownDocumentId={markdownDocumentId}
        onRenderedContentChange={onRenderedContentChange}
        renderingOptions={renderingOptions}
      />,
    );

    // Wait for rendered content
    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'This is a math content',
        }),
      ).toBeInTheDocument(),
    );

    expect(
      container.getElementsByClassName('markdown-body')[0],
    ).toMatchSnapshot();
  });

  it('renders markdown with math to Mathjax', async () => {
    const markdownText =
      '# This is a math content\n' +
      '\n' +
      '$I = \\int \\rho R^{2} dV$\n' + // inline
      '\n' +
      '$$\n' +
      'I = \\int \\rho R^{2} dV\n' + // display mode
      '$$\n';
    const markdownDocumentId = '1'; // unused: no API call
    const onRenderedContentChange = jest.fn();
    const renderingOptions = { useMathjax: true };

    const { container } = render(
      <MdxRenderer
        markdownText={markdownText}
        markdownDocumentId={markdownDocumentId}
        onRenderedContentChange={onRenderedContentChange}
        renderingOptions={renderingOptions}
      />,
    );

    // Wait for rendered content
    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'This is a math content',
        }),
      ).toBeInTheDocument(),
    );

    expect(
      container.getElementsByClassName('markdown-body')[0],
    ).toMatchSnapshot();
  });

  it('renders markdown with MDX', async () => {
    const markdownText =
      '# This is a MDX content\n' +
      '\n' +
      'This paragraph shows what are the advanced uses provided by using *MDX*\n' +
      '\n' +
      "<div style={{padding: '1rem', backgroundColor: 'violet'}} data-testid=\"mdx-rendered-block\">\n" +
      '  Instructor can override the design of the document.\n' +
      '</div>\n' +
      '\n' +
      '\n' +
      'One can define variables:\n' +
      '\n' +
      'export const good_decade = "70th"\n' +
      '\n' +
      'And use it in text like in the {good_decade}';
    const markdownDocumentId = '1'; // unused: no API call
    const onRenderedContentChange = jest.fn();
    const renderingOptions = { useMdx: true };

    const { container } = render(
      <MdxRenderer
        markdownText={markdownText}
        markdownDocumentId={markdownDocumentId}
        onRenderedContentChange={onRenderedContentChange}
        renderingOptions={renderingOptions}
      />,
    );

    // Wait for rendered content
    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'This is a MDX content',
        }),
      ).toBeInTheDocument(),
    );

    expect(
      container.getElementsByClassName('markdown-body')[0],
    ).toMatchSnapshot();
  });

  it('renders markdown with Mermaid content', async () => {
    const markdownDocumentId = '1'; // unused: no API call
    const onRenderedContentChange = jest.fn();
    const renderingOptions = {};

    const file = path.join(__dirname, '__tests__', 'markdownMermaid.md');
    const markdownText = fs.readFileSync(file, { encoding: 'utf8' });

    render(
      <MdxRenderer
        markdownText={markdownText}
        markdownDocumentId={markdownDocumentId}
        onRenderedContentChange={onRenderedContentChange}
        renderingOptions={renderingOptions}
      />,
    );

    // Wait for rendered content
    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'This is a Mermaid content',
        }),
      ).toBeInTheDocument(),
    );

    // Can't match full snapshot here, because content may vary from a tiny pixel.
    // We look for the rendered SVG having title "A Gantt Diagram"
    screen.getByRole('img', { name: /A Gantt Diagram/i });
  });

  it('renders markdown with LaTeX content', async () => {
    const markdownDocumentId = '1';
    const onRenderedContentChange = jest.fn();
    const renderingOptions = {};

    const file = path.join(__dirname, '__tests__', 'markdownLatex.md');
    const markdownText = fs.readFileSync(file, { encoding: 'utf8' });

    fetchMock.post('/api/markdown-documents/1/latex-rendering/', {
      latex_image: '<svg>some svg content</svg>',
    });

    const { container } = render(
      <MdxRenderer
        markdownText={markdownText}
        markdownDocumentId={markdownDocumentId}
        onRenderedContentChange={onRenderedContentChange}
        renderingOptions={renderingOptions}
      />,
    );

    // Wait for rendered content
    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'This is a LaTex rendered content',
        }),
      ).toBeInTheDocument(),
    );

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/markdown-documents/${markdownDocumentId}/latex-rendering/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        text: 'I = \\int \\rho R^{2} dV',
      }),
    });

    expect(
      container.getElementsByClassName('markdown-body')[0],
    ).toMatchSnapshot();
  });

  it('renders markdown without XSS', async () => {
    // Remove error logs only for this test as React warns about
    // Warning: A future version of React will block javascript: URLs as a security precaution. [...]
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const markdownDocumentId = '1';
    const onRenderedContentChange = jest.fn();

    const file = path.join(__dirname, '__tests__', 'simpleXss.md');
    const markdownText = fs.readFileSync(file, { encoding: 'utf8' });

    const { container, rerender } = render(
      <MdxRenderer
        markdownText={markdownText}
        markdownDocumentId={markdownDocumentId}
        onRenderedContentChange={onRenderedContentChange}
        renderingOptions={{ useMdx: false }}
      />,
    );

    // Wait for rendered content
    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'XSS',
        }),
      ).toBeInTheDocument(),
    );

    expect(
      container.getElementsByClassName('markdown-body')[0],
    ).toMatchSnapshot();

    // Now renders with MDX
    rerender(
      <MdxRenderer
        markdownText={markdownText}
        markdownDocumentId={markdownDocumentId}
        onRenderedContentChange={onRenderedContentChange}
        renderingOptions={{ useMdx: true }}
      />,
    );

    // Wait for rendered content
    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'XSS',
        }),
      ).toBeInTheDocument(),
    );

    expect(
      container.getElementsByClassName('markdown-body')[0],
    ).toMatchSnapshot();
  });
});
