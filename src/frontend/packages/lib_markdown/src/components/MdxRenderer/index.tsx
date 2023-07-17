/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable array-callback-return */
import { evaluate } from '@mdx-js/mdx2';
import DOMPurify from 'dompurify';
import langLatex from 'highlight.js/lib/languages/latex'; // Support LaTeX code highlighting.
import { Nullable } from 'lib-common';
import {
  MarkdownDocumentRenderingOptions,
  MarkdownImage,
  Spinner,
} from 'lib-components';
import { debounce } from 'lodash';
import React from 'react';
import * as runtime from 'react/jsx-runtime';
import ReactDOMServer from 'react-dom/server';
import rehypeHighlight from 'rehype-highlight'; // Support code highlighting.
import rehypeKatex from 'rehype-katex'; // Render math with KaTeX.
import rehypeMathjax from 'rehype-mathjax'; // Render math with Mathjax.
import rehypeRaw from 'rehype-raw'; // Render HTML tags in simple Markdown.
import remarkMath from 'remark-math'; // Support math like `$so$`.
import { PluggableList } from 'unified';

import { debouncingTime } from './constants';
import remarkLatexPlugin from './remarkLatexPlugin'; // Support backend LaTeX rendering
import remarkLocallyHostedImagePlugin from './remarkLocallyHostedImagePlugin';
import remarkMermaidPlugin from './remarkMermaidPlugin'; // Support Mermaid
import { MarkdownImageCache } from './types';

const additionalHighlightLanguages = {
  latex: langLatex,
};

const htmlDecode = (input: string) => {
  // Function to convert HTML escaped string to HTML preventing XSS
  // Only used to fix style tags
  const htmlDocument = new DOMParser().parseFromString(input, 'text/html');
  return htmlDocument.documentElement.textContent;
};

type MdxRendererProps = {
  markdownText: Nullable<string>;
  markdownDocumentId: string;
  onRenderedContentChange: (renderedContent: Nullable<string>) => void;
  renderingOptions?: MarkdownDocumentRenderingOptions;
  mardownImages: MarkdownImage[];
};

export const MdxRenderer = ({
  markdownText,
  markdownDocumentId,
  onRenderedContentChange,
  renderingOptions,
  mardownImages,
}: MdxRendererProps) => {
  const [renderedText, setRenderedText] =
    React.useState<Nullable<string>>(null);
  const [loading, setLoading] = React.useState(true);

  const localImagesUrlCache = React.useRef<MarkdownImageCache>({});

  // Init the image URL cache as best effort
  // (use what is available, the rest will be filled on the fly)
  mardownImages.map((value) => {
    if (!value.url) {
      return;
    }
    localImagesUrlCache.current[value.id] = {
      url: value.url,
      expiration: Date.now() + 15 * 60 * 1000, // 15 minutes
    };
  });

  const debouncedRendering = React.useRef(
    debounce(
      (inputText: string, options?: MarkdownDocumentRenderingOptions) => {
        setLoading(true);
        if (inputText === '') {
          // shortcut for new documents
          setRenderedText('');
          setLoading(false);
          onRenderedContentChange(''); // same as default value
          return;
        }

        const remarkPlugins = [
          remarkLatexPlugin(markdownDocumentId),
          remarkMermaidPlugin,
          remarkMath,
          remarkLocallyHostedImagePlugin(localImagesUrlCache.current),
        ];
        const rehypePlugins: PluggableList = [
          options?.useMathjax ? rehypeMathjax : rehypeKatex,
          [
            rehypeHighlight,
            { ignoreMissing: true, languages: additionalHighlightLanguages },
          ],
        ];

        // Add the raw parser when mode is markdown only to allow HTML tags to be used
        let format: 'mdx' | 'md' = 'mdx';
        if (!options?.useMdx) {
          format = 'md';
          // @ts-ignore, typescript can't detect rehypeRaw is the same type as other plugins
          rehypePlugins.push(rehypeRaw);
        }

        evaluate(inputText, {
          jsx: undefined,
          jsxs: undefined,
          Fragment: undefined,
          ...runtime,
          format,
          remarkPlugins,
          rehypePlugins,
        })
          .then((evaluated) => {
            // components are empty for now, add charts or leaflet here later
            const jsxRenderedContent = evaluated.default({ components: {} });
            // convert JSX Element to raw HTML
            const htmlRenderedContent =
              ReactDOMServer.renderToStaticMarkup(jsxRenderedContent);
            // Sanitize HTML to prevent XSS
            // - preserve `<use xlink:href` required in LaTeX SVG rendering
            DOMPurify.addHook('afterSanitizeAttributes', (node) => {
              if (
                node.hasAttribute('xlink:href') &&
                !node.getAttribute('xlink:href')!.match(/^#/)
              ) {
                node.remove();
              }
            });

            // - fix inline style tags, required for MathJax
            DOMPurify.addHook('afterSanitizeElements', (node) => {
              if (
                node.nodeType === Node.TEXT_NODE &&
                node.nodeValue!.includes('mjx-container')
              ) {
                node.nodeValue = htmlDecode(node.nodeValue!);
              }
            });

            // - prevent click-jacking (this is quite naive), don't allow styling href.
            DOMPurify.addHook('beforeSanitizeElements', (node) => {
              if (
                node.hasAttribute &&
                node.hasAttribute('style') &&
                // may catch false attack if the text includes "href"
                // but styling should be allowed only on very specific cases
                // Ignore `href="#` see xlink:href before and allows local links.
                node.outerHTML.match(/href=["'][^#]/)
              ) {
                node.setAttribute('style', '');
              }
            });

            // - preserve `<semantics>` tag used by KaTeX
            // - preserve `<mjx-container>` tag used by Mathjax
            // - preserve `jax`, `classname`, `focusable` attributes for Mathjax
            // - preserve `<foreignObject>`, this might be unsafe but this is used a lot to
            //   add text in SVG... Mermaid's DOMPurify sanitization already allows it.
            const sanitizedHtmlRenderedContent = DOMPurify.sanitize(
              htmlRenderedContent,
              {
                ADD_TAGS: [
                  'use',
                  'foreignObject',
                  'mjx-container',
                  'semantics',
                  'annotation',
                ],
                ADD_ATTR: ['jax', 'classname', 'focusable'],
                IN_PLACE: true,
              },
            );
            setRenderedText(sanitizedHtmlRenderedContent);

            setLoading(false); // needs to be done before fetching content, of course.

            // Fetch the whole rendered content including the markdown styled div
            const bodies = document.querySelectorAll('div.markdown-body');
            if (bodies.length && bodies[0].outerHTML) {
              onRenderedContentChange(bodies[0].outerHTML);
            }
          })
          .catch((reason) => {
            setRenderedText(reason.toString());
            onRenderedContentChange(null);
            setLoading(false);
          });
      },
      debouncingTime,
    ),
  ).current;

  // Prevent debounce leak
  React.useEffect(() => {
    return () => {
      debouncedRendering.cancel();
    };
  }, [debouncedRendering]);

  React.useEffect(() => {
    if (markdownText === null) {
      return;
    }
    debouncedRendering(markdownText, renderingOptions);
  }, [debouncedRendering, markdownText, renderingOptions]);

  return !loading && renderedText !== null ? (
    <div // div required as grommet.Box does not allow dangerouslySetInnerHTML
      // markdown-body required for github-markdown-css/github-markdown.css
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: renderedText }}
    />
  ) : (
    <Spinner size="large" />
  );
};
