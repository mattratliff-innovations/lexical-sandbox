import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LetterResults from './LetterResults';

const mockData = [
  {
    id: '6486bece-89be-4ee3-b0a4-5f997d132b1e',
    receiptNumber: 'IOE1234567890',
    form_type_name: 'I90',
    statusId: 'draft',
    updated_at: '2023-08-21T17:07:55.638Z',
    createdAt: '2023-08-21T17:07:55.638Z',
    letter_date_override: null,
    letter_type_name: 'Letter Type 1',
    organization_name: 'California Service Center',
    created_by: 'Chris G Oliver',
    vawa: true,
  },
  {
    id: '272c22a8-6552-4895-a9e0-420ff86a4f34',
    receiptNumber: 'IOE1234567891',
    form_type_name: 'I90',
    statusId: 'completed-local',
    updated_at: '2023-08-21T17:07:55.638Z',
    createdAt: '2023-08-21T17:07:55.638Z',
    letter_date_override: null,
    letter_type_name: 'Letter Type 1',
    organization_name: 'California Service Center',
    created_by: 'Chris G Oliver',
    vawa: false,
  },
];

const renderComponent = () => {
  render(
    <BrowserRouter>
      <LetterResults filteredLetters={mockData} />
    </BrowserRouter>
  );
};

describe('LetterResults', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('with valid data', () => {
    it("displays current user's recent drafts", async () => {
      renderComponent();

      // HEADER Test
      const expectedHeaders = [
        'Receipt Number',
        'Form Type',
        'Letter Type',
        'Status',
        'VAWA?',
        'Letter Date',
        'Date Created',
        'Organization',
        'Letter Creator',
        'A-Number',
      ];

      await screen.findByTestId('drAccessibleTable');

      const { shadowRoot } = document.querySelector('dr-table');
      const table = shadowRoot.querySelector('table');
      const headerRow = table.querySelector('thead tr');
      const actualHeaders = Array.from(headerRow.querySelectorAll('th')).map((header) => header.textContent);

      expectedHeaders.forEach((expectedHeader) => {
        const headerMatched = actualHeaders.some((actualHeader) => actualHeader.includes(expectedHeader));
        expect(headerMatched).toBeTruthy();
      });

      // DATA Test
      const expectedValues = [
        'IOE1234567890',
        'IOE1234567891',
        'I90',
        'Letter Type 1',
        'Yes',
        'draft',
        'completed-local',
        '8/21/2023, 5:07 PM',
        '8/21/2023, 5:07 PM',
        'California Service Center',
        'Chris G Oliver',
      ];

      expectedValues.forEach(async (tableValue) => {
        await waitFor(() => {
          expect(screen.queryByText(tableValue)).toBeInTheDocument();
        });
      });
    });

    it('links both drafts and completed letters to the "letter/preview" page', () => {
      renderComponent();

      expect(screen.getByRole('link', { name: 'IOE1234567890' })).toHaveAttribute('href', `/letter/preview/${mockData[0].id}`);
      expect(screen.getByRole('link', { name: 'IOE1234567891' })).toHaveAttribute('href', `/letter/preview/${mockData[1].id}`);
    });
  });
});
