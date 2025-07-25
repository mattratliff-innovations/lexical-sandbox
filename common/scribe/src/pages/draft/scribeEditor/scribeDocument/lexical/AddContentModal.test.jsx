import * as React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import axios from 'axios';
import userEvent from '@testing-library/user-event';
import { editorConfig } from './lexicalUtil';
import AddContentModal from './AddContentModal';
import { DataContext } from '../DataContext';
import { APP_API_ENDPOINT } from '../../../../../http/authenticatedAxios';
import draftJson from '../../../../../../cypress/fixtures/drafts/draft.json';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

const mockSnippetGroupData = [
  {
    id: 'SGID100',
    name: 'Snippet Group Name',
    active: true,
    multiple: false,
    snippets: [
      {
        id: '1',
        name: 'S1',
        content: 'content 1',
        active: true,
      },
      {
        id: '2',
        name: 'S2',
        content: 'content 2',
        active: true,
      },
    ],
  },
];

const mockStandardParagraphData = [
  {
    id: 'f4015ccf-a91a-4d4b-8aa8-1b4d2c19d71d',
    name: 'Name 1',
    code: 'STANDARDPARAGRAPH1',
    description: 'Standard Paragraph description 1',
    active: true,
    locked: false,
    content: 'Standard Paragraph content 1',
  },
  {
    id: 'a9f2319c-eebf-4e1a-aa65-afa1e4c2b71d',
    name: 'Name 2',
    code: 'STANDARDPARAGRAPH2',
    description: 'Standard Paragraph description 2',
    active: true,
    locked: true,
    content: 'Standard Paragraph content 2',
  },
];

const mockContextValue = { draftState: draftJson, setDraftState: jest.fn() };
const mockContextWithoutDraft = { draftState: null, setDraftState: jest.fn() };

const renderComponent = async (contextValue) => {
  await act(async () => {
    render(
      <DataContext.Provider value={contextValue}>
        <LexicalComposer initialConfig={{ ...editorConfig, editable: true }}>
          <AddContentModal showAddContentModal setShowAddContentModal={() => jest.fn()} />
        </LexicalComposer>
      </DataContext.Provider>
    );
  });
};

const mockSnippetCall = (returnData) => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/snippet_groups`).reply(200, returnData);
};

const mockStandardParagraphCall = (returnData) => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/standard_paragraphs/available_standard_paragraphs_form_letter_type`).reply(200, returnData);
};

const mockSnippetGroupByAssociationCall = (returnData) => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/snippet_groups/snippet_groups_for_letter_type`).reply(200, returnData);
};

describe('AddContentModal', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockAxios.reset();
    mockStandardParagraphCall(mockStandardParagraphData);
    mockSnippetGroupByAssociationCall(mockSnippetGroupData);
    mockSnippetCall(mockSnippetGroupData);
    await renderComponent(mockContextValue);
  });

  it('has Snippet Groups associted to letter and form type', async () => {
    const userInstance = userEvent.setup();

    expect(screen.getByText('Add Content')).toBeInTheDocument();

    const { shadowRoot } = screen.getByTestId('addSnippetButton');
    await waitFor(() => expect(shadowRoot.querySelector('.dr-btn')).toBeDefined());
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    const snippetGroupName = screen.getByText(`${mockSnippetGroupData[0].name} |`);
    expect(snippetGroupName).toBeInTheDocument();

    const snippetCount = screen.getByText(`${mockSnippetGroupData[0].snippets.length} Snippets`);
    expect(snippetCount).toBeInTheDocument();

    const addButton = screen.getByTestId('addButton').shadowRoot;
    await waitFor(() => expect(addButton.querySelector('.dr-btn')).toBeDefined());

    const cancelButton = screen.getByTestId('cancelModalButton').shadowRoot;
    await waitFor(() => expect(cancelButton.querySelector('.dr-btn')).toBeDefined());

    const updateUrl = mockAxios.history.get[0].url;
    expect(updateUrl).toEqual(expect.stringContaining('snippet_groups_for_letter_type'));
  });

  it('has Standard Paragraphs with one locked', async () => {
    const userInstance = userEvent.setup();

    expect(screen.getByText('Add Content')).toBeInTheDocument();

    const { shadowRoot } = screen.getByTestId('addStandardParagraphButton');
    await waitFor(() => expect(shadowRoot.querySelector('.dr-btn')).toBeDefined());
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    const paragraphCode = screen.getByText(`${mockStandardParagraphData[0].name} | ${mockStandardParagraphData[0].code}`);

    await waitFor(() => expect(paragraphCode).toBeInTheDocument());

    const iconElement = screen.getByRole('img', { name: /locked/i });
    expect(iconElement).toBeInTheDocument();

    const addButton = screen.getByTestId('addButton').shadowRoot;
    await waitFor(() => expect(addButton.querySelector('.dr-btn')).toBeDefined());

    const cancelButton = screen.getByTestId('cancelModalButton').shadowRoot;
    await waitFor(() => expect(cancelButton.querySelector('.dr-btn')).toBeDefined());
  });
});

describe('AddContentModal in Admin', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockAxios.reset();
    mockSnippetCall(mockSnippetGroupData);
    await renderComponent(mockContextWithoutDraft);
  });

  it('has all Snippet Groups', async () => {
    const userInstance = userEvent.setup();

    expect(screen.getByText('Add Content')).toBeInTheDocument();

    const { shadowRoot } = screen.getByTestId('addSnippetButton');
    await waitFor(() => expect(shadowRoot.querySelector('.dr-btn')).toBeDefined());
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    const snippetGroupName = screen.getByText(`${mockSnippetGroupData[0].name} |`);
    expect(snippetGroupName).toBeInTheDocument();

    const snippetCount = screen.getByText(`${mockSnippetGroupData[0].snippets.length} Snippets`);
    expect(snippetCount).toBeInTheDocument();

    const updateUrl = mockAxios.history.get[0].url;
    expect(updateUrl).toEqual(expect.stringContaining('snippet_groups'));
  });
});
