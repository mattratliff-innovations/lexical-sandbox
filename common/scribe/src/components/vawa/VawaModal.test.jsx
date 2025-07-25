import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import VawaModal from './VawaModal';

// Mock the useNavigate hook from react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('VawaModal Component', () => {
  const setShowModal = jest.fn();
  const navigate = jest.fn();

  beforeEach(() => {
    useNavigate.mockReturnValue(navigate);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders VawaModal when showModal is true', () => {
    render(
      <BrowserRouter>
        <VawaModal showModal setShowModal={setShowModal} />
      </BrowserRouter>
    );

    expect(screen.getByTestId('VawaModal')).toBeInTheDocument();
    expect(screen.getByText('Acknowledgement Required!')).toBeInTheDocument();
    expect(screen.getByText('8 USC 1367 Protected Information - Disclosure and Use Restrictions Apply.')).toBeInTheDocument();
    expect(screen.getByText('The information on this case is sensitive and can only be accessed by authorized individuals.')).toBeInTheDocument();
  });

  test('does not render VawaModal when showModal is false', () => {
    render(
      <BrowserRouter>
        <VawaModal showModal={false} setShowModal={setShowModal} />
      </BrowserRouter>
    );

    expect(screen.queryByTestId('VawaModal')).not.toBeInTheDocument();
  });

  test('calls handleAcknowledgementOrClose on Acknowledge button click', () => {
    render(
      <BrowserRouter>
        <VawaModal showModal setShowModal={setShowModal} redirectTarget="target" />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByTestId('positiveBtn'));

    expect(setShowModal).toHaveBeenCalledWith(false);
    expect(navigate).toHaveBeenCalledWith('/target');
  });

  test('calls handleCancel on Cancel button click', () => {
    render(
      <BrowserRouter>
        <VawaModal showModal setShowModal={setShowModal} />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByTestId('negativeBtn'));

    expect(setShowModal).toHaveBeenCalledWith(false);
    expect(navigate).toHaveBeenCalledWith('/');
  });

  test('calls handleAcknowledgementOrClose on XCloseBtn click', () => {
    render(
      <BrowserRouter>
        <VawaModal showModal setShowModal={setShowModal} redirectTarget="target" />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByTestId('closeButtonModal'));

    expect(setShowModal).toHaveBeenCalledWith(false);
    expect(navigate).toHaveBeenCalledWith('/target');
  });
});
