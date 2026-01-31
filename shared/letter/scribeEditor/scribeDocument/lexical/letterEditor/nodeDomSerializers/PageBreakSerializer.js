import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';

export const PAGEBREAK_TYPE = 'pagebreak';
export const PAGEBREAK_KEY = 'data-page-break';
export const getPageBreakFromDom = (dom) => dom.getAttribute(PAGEBREAK_KEY);

export const createPagebreakBaseDom = () => {
  const div = document.createElement('div');
  div.setAttribute(CUSTOM_NODE_TYPE_KEY, PAGEBREAK_KEY);
  div.setAttribute('class', 'page-break');
  return div;
};
