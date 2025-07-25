import React, { useState, useContext } from 'react';
import styled from '@emotion/styled';
import { useForm } from 'react-hook-form';
import PropTypes from 'prop-types';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { DrButton, DrIcon } from '@druid/druid';
import { AppContext } from '../../AppProvider';
import VawaModal from '../vawa/VawaModal';
import { StyledHr } from '../designedComponents';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../http/authenticatedAxios';
import { BodySmall } from '../typography';

const instructions = 'A receipt number starts with three letters (Ex. LIN, NBC, MSC, etc.) followed by 10 digits (Ex. LIN1234567890)';

const BlueBanner = styled.div`
  color: #ffffff;
  background-image: linear-gradient(#336cbc, #223b72);
  padding-top: 16px;
`;

const StyledColumn = styled.div`
  line-height: 1;
`;

const SearchLabel = styled.label`
  font-weight: 600;
`;

const StyledBodySmall = styled(BodySmall)`
  margin-bottom: 4px;
`;

const InputContainer = styled.div`
  display: flex;
  background-color: #ffffff;
  min-width: 292px;
  width: fit-content;
  padding: 4px 0px;
`;

const StyledInput = styled.input`
  border-radius: 0px;
  border: none;
  padding: 0px 0.75rem;
`;

const BtnWrapper = styled.div`
  border-left: 1px solid #eeeeee;
`;

const LinkContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const btnStyles = {
  borderRadius: '0px',
  border: 'none',
  backgroundColor: '#ffffff',
  color: '#707070',
  height: '100%',
  padding: '0px .75rem',
};

export default function ReceiptSearchBar() {
  const [noData, setNoData] = useState(false);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [showVawaModal, setShowVawaModal] = useState(false);
  const location = useLocation();
  const { setDraft } = useContext(AppContext);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onSubmit' });

  const redirect = useNavigate();

  const onSubmit = (data) => {
    const axios = createAuthenticatedAxios();
    setIsApiLoading(true);
    axios
      .get(`${APP_API_ENDPOINT}/search`, {
        params: { receiptNumber: data.receiptNumber.toUpperCase() },
      })
      .then((response) => {
        const cur = response?.data;
        setIsApiLoading(false);
        setDraft(cur);

        if (cur.vawa) return setShowVawaModal(true);

        if (!cur?.registration?.receiptNumber) setNoData(true);
        if (cur?.registration?.receiptNumber && location.pathname !== '/correspondenceHistory') redirect('/correspondenceHistory');

        return null;
      })
      .catch(() => {
        setNoData(true);
        setIsApiLoading(false);
      });
  };

  const handleClick = () => {
    setNoData(false);
    handleSubmit(onSubmit)();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      setNoData(false);
      handleSubmit(onSubmit)();
    }
  };

  return (
    <>
      <form>
        <BlueBanner className="row mb-4">
          <div className="col-sm-2" />
          <div className="col-sm-8">
            <div className="row mb-3">
              <StyledColumn className="col-sm-12">
                <SearchLabel htmlFor="searchBox" data-testid="header">
                  Create Letter by Receipt Number
                </SearchLabel>
                <StyledBodySmall id="searchInstructions">{instructions}</StyledBodySmall>

                <InputContainer>
                  {/* eslint-disable react/jsx-props-no-spreading */}
                  <StyledInput
                    id="searchBox"
                    {...register('receiptNumber', {
                      required: {
                        value: true,
                        message: 'Please provide a receipt number.',
                      },
                      minLength: {
                        value: 13,
                        message: 'Receipt must be 13 characters long.',
                      },
                      maxLength: {
                        value: 13,
                        message: 'Receipt must be 13 characters long.',
                      },
                      pattern: {
                        value: /^[A-Za-z]{3}\d{10}/,
                        message: 'Incorrect receipt format. Please follow receipt pattern instructions.',
                      },
                    })}
                    className="form-control text-upcase"
                    maxLength="13"
                    placeholder="ex: IOE1234567890"
                    aria-describedby="searchInstructions"
                    onKeyDown={handleKeyDown}
                  />

                  <BtnWrapper>
                    <DrButton
                      data-testid="searchSubmit"
                      id="search-submit-button"
                      styles={{ button: btnStyles }}
                      onClick={handleClick}
                      isDisabled={isSubmitting}
                      aria-label="Search By Receipt Number">
                      <DrIcon iconName="magnifying-glass" />
                    </DrButton>
                  </BtnWrapper>
                </InputContainer>
              </StyledColumn>
            </div>
          </div>
        </BlueBanner>
      </form>

      {isApiLoading && (
        <div className="d-flex flex-column">
          <div className="d-flex flex-grow-1 justify-content-center align-items-center">
            <div className="spinner-border text-primary" />
          </div>
        </div>
      )}

      {(errors?.receiptNumber?.message || noData) && (
        <div className="row">
          <div className="col-lg-2" />
          <div className="col-lg-8" role="alert">
            {errors?.receiptNumber?.message}

            {noData && (
              <LinkContainer>
                Receipt Number not found.
                <Link
                  to="/createmanualletter"
                  state={{
                    createLetterObj: {
                      registration: {
                        receiptNumber: getValues('receiptNumber'),
                      },
                    },
                  }}>
                  Create Letter Manually
                </Link>
              </LinkContainer>
            )}

            <StyledHr />
          </div>
        </div>
      )}

      <VawaModal showModal={showVawaModal} setShowModal={setShowVawaModal} redirectTarget="correspondenceHistory" />
    </>
  );
}

ReceiptSearchBar.propTypes = { setFormErrors: PropTypes.func };
