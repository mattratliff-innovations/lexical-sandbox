export const CUSTOM_NODE_TYPE_KEY = 'data-lexical-custom-node-type';

export const configureCustomNodeDomImport = (customNodeType, conversionFunction) => ({
  span: (domNode) => {
    if (domNode.getAttribute(CUSTOM_NODE_TYPE_KEY) !== customNodeType) return null;
    return {
      conversion: (domNodeForConversion) => ({
        node: conversionFunction(domNodeForConversion),
      }),
      priority: 2,
    };
  },
});
