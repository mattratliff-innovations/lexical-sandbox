import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import TestLayout from '../../../../testSetup/admin/TestLayout';
import HeaderWrapper from './HeaderWrapper';
import ListHeaders from './ListHeaders';
import CreateHeader from './CreateHeader';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';

// Mock navigate
const mockedUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUseNavigate,
}));

const mockAxios = new MockAdapter(axios);
const mockCreateApiCall = async (returnData) => mockAxios.onPost(`${APP_API_ENDPOINT}/headers/`).reply(200, returnData);
const mockCreateApiCallError = async (returnData) => mockAxios.onPost(`${APP_API_ENDPOINT}/headers/`).reply(422, returnData);

describe('CreateHeader', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();

    const routes = createRoutesFromElements(
      <Route path="/" element={<TestLayout />}>
        <Route path="/admin/headers" element={<HeaderWrapper />}>
          <Route index element={<ListHeaders />} />
          <Route path="create" element={<CreateHeader />} />
        </Route>
      </Route>
    );

    const router = createMemoryRouter(routes, {
      initialEntries: ['/', '/admin/headers/create'],
      initialIndex: [1],
    });
    render(<RouterProvider router={router} />);
  });

  it('displays Headers', async () => expect(screen.getByTestId('header', { name: /Create Letter Header/i })).toBeInTheDocument());

  it('displays a successful message with a default checked active checkbox', async () => {
    const userInstance = userEvent.setup();
    await mockCreateApiCall({});
    const activeCheckBox = screen.getByLabelText('Header is Active');
    expect(activeCheckBox.checked).toEqual(true);
    await userInstance.type(screen.getByLabelText('Letter Header Name'), 'Header Name 123');

    const hiddenEditorInputR1C1 = document.querySelector('#contentR1C1');
    await userInstance.type(hiddenEditorInputR1C1, '[[[LETTER_DATE]]]');

    const hiddenEditorInputR1C2 = document.querySelector('#contentR1C2');
    await userInstance.type(hiddenEditorInputR1C2, '[[[CIS_ADDRESS]]]');

    const { shadowRoot } = screen.getByTestId('createButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    expect((await screen.findAllByText('Header created successfully!')).length > 0).toBe(true);
  });

  it('displays a successful message submitting from Quick Actions button', async () => {
    const userInstance = userEvent.setup();
    await mockCreateApiCall({});
    await userInstance.type(screen.getByLabelText('Letter Header Name'), 'Header Name 123');
    await userInstance.click(screen.getByRole('button', { name: 'Save Header' }));

    expect((await screen.findAllByText('Header created successfully!')).length > 0).toBe(true);
  });

  it('displays a post error duplicate message', async () => {
    const returnData = {
      error: 'Unable to create Header: Name has already been taken',
    };
    const userInstance = userEvent.setup();

    await mockCreateApiCallError(returnData);
    await userInstance.type(screen.getByLabelText('Letter Header Name'), 'Header Name 123');
    const { shadowRoot } = screen.getByTestId('createButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    expect(await screen.findByText(returnData.error)).toBeInTheDocument();
  });

  describe('Name with alphanumeric characters, dashes, spaces, and underscores', () => {
    const invalidMsg = 'Only alphanumeric characters, dashes, spaces, and underscores are allowed.';

    it('displays validation message for invalid name and no message for valid name', async () => {
      const userInstance = userEvent.setup();
      const headerNameInput = screen.getByLabelText('Letter Header Name');
      const shadowRootButton = screen.getByTestId('createButton').shadowRoot;

      await userInstance.type(headerNameInput, 'Header@Name% 123');
      await userInstance.click(shadowRootButton.querySelector('.dr-btn'));
      expect(await screen.queryByText(invalidMsg)).toBeInTheDocument();

      await userInstance.clear(headerNameInput); // clear the input field and provide a valid name

      await userInstance.type(headerNameInput, 'Header_Name-123');
      await userInstance.click(shadowRootButton.querySelector('.dr-btn'));
      expect(await screen.queryByText(invalidMsg)).not.toBeInTheDocument();
    });

    // this test covers both edit/create form
    it('Form properly checks for blank fields on submission', async () => {
      const userInstance = userEvent.setup();
      await mockCreateApiCall({});

      const { shadowRoot } = screen.getByTestId('druid-alert-container').querySelector('dr-alert');
      const druidAlert = shadowRoot.querySelector('.dr-root-container');
      expect(druidAlert).toHaveTextContent('All fields marked with a red asterisk (*) are required.');

      const shadowRootButton = screen.getByTestId('createButton').shadowRoot;
      await userInstance.click(shadowRootButton.querySelector('.dr-btn'));
      expect(druidAlert).toHaveTextContent(/Some required fields need to be updated/i);

      await userInstance.type(screen.getByLabelText('Letter Header Name'), 'Header Name 123');

      await userInstance.click(shadowRootButton.querySelector('.dr-btn'));

      expect((await screen.findAllByText('Header created successfully!')).length > 0).toBe(true);
    });
  });

  describe('Test isSubmitting', () => {
    it('Form properly disable and enable the submit button', async () => {
      const mockAxiosDelay = new MockAdapter(axios, { delayResponse: 500 });
      await mockAxiosDelay.onPost(`${APP_API_ENDPOINT}/headers/`).reply(200, {});

      const userInstance = userEvent.setup();
      const submitButton = screen.getByTestId('createButton');
      const shadowRootButton = submitButton.shadowRoot;
      const druidButton = shadowRootButton.querySelector('.dr-btn');

      await userInstance.type(screen.getByLabelText('Letter Header Name'), 'Header Name 123');
      await userInstance.click(druidButton);

      expect(druidButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Saving...');

      await waitFor(() => {
        expect(druidButton).not.toBeDisabled();
        expect(submitButton).toHaveTextContent('Save');
      });
    });
  });
});
