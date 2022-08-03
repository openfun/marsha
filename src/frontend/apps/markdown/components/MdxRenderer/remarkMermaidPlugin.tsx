import { fromParse5 } from 'hast-util-from-parse5';
import { Code } from 'mdast';
import mermaid from 'mermaid';
import { parseFragment } from 'parse5';
import { visit } from 'unist-util-visit';
import { v4 as uuidv4 } from 'uuid';

const remarkMermaidPlugin = () => {
  // Mermaid initialization seems not mandatory
  // if needed later it might be proper to add the
  // init code directly inside MdxRenderer component to load code only once
  // mermaid.initialize({
  //   startOnLoad: false,
  // });

  return function transformer(ast: any) {
    visit<Code>(
      ast,
      // Only catch code block defined by "``` mermaid"
      // @ts-ignore
      { type: 'code', lang: 'mermaid' },
      (node) => {
        const mermaidText = node.value;
        mermaid.render(`mermaid-id-${uuidv4()}`, mermaidText!, (svgCode) => {
          node.children = [{ type: 'html', svgCode }];
          node.data = { hChildren: [fromParse5(parseFragment(svgCode))] };
        });
      },
    );

    return ast;
  };
};

export default remarkMermaidPlugin;
