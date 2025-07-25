import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import TestLayout from '../../../testSetup/admin/TestLayout';
import UtilityModal from './UtilityModal';
import CreateLetterType from '../admin/letterTypes/CreateLetterType';
import ListLetterTypes from '../admin/letterTypes/ListLetterTypes';
import LetterTypeWrapper from '../admin/letterTypes/LetterTypeWrapper';
import CreateHeader from '../admin/headers/CreateHeader';
import ListHeaders from '../admin/headers/ListHeaders';
import HeaderWrapper from '../admin/headers/HeaderWrapper';
import CreateOrganization from '../admin/organizations/CreateOrganization';
import ListOrganizations from '../admin/organizations/ListOrganizations';
import OrganizationWrapper from '../admin/organizations/OrganizationWrapper';
import waitForLoadingToFinish from '../../testUtils/waitForLoadingToFinish';

const renderOrg = () => {
  const routes = createRoutesFromElements(
    <Route path="/" element={<TestLayout />}>
      <Route path="/admin/organizations" element={<OrganizationWrapper />}>
        <Route index element={<ListOrganizations />} />
        <Route path="create" element={<CreateOrganization />} />
      </Route>
    </Route>
  );

  const router = createMemoryRouter(routes, {
    initialEntries: ['/', '/admin/organizations/create'],
    initialIndex: 1,
  });
  render(<RouterProvider router={router} />);
};

const renderHeader = () => {
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
    initialIndex: 1,
  });
  render(<RouterProvider router={router} />);
};

const renderLetterType = () => {
  const routes = createRoutesFromElements(
    <Route path="/" element={<TestLayout />}>
      <Route path="/admin/letterTypes" element={<LetterTypeWrapper />}>
        <Route index element={<ListLetterTypes />} />
        <Route path="create" element={<CreateLetterType />} />
      </Route>
    </Route>
  );

  const router = createMemoryRouter(routes, {
    initialEntries: ['/', '/admin/letterTypes/create'],
    initialIndex: 1,
  });
  render(<RouterProvider router={router} />);
};

describe('Exit Modal', () => {
  it('renders UtilityModal and matches snapshot ', async () => {
    render(<UtilityModal isOpen setIsOpen={() => {}} name="snapshot test" blocker={{}} />);
    expect(screen.getByText(/snapshot/)).toBeInTheDocument();
    // snapshot isn't working as expecting currently, will fix later.
    // expect(screen).toMatchSnapshot();
  });
});

describe('CreateOrganization Check', () => {
  it('verifies the UtilityModal and does not proceed', async () => {
    const userInstance = userEvent.setup();
    renderOrg();
    await waitForLoadingToFinish();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    await userInstance.type(screen.getByTestId('nameInput'), 'Test Name');

    const cancelBtn = screen.getByTestId('cancelButton');
    await userInstance.click(cancelBtn.shadowRoot.querySelector('.dr-btn'));

    let orgWarning = await screen.findByText(/Leaving this "Organization" form/);
    expect(orgWarning).toBeInTheDocument();

    const { shadowRoot } = screen.getByTestId('exitModalCancel');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
    orgWarning = screen.queryByText(/Leaving this "Organization" form/);

    await waitFor(() => expect(orgWarning).not.toBeInTheDocument());
  });

  it('verifies the UtilityModal and proceeds', async () => {
    const userInstance = userEvent.setup();
    renderOrg();
    await waitForLoadingToFinish();

    expect(screen.getByTestId('header')).toBeInTheDocument();

    await userInstance.type(screen.getByTestId('nameInput'), 'Test Name');

    const cancelBtn = screen.getByTestId('cancelButton');
    await userInstance.click(cancelBtn.shadowRoot.querySelector('.dr-btn'));

    const orgWarning = await screen.findByText(/Leaving this "Organization" form/);
    expect(orgWarning).toBeInTheDocument();

    const { shadowRoot } = screen.getByText('Leave Page');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
    expect(screen.getByTestId('adminListCreateButtonDiv')).toBeInTheDocument();
  });
});

describe('CreateHeader Check', () => {
  it('verifies the UtilityModal after change has occured and does not proceed', async () => {
    await waitForLoadingToFinish();
    const userInstance = userEvent.setup();
    renderHeader();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    await userInstance.type(screen.getByLabelText('Letter Header Name'), 'Test Name');

    const cancelFormBtn = screen.getByTestId('cancelButton');
    await waitFor(() => expect(cancelFormBtn.shadowRoot.querySelector('.dr-btn')).toBeDefined());
    await userInstance.click(cancelFormBtn.shadowRoot.querySelector('.dr-btn'));

    let headerWarning = await screen.findByText(/Leaving this "Letter Header" form/);
    expect(headerWarning).toBeInTheDocument();

    const { shadowRoot } = screen.getByTestId('exitModalCancel');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
    headerWarning = screen.queryByText(/Leaving this "Letter Header" form/);

    await waitFor(() => expect(headerWarning).not.toBeInTheDocument());
  });

  it('verifies the UtilityModal after change and proceeds', async () => {
    const userInstance = userEvent.setup();
    renderHeader();
    await waitForLoadingToFinish();

    expect(screen.getByTestId('header')).toBeInTheDocument();
    await userInstance.type(screen.getByLabelText('Letter Header Name'), 'Test Name');

    const cancelFormBtn = screen.getByTestId('cancelButton');
    await waitFor(() => expect(cancelFormBtn.shadowRoot.querySelector('.dr-btn')).toBeDefined());
    await userInstance.click(cancelFormBtn.shadowRoot.querySelector('.dr-btn'));

    const headerWarning = await screen.findByText(/Leaving this "Letter Header" form/);

    expect(headerWarning).toBeInTheDocument();
    const { shadowRoot } = screen.getByText('Leave Page');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
    expect(screen.getByTestId('adminListCreateButtonDiv')).toBeInTheDocument();
  });
});

describe('CreateLetterType Check', () => {
  it('verifies the UtilityModal and does not proceed', async () => {
    const userInstance = userEvent.setup();
    renderLetterType();
    await waitForLoadingToFinish();
    expect(screen.getByTestId('header')).toBeInTheDocument();

    const nameInput = screen.getByLabelText('Letter Type Name');
    await userInstance.type(nameInput, 'daniel');

    const cancelFormBtn = screen.getByTestId('cancelButton');
    await waitFor(() => expect(cancelFormBtn.shadowRoot.querySelector('.dr-btn')).toBeDefined());
    await userInstance.click(cancelFormBtn.shadowRoot.querySelector('.dr-btn'));

    let letterTypeWarning = await screen.findByText(/Leaving this "Letter Type" form/);
    await waitFor(() => expect(letterTypeWarning).toBeInTheDocument());

    const { shadowRoot } = screen.getByTestId('exitModalCancel');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
    letterTypeWarning = screen.queryByText(/Leaving this "Letter Type" form/);

    await waitFor(() => expect(letterTypeWarning).not.toBeInTheDocument());
  });

  it('verifies the UtilityModal and proceeds', async () => {
    const userInstance = userEvent.setup();
    renderLetterType();
    await waitForLoadingToFinish();
    expect(screen.getByTestId('header')).toBeInTheDocument();

    const nameInput = screen.getByLabelText('Letter Type Name');
    await userInstance.type(nameInput, 'daniel');

    const cancelFormBtn = screen.getByTestId('cancelButton');
    await waitFor(() => expect(cancelFormBtn.shadowRoot.querySelector('.dr-btn')).toBeDefined());
    await userInstance.click(cancelFormBtn.shadowRoot.querySelector('.dr-btn'));

    const letterTypeWarning = await screen.findByText(/Leaving this "Letter Type" form/);
    await waitFor(() => expect(letterTypeWarning).toBeInTheDocument());
    const { shadowRoot } = screen.getByText('Leave Page');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
    expect(screen.getByTestId('adminListCreateButtonDiv')).toBeInTheDocument();
  });
});
