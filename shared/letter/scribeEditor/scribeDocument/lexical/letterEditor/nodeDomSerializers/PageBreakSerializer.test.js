import { createPagebreakBaseDom, getPageBreakFromDom, PAGEBREAK_KEY } from './PageBreakSerializer';
import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';

describe('getPageBreakFromDom', () => {
  it('gets the pagebreak from the dom', () => {
    const pageBreak = 'data-page-break';
    const div = document.createElement('div');
    div.setAttribute(PAGEBREAK_KEY, pageBreak);

    const result = getPageBreakFromDom(div);

    expect(result).toBe(pageBreak);
  });
});

describe('createPageBreakBaseDom', () => {
  it('creates the base div tag with the necessary data attributes', () => {
    const pageBreak = 'data-page-break';

    const result = createPagebreakBaseDom(pageBreak);

    expect(result.getAttribute(CUSTOM_NODE_TYPE_KEY)).toBe(pageBreak);
  });
});
