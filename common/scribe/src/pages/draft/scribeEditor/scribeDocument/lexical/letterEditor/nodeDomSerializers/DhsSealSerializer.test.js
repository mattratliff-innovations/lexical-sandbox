import { DHS_SEAL_TYPE, DHS_SEAL_KEY, getDhsSealFromDom, createDhsSealBaseDom } from './DhsSealSerializer';
import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';

describe('getDhsSealFromDom', () => {
  it('gets the DHS Seal from the dom', () => {
    const dhsSeal = '/path/to/image.svg';
    const span = document.createElement('span');
    span.setAttribute(DHS_SEAL_KEY, dhsSeal);

    const result = getDhsSealFromDom(span);

    expect(result).toBe(dhsSeal);
  });
});

describe('createDhsSealBaseDom', () => {
  it('creates the base span tag with the necessary data attributes', () => {
    const dhsSeal = '/path/to/image.svg';

    const result = createDhsSealBaseDom(dhsSeal);

    expect(result.getAttribute(CUSTOM_NODE_TYPE_KEY)).toBe(DHS_SEAL_TYPE);
    expect(result.getAttribute(DHS_SEAL_KEY)).toBe(dhsSeal);
  });
});
