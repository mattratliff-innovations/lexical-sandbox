import React, { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import userEvent from '@testing-library/user-event';
import { APP_API_ENDPOINT } from '../../http/authenticatedAxios';
import { letterTypes, multiModeData, letterRequestData } from './testData';
import '@testing-library/jest-dom';
import TypeaheadWithSelectedList from './TypeaheadWithSelectedList';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

const mockLetterRequest = () =>
  mockAxios.onGet(`${APP_API_ENDPOINT}/letter_types/available_letter_types_for_form_type`).reply(200, letterRequestData);

// eslint-disable-next-line react/prop-types
function TestComponent({ testId, testLabel, multiMode = false }) {
  const [allLetterTypes, setAllLetterTypes] = useState(multiMode ? multiModeData : letterTypes);

  return (
    <TypeaheadWithSelectedList
      typeaheadId={testId}
      typeaheadLabel={testLabel}
      options={allLetterTypes}
      setValues={setAllLetterTypes}
      multiMode={multiMode}
    />
  );
}

describe('TypeaheadWithSelectedList', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('renders with basic test data with letter header and selects a type, then removes the type.', async () => {
    const userInstance = userEvent.setup();

    render(<TestComponent testId="formsAndLetters" testLabel="Letter Types(s)" />);
    expect(screen.getByText('Selected Letter Types(s)')).toBeInTheDocument();

    const comboBoxContainer = screen.getByTestId('formsAndLetters');

    await userInstance.type(within(comboBoxContainer).getByRole('combobox'), 'Letter type test 2');
    await userInstance.click(screen.getByText('Letter type test 2'));

    await waitFor(() => expect(screen.queryByTestId('typeaheadSelectedContainer_formsAndLetters')).toHaveTextContent('Letter type test 2'));

    await userInstance.click(screen.getByTestId('removeButtonForLetter type test 2'));

    await waitFor(() => expect(screen.queryByTestId('typeaheadSelectedContainer_formsAndLetters')).not.toHaveTextContent('Letter type test 2'));
  });

  it('renders with basic test data with form header.', async () => {
    render(<TestComponent testId="formType" testLabel="Form Types(s)" />);
    expect(screen.getByText('Selected Form Types(s)')).toBeInTheDocument();
  });

  it('renders with basic test data with Organizations.', async () => {
    render(<TestComponent testId="organization" testLabel="Organization(s)" />);
    expect(screen.getByText('Selected Organization(s)')).toBeInTheDocument();
  });

  it('It filters choices properly when input is typed and resets back to original choices when input is cleared.', async () => {
    const userInstance = userEvent.setup();

    render(<TestComponent testId="formsAndLetters" testLabel="Letter Types(s)" />);

    const comboBoxContainer = await screen.findByTestId('formsAndLetters');
    await userInstance.type(within(comboBoxContainer).getByRole('combobox'), 'test');

    expect(screen.getByRole('option', { name: 'Letter type test 1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Letter type test 2' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Letter type test 3' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Letter type test 5' })).not.toBeInTheDocument();

    await userInstance.clear(within(comboBoxContainer).getByRole('combobox'));
    await userInstance.type(within(comboBoxContainer).getByRole('combobox'), 'Letter type test 2');

    expect(screen.queryByRole('option', { name: 'Letter type test 1' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Letter type test 2' })).toBeInTheDocument();
  });
});

describe('Multi Mode of TypeaheadWithSelectedList', () => {
  it('renders multi mode and verifies the second input is disabled until first input is selected.', async () => {
    const userInstance = userEvent.setup();
    mockLetterRequest();

    render(<TestComponent testId="formsAndLetters" testLabel="Letter Types(s)" multiMode />);
    const letterTypeComboBox = await screen.findByTestId('formsAndLetters');
    await userInstance.type(within(letterTypeComboBox).getByRole('combobox'), 'Letter type test');
    expect(screen.queryByRole('option', { name: 'Letter type test 1' })).not.toBeInTheDocument();

    const formTypeComboBox = await screen.findByTestId('formTypesSelect');
    await userInstance.type(within(formTypeComboBox).getByRole('combobox'), 'Form Type A');
    await userInstance.click(screen.getByText('Form Type A'));

    await userInstance.type(within(letterTypeComboBox).getByRole('combobox'), 'Letter type test 1');
    expect(screen.queryByRole('option', { name: 'Letter type test 1' })).toBeInTheDocument();

    await userInstance.click(screen.getByText('Letter type test 1'));

    await waitFor(() => expect(screen.queryByTestId('typeaheadSelectedContainer_formsAndLetters')).toHaveTextContent('Form Type A'));
    await waitFor(() => expect(screen.queryByTestId('typeaheadSelectedContainer_formsAndLetters')).toHaveTextContent('Letter type test 1'));
  });
});
