import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';

export const DHS_SEAL_TYPE = 'dhsSeal';
export const DHS_SEAL_KEY = 'data-dhs-seal';
export const getDhsSealFromDom = (dom) => dom.getAttribute(DHS_SEAL_KEY);

export const createDhsSealBaseDom = (dhsSeal) => {
  const dom = document.createElement('span');
  dom.setAttribute(CUSTOM_NODE_TYPE_KEY, DHS_SEAL_TYPE);
  dom.setAttribute(DHS_SEAL_KEY, dhsSeal);
  return dom;
};
