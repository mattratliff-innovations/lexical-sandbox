import React, { useState, useEffect } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { useForm } from 'react-hook-form';
import PropTypes from 'prop-types';
import { XCloseBtn, ScribeModal } from '../../components/ScribeComponents';
import CustomError from '../util/CustomError';
import ContactForm from './ContactForm';
import ConfirmContent from './ContactConfirmation';
import { HeaderContainer, Body } from '../util/modalDesignComponents';
import useModalCheck from '../util/customHooks/useModalCheck';
import { H1 } from '../../components/typography';

export default function ContactModal({ contactToEdit = {}, ...props }) {
  const { showModal, setShowModal, onDelete } = props;

  const [alertMessageType, setAlertMessageType] = useState('info');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [curTitle, setCurTitle] = useState('');
  const [isCreate, setIsCreate] = useState(true);

  const address = contactToEdit?.contactAddressXref?.address;

  const defaultValues = {
    contactType: contactToEdit.type || '',
    letterRecipient: contactToEdit.letterRecipient || false,
    firstName: contactToEdit.firstName || '',
    middleName: contactToEdit.middleName || '',
    lastName: contactToEdit.lastName || '',
    street: address?.street || '',
    aptSuiteFloor: address?.aptSuiteFloor || '',
    foreignAddress: address?.foreignAddress || false,
    city: address?.city || '',
    state: address?.state?.code || '',
    zipCode: address?.zipCode || '',
    province: address?.province || '',
    postalCode: address?.postalCode || '',
    country: address?.country || '',
    primaryApplicant: contactToEdit.primaryApplicant || false,
    inCareOf: contactToEdit.inCareOf || '',
    firmName: contactToEdit.firmName || '',
    aNumber: contactToEdit.aNumber || '',
    ssn: contactToEdit.ssn || '',
    dateOfBirth: contactToEdit.dateOfBirth || '',
    sexId: contactToEdit.sexId || '',
    email: contactToEdit.email || '',
  };

  const formCheck = useForm({ mode: 'onSubmit', defaultValues });
  const changesEqual = formCheck.formState.isDirty;
  const { isBlocked, setIsBlocked, blocker } = useModalCheck(showModal && changesEqual);

  const resetModal = () => {
    formCheck.clearErrors();
    setAlertMessageType('info');
  };

  const handleCloseCheck = () => {
    if (confirmDelete) return setConfirmDelete(false);
    if (changesEqual && !isBlocked) return setIsBlocked(true);
    if (isBlocked) {
      if (blocker.reset) blocker.reset();
      return setIsBlocked(false);
    }
    resetModal();
    return setShowModal(false);
  };

  const handleProceed = () => {
    setShowModal(false);
    if (isBlocked) {
      setIsBlocked(false);
      if (blocker.proceed) blocker.proceed();
      resetModal();
    }
  };

  const handleDelete = () => {
    onDelete(contactToEdit.id);
    setConfirmDelete(false);
    resetModal();
  };

  useEffect(() => {
    const tempCreate = Object.keys(contactToEdit).length <= 1;
    let tempTitle = tempCreate ? 'Add Contact' : 'Edit Contact';

    if (confirmDelete) tempTitle = 'Delete Confirmation';
    if (isBlocked) tempTitle = 'Warning!';
    setIsCreate(tempCreate);
    setCurTitle(tempTitle);
    formCheck.reset(defaultValues);
  }, [contactToEdit, confirmDelete, isBlocked]);

  return (
    <ScribeModal dataTestId="contactModal" showModal={showModal}>
      <HeaderContainer>
        <H1 className="noMarginHeader" data-testid="contactModalHeader">
          {curTitle}
        </H1>

        <XCloseBtn handleClose={handleCloseCheck} />
      </HeaderContainer>

      <CustomError errorType={alertMessageType} />

      {curTitle.includes('Contact') && (
        <Body data-testid="contactModalBody">
          <ContactForm
            isCreate={isCreate}
            setConfirmDelete={setConfirmDelete}
            formCheck={formCheck}
            contactToEdit={contactToEdit}
            handleCloseCheck={handleCloseCheck}
            setAlertMessageType={setAlertMessageType}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
          />
        </Body>
      )}

      {!curTitle.includes('Contact') && (
        <ConfirmContent
          curTitle={curTitle}
          contactToEdit={contactToEdit}
          handleNegative={handleCloseCheck}
          handleConfirm={confirmDelete ? handleDelete : handleProceed}
          isBlocked={isBlocked}
        />
      )}
    </ScribeModal>
  );
}

ContactModal.propTypes = {
  showModal: PropTypes.bool.isRequired,
  setShowModal: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  contactToEdit: PropTypes.shape({
    id: PropTypes.string,
    type: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
  }),
};
