import React, { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import { AppContext } from '../../AppProvider';

import CorHistory from '.';

const query = 'IOE1234567890';
const PLACEHOLDER_TEXT = 'ex: IOE1234567890';

const mockReceiptNumbersData = {
  registration: { receiptNumber: 'IOE1234567890', formTypeName: 'N123' },
  applicantTypes: [
    {
      aNumber: 'A123456789',
      firstName: 'Indiana',
      middleName: 'W',
      lastName: 'Jones',
      firmName: null,
      primaryApplicant: true,
    },
  ],
  petitionerType: {},
  representativeType: {},
};

const mockedUseNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUseNavigate,
  useLocation: jest.fn(),
}));

const renderComponent = () => {
  const routes = createRoutesFromElements(<Route path="/correspondenceHistory" element={<CorHistory />} />);
  const router = createMemoryRouter(routes, {
    initialEntries: ['/correspondenceHistory'],
    initialIndex: 0,
  });

  render(
    <AppContext.Provider value={{ draft: mockReceiptNumbersData }}>
      <RouterProvider router={router} />
    </AppContext.Provider>
  );
};

describe('tests for CorHistory: ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    renderComponent();
  });

  it('displays clickable Go Home and redirects to search "home" when clicked', async () => {
    const userInstance = userEvent.setup();
    expect(screen.getByText(/IOE1234567890/i)).toBeInTheDocument();
    expect(screen.getByText(/Form Type N123/i)).toBeInTheDocument();
    expect(screen.getByText(/Indiana W Jones/i)).toBeInTheDocument();

    const { shadowRoot } = screen.getByTestId('goHome');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    expect(mockedUseNavigate).toHaveBeenLastCalledWith('/searchReceipt');
  });

  it('displays clickable Create New Letter button', async () => {
    const userInstance = userEvent.setup();

    await userInstance.type(screen.getByPlaceholderText(PLACEHOLDER_TEXT), query);
    const { shadowRoot } = screen.getByTestId('searchSubmit');
    await userEvent.click(shadowRoot.querySelector('.dr-btn'));

    await userInstance.click(screen.getByTestId('createNewLetter'));
    expect(mockedUseNavigate).toHaveBeenLastCalledWith('/createletter', {
      state: { createLetterObj: mockReceiptNumbersData },
    });
  });
});
