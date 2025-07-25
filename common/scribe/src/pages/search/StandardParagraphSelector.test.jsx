import * as React from 'react';
import { render, waitFor, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import StandardParagraphSelector from './StandardParagraphSelector';
import { APP_API_ENDPOINT } from '../../http/authenticatedAxios';
import waitForLoadingToFinish from '../../testUtils/waitForLoadingToFinish';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

const standardParagraphData = [
  {
    id: 'g210b4aa66ae',
    name: 'SP2',
    code: 'STANDARDPARAGRAPH2',
    description: 'Standard Paragraph description 2',
    active: true,
    locked: false,
    created_at: '2024-10-23T16:37:38.908Z',
    updated_at: '2024-10-23T16:37:38.908Z',
    content: 'Standard Paragraph content 2',
  },
  {
    id: '201c8acc3e32',
    name: 'SP1',
    code: 'STANDARDPARAGRAPH1',
    description: 'Standard Paragraph description 1',
    active: true,
    locked: false,
    created_at: '2024-10-23T16:37:38.897Z',
    updated_at: '2024-10-23T16:37:38.897Z',
    content: 'Standard Paragraph content 1',
  },
  {
    id: '19db10d36e5d',
    name: 'SP3',
    code: 'STANDARDPARAGRAPH3',
    description: 'Standard Paragraph description 3',
    active: true,
    locked: true,
    created_at: '2024-10-23T16:37:38.930Z',
    updated_at: '2024-10-23T16:37:38.930Z',
    content: 'Standard Paragraph content 3',
  },
];

const mockStandardParagraphsApiCall = (returnData) => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/standard_paragraphs/available_standard_paragraphs_form_letter_type`).reply(200, returnData);
};

const renderComponent = () => {
  render(
    <>
      <ToastContainer />
      <StandardParagraphSelector letterTypeId="" formTypeCode="" register={jest.fn()} setValue={jest.fn()} />
    </>
  );
};

describe('Standard Paragraph', () => {
  it('displays no standard paragraphs at default', async () => {
    mockStandardParagraphsApiCall([]);
    renderComponent();
    await waitForLoadingToFinish();

    expect(screen.getByText('No Associated Standard Paragraphs')).toBeInTheDocument();

    standardParagraphData.forEach((paragraph) => {
      expect(screen.queryByText(`${paragraph.name} | ${paragraph.code}`)).not.toBeInTheDocument();
    });
  });

  it('displays Standard Paragraphs, with one locked icon', async () => {
    mockStandardParagraphsApiCall(standardParagraphData);
    renderComponent();
    await waitForLoadingToFinish();

    await waitFor(() => {
      expect(screen.queryByText('No Associated Standard Paragraphs')).not.toBeInTheDocument();

      standardParagraphData.forEach((paragraph) => {
        expect(screen.getByText(`${paragraph.name} | ${paragraph.code}`)).toBeInTheDocument();
      });

      const iconElement = screen.getByRole('img', { name: /locked/i });
      expect(iconElement).toBeInTheDocument();
    });
  });

  it('shows standard-paragraphs in correct section', async () => {
    renderComponent();
    await waitForLoadingToFinish();

    mockStandardParagraphsApiCall(standardParagraphData);
    const userInstance = userEvent.setup();

    let availableParagraphDiv = screen.queryByTestId('available-standard-paragraphs-div');
    expect(await within(availableParagraphDiv).findByText(`${standardParagraphData[0].name} | ${standardParagraphData[0].code}`)).toBeInTheDocument();
    expect(
      await within(availableParagraphDiv).queryByText(`${standardParagraphData[1].name} | ${standardParagraphData[1].code}`)
    ).toBeInTheDocument();
    expect(await within(availableParagraphDiv).findByText(`${standardParagraphData[2].name} | ${standardParagraphData[2].code}`)).toBeInTheDocument();

    let includedParagraphDiv = screen.queryByTestId('included-standard-paragraphs-div');
    expect(includedParagraphDiv).toBeNull();

    await userInstance.click(screen.getByTestId(`available-standard-paragraph-${standardParagraphData[0].id}`));
    await userInstance.click(screen.getByTestId(`available-standard-paragraph-${standardParagraphData[2].id}`));

    includedParagraphDiv = screen.getByTestId('included-standard-paragraphs-div');
    expect(await within(includedParagraphDiv).findByText(`${standardParagraphData[0].name} | ${standardParagraphData[0].code}`)).toBeInTheDocument();
    expect(
      await within(includedParagraphDiv).queryByText(`${standardParagraphData[1].name} | ${standardParagraphData[1].code}`)
    ).not.toBeInTheDocument();
    expect(await within(includedParagraphDiv).findByText(`${standardParagraphData[2].name} | ${standardParagraphData[2].code}`)).toBeInTheDocument();

    availableParagraphDiv = screen.getByTestId('available-standard-paragraphs-div');
    expect(
      await within(availableParagraphDiv).queryByText(`${standardParagraphData[0].name} | ${standardParagraphData[0].code}`)
    ).not.toBeInTheDocument();
    expect(await within(availableParagraphDiv).findByText(`${standardParagraphData[1].name} | ${standardParagraphData[1].code}`)).toBeInTheDocument();
    expect(
      await within(availableParagraphDiv).queryByText(`${standardParagraphData[2].name} | ${standardParagraphData[2].code}`)
    ).not.toBeInTheDocument();
  });

  it('shows standard paragraphs sorted correctly in both sections', async () => {
    mockStandardParagraphsApiCall(standardParagraphData);
    renderComponent();
    await waitForLoadingToFinish();

    const userInstance = userEvent.setup();
    const getSortedCodes = (div) =>
      within(div)
        .getAllByText((_, el) => el.tagName === 'LABEL')
        .map((l) => l.textContent);
    const expectedSortedCodes = [...standardParagraphData].sort((a, b) => a.name.localeCompare(b.name)).map((p) => `${p.name} | ${p.code}`);
    const availableParagraphDiv = screen.getByTestId('available-standard-paragraphs-div');

    await waitFor(() => {
      expect(getSortedCodes(availableParagraphDiv)).toEqual(expectedSortedCodes);
    });

    await userInstance.click(screen.getByTestId(`available-standard-paragraph-${standardParagraphData[2].id}`));
    await userInstance.click(screen.getByTestId(`available-standard-paragraph-${standardParagraphData[1].id}`));
    await userInstance.click(screen.getByTestId(`available-standard-paragraph-${standardParagraphData[0].id}`));

    // Verify sorting of included standard paragraphs after selecting
    const includedParagraphDiv = screen.queryByTestId('included-standard-paragraphs-div');
    const renderedSortedCodes = getSortedCodes(includedParagraphDiv);

    expect(renderedSortedCodes.indexOf(`${standardParagraphData[2].name} | ${standardParagraphData[2].code}`)).toEqual(0);
    expect(renderedSortedCodes.indexOf(`${standardParagraphData[1].name} | ${standardParagraphData[1].code}`)).toEqual(1);
    expect(renderedSortedCodes.indexOf(`${standardParagraphData[0].name} | ${standardParagraphData[0].code}`)).toEqual(2);

    await userInstance.click(screen.getByTestId(`included-standard-paragraph-${standardParagraphData[2].id}`));
    await userInstance.click(screen.getByTestId(`included-standard-paragraph-${standardParagraphData[1].id}`));
    await userInstance.click(screen.getByTestId(`included-standard-paragraph-${standardParagraphData[0].id}`));

    // Verify sorting of available standard paragraphs after reverting
    expect(getSortedCodes(availableParagraphDiv)).toEqual(expectedSortedCodes);
  });

  it('shows standard paragraphs correctly after moving it down', async () => {
    mockStandardParagraphsApiCall(standardParagraphData);
    await waitFor(() => {
      renderComponent();
    });
    await waitForLoadingToFinish();

    const userInstance = userEvent.setup();
    const getSortedCodes = (div) =>
      within(div)
        .getAllByText((_, el) => el.tagName === 'LABEL')
        .map((l) => l.textContent);

    await userInstance.click(screen.getByTestId(`available-standard-paragraph-${standardParagraphData[2].id}`));
    await userInstance.click(screen.getByTestId(`available-standard-paragraph-${standardParagraphData[1].id}`));
    await userInstance.click(screen.getByTestId(`available-standard-paragraph-${standardParagraphData[0].id}`));

    // Verify sorting of included standard paragraphs after selecting
    const includedDiv = screen.queryByTestId('included-standard-paragraphs-div');

    // Move paragraph at the top position down one
    await userInstance.click(screen.getByTestId(`included-down-arrow-${standardParagraphData[2].id}`));
    expect(getSortedCodes(includedDiv).indexOf(`${standardParagraphData[2].name} | ${standardParagraphData[2].code}`)).toEqual(1);
    expect(getSortedCodes(includedDiv).indexOf(`${standardParagraphData[1].name} | ${standardParagraphData[1].code}`)).toEqual(0);

    // Move paragraph at the 2nd position down one
    await userInstance.click(screen.getByTestId(`included-down-arrow-${standardParagraphData[2].id}`));
    expect(getSortedCodes(includedDiv).indexOf(`${standardParagraphData[2].name} | ${standardParagraphData[2].code}`)).toEqual(2);
    expect(getSortedCodes(includedDiv).indexOf(`${standardParagraphData[0].name} | ${standardParagraphData[0].code}`)).toEqual(1);
  });

  it('shows standard paragraphs correctly after moving it up', async () => {
    mockStandardParagraphsApiCall(standardParagraphData);
    await waitFor(() => {
      renderComponent();
    });
    await waitForLoadingToFinish();

    const userInstance = userEvent.setup();
    const getSortedCodes = (div) =>
      within(div)
        .getAllByText((_, el) => el.tagName === 'LABEL')
        .map((l) => l.textContent);

    await userInstance.click(screen.getByTestId(`available-standard-paragraph-${standardParagraphData[2].id}`));
    await userInstance.click(screen.getByTestId(`available-standard-paragraph-${standardParagraphData[1].id}`));
    await userInstance.click(screen.getByTestId(`available-standard-paragraph-${standardParagraphData[0].id}`));

    const includedDiv = screen.queryByTestId('included-standard-paragraphs-div');

    // Move paragraph at the lowest position up one
    await userInstance.click(screen.getByTestId(`included-up-arrow-${standardParagraphData[0].id}`));
    expect(getSortedCodes(includedDiv).indexOf(`${standardParagraphData[0].name} | ${standardParagraphData[0].code}`)).toEqual(1);
    expect(getSortedCodes(includedDiv).indexOf(`${standardParagraphData[1].name} | ${standardParagraphData[1].code}`)).toEqual(2);

    // Move paragraph at the 2nd position up one
    await userInstance.click(screen.getByTestId(`included-up-arrow-${standardParagraphData[0].id}`));
    expect(getSortedCodes(includedDiv).indexOf(`${standardParagraphData[0].name} | ${standardParagraphData[0].code}`)).toEqual(0);
    expect(getSortedCodes(includedDiv).indexOf(`${standardParagraphData[2].name} | ${standardParagraphData[2].code}`)).toEqual(1);
  });

  it('shows a modal for content', async () => {
    mockStandardParagraphsApiCall(standardParagraphData);
    await waitFor(() => {
      renderComponent();
    });
    await waitForLoadingToFinish();

    const userInstance = userEvent.setup();

    await userInstance.click(screen.getByTestId(`available-standard-paragraph-eye-icon-${standardParagraphData[2].id}`));
    expect(screen.getByText(standardParagraphData[2].content)).toBeInTheDocument();
    expect(screen.queryByText(standardParagraphData[1].content)).not.toBeInTheDocument();
    expect(screen.queryByText(standardParagraphData[0].content)).not.toBeInTheDocument();

    await userInstance.click(screen.getByTestId('closeButtonModal'));
    await waitFor(() => expect(screen.queryByText(standardParagraphData[2].content)).not.toBeInTheDocument());
  });
});
