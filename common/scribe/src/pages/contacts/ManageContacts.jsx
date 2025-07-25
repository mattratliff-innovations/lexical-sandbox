import React, { useEffect, useState } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { toast, Flip } from 'react-toastify';
import Button from 'react-bootstrap/Button';
import { PersonPlusFill, ArrowLeftSquareFill, PencilSquare } from 'react-bootstrap-icons';
import { useParams, useNavigate } from 'react-router-dom';
import { DrCard, DrAlert, DrIcon, DrButton } from '@druid/druid';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../http/authenticatedAxios';
import RepresentativeContact from './RepresentativeContact';
import ApplicantContact from './ApplicantContact';
import PetitionerContact from './PetitionerContact';
import ContactModal from './ContactModal';
import ActionButton from '../../components/actionButton/ActionButton';
import { useAdminFormContext, AdminFormProvider } from '../../contexts/AdminFormContext';
import * as Util from './ContactUtils';
import '../draft/Letter.css';
import DefaultModal from '../util/DefaultModal';
import chunkArray from '../util/util';
import { StyledHr, StyledLabel } from '../../components/designedComponents';
import { H1, H2 } from '../../components/typography';
import LoadingFallback from '../../utils/LoadingFallback';

function ManageContactsContent() {
  const CHUNK_LENGTH = 2;

  const { id: draftId } = useParams();
  const axios = createAuthenticatedAxios();
  const { setAdminErrorMessage } = useAdminFormContext();

  const [contactList, setContactList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [contactToEdit, setContactToEdit] = useState({});
  const [contactUpdated, setContactUpdated] = useState(false);
  const [showDefaultModal, setShowDefaultModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const isCreate = Object.keys(contactToEdit).length <= 1;
  const navigate = useNavigate();

  const openContactModal = (contact) => {
    setShowModal(true);
    setContactToEdit(contact);
  };

  const makePrimaryContact = (contact) => {
    setContactToEdit(contact);
    setShowDefaultModal(true);
  };

  useEffect(() => {
    setContactUpdated(false);

    axios
      .get(`${APP_API_ENDPOINT}/contacts/contacts_for_letter`, {
        params: { contact: { letter_id: draftId } },
      })
      .then((response) => setContactList(response.data))
      .catch(() => {
        toast.error('There was an error retrieving the contacts.', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      })
      .finally(() => setLoading(false));
  }, [contactUpdated]);

  const onSubmit = async (data) => {
    const endPoint = isCreate ? `${APP_API_ENDPOINT}/contacts` : `${APP_API_ENDPOINT}/contacts/${contactToEdit.id}`;
    const axiosAction = isCreate ? axios.post : axios.put;
    const action = isCreate ? 'created' : 'edited';

    const contact = {
      contact: {
        id: contactToEdit?.id,
        letter_id: draftId,
        type: data.contactType,
        first_name: data.firstName,
        middle_name: data.middleName,
        last_name: data.lastName,
        firm_name: data.firmName,
        in_care_of: data.inCareOf,
        email: data.email,
        a_number: data.aNumber,
        sex_id: data.sexId,
        ssn: data.ssn,
        dateOfBirth: data.dateOfBirth,
        letter_recipient: data.letterRecipient,
        primary_applicant: contactToEdit?.primaryApplicant,
        contact_address_xref_attributes: {
          id: contactToEdit?.contactAddressXref?.id,
          address_attributes: {
            id: contactToEdit?.contactAddressXref?.address.id,
            foreign_address: data.foreignAddress,
            street: data.street,
            apt_suite_floor: data.aptSuiteFloor,
            city: data.city,
            state_id: data.stateId,
            zip_code: data.zipCode,
            province: data.province,
            postal_code: data.postalCode,
            country: data.country,
            type: Util.CONTACT_ADDRESS_TYPE,
          },
        },
      },
    };

    try {
      await axiosAction(endPoint, contact);
      toast.success(`The contact was ${action} successfully!`, {
        position: 'top-center',
        autoClose: 1000,
        transition: Flip,
        theme: 'dark',
        toastId: 'toastContact',
      });
      setShowModal(false);
      setContactUpdated(true);
    } catch (e) {
      setAdminErrorMessage(e?.response?.data?.error);
    }
  };

  const onDelete = (contactToDeleteId) => {
    const contact = { contact: { id: contactToDeleteId } };

    axios
      .delete(`${APP_API_ENDPOINT}/contacts/${contactToDeleteId}`, contact)
      .then(() => {
        toast.success('The contact was deleted successfully!', {
          position: 'top-center',
          autoClose: 1000,
          transition: Flip,
          theme: 'dark',
          toastId: 'toastContact',
        });

        setShowModal(false);
        setContactUpdated(true);
      })
      .catch((e) => setAdminErrorMessage(e?.response?.data?.error));
  };

  const onSubmitPrimaryApplicant = () => {
    const contact = {
      contact: {
        id: contactToEdit?.id,
        letter_id: draftId,
        type: contactToEdit.type,
        primary_applicant: true,
      },
    };

    axios
      .put(`${APP_API_ENDPOINT}/contacts/${contactToEdit.id}`, contact)
      .then(() => {
        setShowDefaultModal(false);
        setContactToEdit({});
        setContactUpdated(true);
      })
      .catch((e) => setAdminErrorMessage(e?.response?.data?.error));
  };

  // All Letter Recipients includes (Representatives, Petitioners, Primary Applicants, and Applicants)
  const sortedLetterRecipients = Util.sortContacts(contactList?.filter((contact) => contact.letterRecipient));

  //  Non letter recipients - Only Reps, Petitioners & Primary Applicants
  const sortedMainContacts = Util.sortContacts(contactList?.filter((contact) => !contact.letterRecipient && Util.isMainContact(contact)));

  // Non letter recipeints Applicants - not primary (are formatted different)
  const sortedApplicantContacts = Util.sortContacts(contactList?.filter((contact) => !contact.letterRecipient && !Util.isMainContact(contact)));

  // Change the bg color of a card if it has errors
  const errorBgColor = (contact) => (contact?.errors?.print ? { backgroundColor: '#f4ded7', borderRadius: '1rem' } : {});
  const errorMessages = () =>
    sortedLetterRecipients
      .filter((recipient) => recipient?.errors?.print)
      .map((recip) => (
        <>
          <strong>
            &quot;
            {recip.type}
            &quot;
          </strong>{' '}
          <strong>
            &quot;
            {recip.firstName} {recip.lastName}
            &quot;
          </strong>
          {' - '}
          <strong>{recip.errors.print}</strong>
          <br />
        </>
      ));

  if (loading) return <LoadingFallback />;

  return (
    <>
      <div className="row">
        <div className="col-2" />
        <div className="col-10">
          <div className="row mt-3">
            <div className="col-5">
              <H1>Contacts</H1>
              <StyledHr />
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-sm-2 d-flex flex-column">
          <div className="sidebar">
            <div className="side-menu p-2">
              <H2>Quick Actions</H2>

              <div className="mb-3 mt-3">
                <ActionButton
                  id="addContactButton"
                  data-testid="addContactButton"
                  aria-label="Add Contact"
                  onClick={() => openContactModal({})}
                  icon={PersonPlusFill}
                  text="Add Contact"
                />
              </div>

              <div className="mb-3">
                <ActionButton
                  id="backButton"
                  aria-label="Back To Letter Editor"
                  data-testid="backButton"
                  onClick={() => navigate(-1)}
                  icon={ArrowLeftSquareFill}
                  text="Back To Letter Editor"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-10">
          <div className="row">
            <div className="col-lg-10">
              {errorMessages().length > 0 && (
                <div className="mb-3" data-testid="druid-alert-container">
                  <DrAlert type="error" closeBtn alert="Required Fields are Missing">
                    <span>{errorMessages()}</span>
                  </DrAlert>
                </div>
              )}
              <H2>Letter Recipients</H2>
            </div>
          </div>

          {sortedLetterRecipients.length > 0 ? (
            chunkArray(sortedLetterRecipients, CHUNK_LENGTH).map((chunk) => (
              <div className="row mb-4" key={chunk.id}>
                <div className="col-lg-10">
                  <div className="row">
                    {chunk.map((item) => (
                      <div className="col-6" key={item.id}>
                        <div style={errorBgColor(item)}>
                          <DrCard orientation="horizontal" className="contact-card" data-testid={`drCard-${item.id}`}>
                            <Button
                              className="px-0 text-start button-focus"
                              data-testid={`edit-${item.id}`}
                              variant="custom"
                              id={`edit-${item.id}`}
                              onClick={() => openContactModal(item)}>
                              <span>
                                <b className="fs-5">
                                  <PencilSquare /> {Util.formatContactType(item)}
                                </b>
                              </span>
                            </Button>

                            {Util.isRepresentative(item.type) && <RepresentativeContact contact={item} />}

                            {Util.isPetitioner(item.type) && <PetitionerContact contact={item} />}

                            {Util.isApplicant(item.type) && <ApplicantContact contact={item} makePrimaryContact={makePrimaryContact} />}
                          </DrCard>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div> No Letter Recipients found. </div>
          )}

          <div className="row">
            <div className="col-5">
              <div className="d-flex align-items-center mb-3">
                <DrButton
                  styles={{
                    button: { borderColor: 'black', marginRight: '8px' },
                  }}
                  data-testid="addLetterRecip"
                  variant="secondary"
                  size="small"
                  ariaLabel="Add Contact"
                  onClick={() => openContactModal({ letterRecipient: true })}>
                  <DrIcon iconName="plus" color="black" />
                </DrButton>
                <StyledLabel>Add Contact</StyledLabel>
              </div>

              <StyledHr />
            </div>
          </div>

          <div className="row">
            <div className="col-5">
              <H2>Other Contacts</H2>
            </div>
          </div>

          {sortedMainContacts.length > 0 || sortedApplicantContacts.length > 0 ? (
            <>
              {chunkArray(sortedMainContacts, CHUNK_LENGTH).map((chunk) => (
                <div className="row mb-4" key={chunk.id}>
                  <div className="col-lg-10">
                    <div className="row">
                      {chunk.map((item) => (
                        <div className="col-lg-6" key={item.id}>
                          <DrCard orientation="horizontal" minHeight="240px" className="contact-card">
                            <Button
                              className="px-0 text-start button-focus"
                              data-testid={`edit-${item.id}`}
                              variant="custom"
                              id={`edit-${item.id}`}
                              onClick={() => openContactModal(item)}>
                              <b className="fs-5">
                                <PencilSquare /> {Util.formatContactType(item)}
                              </b>
                            </Button>
                            {Util.isRepresentative(item.type) && <RepresentativeContact contact={item} />}
                            {Util.isPetitioner(item.type) && <PetitionerContact contact={item} />}
                            {Util.isPrimaryApplicant(item) && <ApplicantContact contact={item} makePrimaryContact={makePrimaryContact} />}
                          </DrCard>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {chunkArray(sortedApplicantContacts, CHUNK_LENGTH).map((chunk, chunkIndex) => (
                <div className="row mb-4" key={chunk.id}>
                  <div className="col-lg-10">
                    <div className="row">
                      {chunk.map((item, itemIndex) => (
                        <div className="col-lg-6" key={item.id}>
                          <DrCard orientation="horizontal" minHeight="240px" className="contact-card">
                            <Button
                              className="px-0 text-start"
                              data-testid={`edit-${item.id}`}
                              variant="custom"
                              id={`edit-${item.id}`}
                              onClick={() => openContactModal(item)}>
                              <b className="fs-5">
                                <PencilSquare /> {`${Util.formatContactType(item)} #${chunkIndex * CHUNK_LENGTH + (itemIndex + 1)}`}
                              </b>
                            </Button>

                            <ApplicantContact contact={item} makePrimaryContact={makePrimaryContact} />
                          </DrCard>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="mb-3">No Other Contacts Found</div>
          )}

          <div className="d-flex align-items-center mb-3">
            <DrButton
              styles={{ button: { borderColor: 'black', marginRight: '8px' } }}
              data-testid="addOther"
              variant="secondary"
              size="small"
              ariaLabel="Add Contact"
              onClick={() => openContactModal({})}>
              <DrIcon iconName="plus" color="black" />
            </DrButton>
            <StyledLabel>Add Contact</StyledLabel>
          </div>
        </div>
      </div>

      <ContactModal
        showModal={showModal}
        setShowModal={setShowModal}
        draftId={draftId}
        contactToEdit={contactToEdit}
        onSubmit={onSubmit}
        onDelete={onDelete}
      />

      <DefaultModal
        showModal={showDefaultModal}
        setShowModal={setShowDefaultModal}
        onSubmit={onSubmitPrimaryApplicant}
        defaultMessage={Util.formatPrimaryMessage(contactToEdit)}
      />
    </>
  );
}

export default function CreateManualLetter() {
  return (
    <AdminFormProvider>
      <ManageContactsContent />
    </AdminFormProvider>
  );
}
