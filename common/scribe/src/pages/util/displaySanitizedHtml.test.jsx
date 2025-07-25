import { renderToStaticMarkup } from 'react-dom/server';
import { sanitizedHtml } from './displaySanitizedHtml';

it('filters out javascript', () => {
  const scriptTag = "<script type='text/javascript'>alert('Hi!')</script>";
  const htmlWithJavascript = `<div>${scriptTag}</div>`;

  const view = renderToStaticMarkup(sanitizedHtml(htmlWithJavascript));

  expect(view).not.toContain(scriptTag);
});
