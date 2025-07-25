import purify from 'dompurify';
import React from 'react';

const createProps = (html) => ({
  dangerouslySetInnerHTML: {
    __html: purify.sanitize(html, { sanitize: true }),
  },
});

/* eslint-disable react/jsx-props-no-spreading */
export const sanitizedHtml = (html) => <div {...createProps(html)} />;
export const sanitizedCss = (css) => <style {...createProps(css)} />;
/* eslint-enable react/jsx-props-no-spreading */
