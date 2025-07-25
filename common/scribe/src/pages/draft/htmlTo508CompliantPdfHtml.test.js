import renderPdfHtml from './htmlTo508CompliantPdfHtml';

describe('renderPdfHtml', () => {
  it('converts draft margins from inches to pixels and sets the content', () => {
    const draft = {
      marginTop: 1.0,
      marginBottom: 0.75,
      marginLeft: 0.5,
      marginRight: 0.25,
    };
    const htmlContent = 'Hello World';

    const result = renderPdfHtml(`<p>${htmlContent}</p>`, draft);

    const parser = new DOMParser();
    const html = parser.parseFromString(result, 'text/html');
    const head = html.querySelector('head');
    const style = head.querySelector('style');
    const headStyle = style.textContent.trim();

    expect(headStyle).toContain('@page');
    expect(headStyle).toContain('size: 8.5in 11in;');
    expect(headStyle).toContain('margin: 0;'); // don't remove because there is no way to test the subtle shift in the PDF margins
    expect(headStyle).toContain('padding: 0;');

    const bodyStyle = html.querySelector('body').getAttribute('style');
    expect(bodyStyle).toContain('font-family:Times New Roman, Times, serif;font-size:12pt;line-height:1.2');

    const bodyDiv = html.querySelector('body div');
    const bodyDivStyle = bodyDiv.getAttribute('style');
    expect(bodyDivStyle).toContain('margin-top:1in;');
    expect(bodyDivStyle).toContain('margin-bottom:0.75in;');
    expect(bodyDivStyle).toContain('margin-left:0.5in;');
    expect(bodyDivStyle).toContain('margin-right:0.25in');

    const content = html.querySelector('body div p');
    expect(content.innerHTML).toEqual(htmlContent);
  });
});
