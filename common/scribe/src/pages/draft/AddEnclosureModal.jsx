/* eslint-disable require-loading-check-for-axios */
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import { DrButton } from '@druid/druid';
import { toast, Flip } from 'react-toastify';
import styled from '@emotion/styled';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../http/authenticatedAxios';
import './AddEnclosureModal.css';
import { HrNoTopMargin } from '../../components/designedComponents';
import { H1, H3 } from '../../components/typography';
import { HeaderContainer, Body, Footer } from '../util/modalDesignComponents';
import { ScribeModal, XCloseBtn } from '../../components/ScribeComponents';

const EnclosureTitleLine = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: bold;
`;

const StyledHr3 = styled.div`
  border-top: black 3px solid;
  margin-top: 10px;
  margin-bottom: 10px;
`;

const BtnContainer = styled.div`
  display: flex;
  gap: 24px;
`;

export default function AddEnclosureModal({ showModal, setShowModal, setLetter, letter }) {
  const [included, setIncluded] = useState([]);
  const [nonIncluded, setNonIncluded] = useState([]);

  const axios = createAuthenticatedAxios();

  const handleSelect = (enclosure) => {
    const nonIncludedClone = _.cloneDeep(nonIncluded);
    const idx = nonIncludedClone.findIndex((obj) => obj.id === enclosure.id);
    if (idx !== -1) nonIncludedClone.splice(idx, 1);

    setNonIncluded(nonIncludedClone);
    setIncluded([...included, enclosure]);
  };

  const handleUnselect = (enclosure) => {
    const includedClone = _.cloneDeep(included);
    const idx = includedClone.findIndex((obj) => obj.id === enclosure.id);
    if (idx !== -1) includedClone.splice(idx, 1);

    setIncluded(includedClone);
    setNonIncluded([...nonIncluded, enclosure]);
  };

  const onSubmitAddEnclosure = () => {
    const params = {};
    params.enclosure_ids = included.map((obj) => obj.id);

    axios
      .put(`${APP_API_ENDPOINT}/letters/${letter.id}`, {
        letter: params,
      })
      .then((response) => {
        setLetter(response.data);
      });

    setShowModal(false);
  };

  useEffect(() => {
    if (!letter) return;

    axios
      .get(`${APP_API_ENDPOINT}/enclosures_for_letter_type_form_type`, {
        params: {
          enclosure: {
            letter_type_id: letter.letterTypeId,
            form_type_name: letter.registration?.formTypeName,
          },
        },
      })
      .then((response) => {
        const filtered = response.data.filter((item) => !letter.enclosures.map((x) => x.id).includes(item.id));

        setNonIncluded(filtered);
        setIncluded(letter.enclosures);
      })
      .catch(() => {
        toast.error('There was an error retrieving the Enclosures list', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      });
  }, [letter?.letterTypeId, letter?.registration?.formTypeName, letter?.enclosures]);

  return (
    <ScribeModal showModal={showModal} width="md">
      <HeaderContainer data-testid="enclosure-modal">
        <H1 className="noMarginEnclosure">Add Enclosure</H1>
        <XCloseBtn handleClose={() => setShowModal(false)} />
      </HeaderContainer>

      <Body className="mb-4">
        <div className="col-sm-8">
          <HrNoTopMargin />
        </div>

        <div className="row m-0 mt-4 enclosure-modal-body  d-flex flex-column">
          <div className="col-lg-12 ">
            <H3>Included Enclosures:</H3>

            {included?.map((enclosure) => (
              <EnclosureTitleLine key={enclosure.id}>
                <input
                  type="checkbox"
                  readOnly
                  checked
                  id={`included-enclosure-${enclosure.id}`}
                  data-testid={`included-enclosure-${enclosure.id}`}
                  onClick={() => handleUnselect(enclosure)}
                  className="checkbox-150 me-2"
                />

                <label htmlFor={`included-enclosure-${enclosure.id}`}>{enclosure.name}</label>
              </EnclosureTitleLine>
            ))}
            <StyledHr3 />
          </div>

          <div data-testid="available-enclosures-div">
            <H3>Check Enclosures to include in this Letter:</H3>

            {nonIncluded?.length === 0 ? (
              <p>No Associated Enclosures</p>
            ) : (
              nonIncluded.map((enclosure) => (
                <EnclosureTitleLine key={enclosure.id}>
                  <input
                    name="availableEnclosuresInput"
                    type="checkbox"
                    readOnly
                    checked={false}
                    id={`available-enclosure-${enclosure.id}`}
                    data-testid={`available-enclosure-${enclosure.id}`}
                    onClick={() => handleSelect(enclosure)}
                    aria-label={enclosure.name}
                    className="checkbox-150 me-2"
                  />

                  <label htmlFor={`available-enclosure-${enclosure.id}`}>{enclosure.name}</label>
                </EnclosureTitleLine>
              ))
            )}
          </div>
        </div>
      </Body>

      <Footer>
        <BtnContainer>
          <DrButton variant="primary" data-testid="modifyEnclosureModalButton" className="btn-size" onClick={onSubmitAddEnclosure}>
            Add
          </DrButton>

          <DrButton variant="secondary" data-testid="cancelModalButton" onClick={() => setShowModal(false)} className="btn-size">
            Cancel
          </DrButton>
        </BtnContainer>
      </Footer>
    </ScribeModal>
  );
}

AddEnclosureModal.propTypes = {
  letter: PropTypes.shape({
    enclosures: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        active: PropTypes.bool,
        createdAt: PropTypes.string,
        updatedAt: PropTypes.string,
      })
    ),
    id: PropTypes.string,
    letterTypeId: PropTypes.string,
    registration: PropTypes.shape({
      formTypeName: PropTypes.string,
    }),
  }).isRequired,
  setLetter: PropTypes.func.isRequired,
  setShowModal: PropTypes.func.isRequired,
  showModal: PropTypes.bool.isRequired,
};
