/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { fromParse5 } from 'hast-util-from-parse5';
import { Code, Parent } from 'mdast';
import { parseFragment } from 'parse5';
import { visit, Test } from 'unist-util-visit';

import { markdownRenderLatex } from '@lib-markdown/data/queries';

const remarkLatexPlugin = (markdownDocumentId: string) => {
  // `markdownDocumentId` is mandatory to allow API calls
  return () => {
    return async function transformer(ast: any) {
      const instances: [string, number, Parent][] = [];

      visit<Code, Test>(
        ast,
        // Only cat code block defined by "``` latex svg=true"
        // @ts-ignore
        { type: 'code', lang: 'latex', meta: 'svg=true' },
        (node, index, parent) => {
          instances.push([node.value, index!, parent as Parent]);
        },
      );

      if (!instances.length) {
        return ast;
      }

      await Promise.all(
        instances.map(async ([latexCode, indexInTree, parentNode]) => {
          try {
            const response = await markdownRenderLatex(
              markdownDocumentId,
              latexCode,
            );
            if (response.latex_image) {
              parentNode.children[indexInTree] = {
                type: 'paragraph',
                children: [{ type: 'html', value: response.latex_image }],
                data: {
                  hProperties: { className: 'latex-inline' },
                  hChildren: [fromParse5(parseFragment(response.latex_image))],
                },
              };
            }
          } catch (e) {
            // 400 will be caught here
            console.warn(e);
          }
        }),
      );

      return ast;
    };
  };
};

export default remarkLatexPlugin;
