import React, { useEffect, useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { DrButton, DrCard } from '@druid/druid';
import _ from 'lodash';
import styled from '@emotion/styled';
import { AppContext } from '../../AppProvider';
import ReceiptSearchBar from '../../components/receiptSearch';
import { H2 } from '../../components/typography';
import { StyledHr, BtnContainer } from '../../components/designedComponents';

const CardsContainer = styled.div`
  display: flex;
  width: 100%;
  gap: 24px;
`;

const CardLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.span`
  font-weight: 700;
  font-size: 18px;
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.3;
`;

const Content1 = styled.span`
  font-weight: 700;
  font-size: 16px;
`;

const Content2 = styled.span``;

function CardContent({ title = '', content1 = '', content2 = '' }) {
  return (
    <CardLayout>
      <Title>{title}</Title>

      <ContentContainer>
        <Content1>{content1}</Content1>
        <Content2>{content2}</Content2>
      </ContentContainer>
    </CardLayout>
  );
}

CardContent.propTypes = {
  title: PropTypes.string,
  content1: PropTypes.string,
  content2: PropTypes.string,
};

export default function CorHistory() {
  const { draft } = useContext(AppContext);
  const [primeApplicant, setPrimeApplicant] = useState(null);
  const [rep, setRep] = useState(null);
  const [petitioner, setPetitioner] = useState(null);

  const redirect = useNavigate();
  const stageForCreateLetter = (obj) => redirect('/createletter', { state: { createLetterObj: obj } });
  const goHome = () => redirect('/searchReceipt');

  useEffect(() => {
    setPetitioner(draft?.petitionerType);
    setRep(draft?.representativeType);
    if (!_.isEmpty(draft?.registration)) setPrimeApplicant(draft?.applicantTypes[0]);
  }, [draft]);

  return (
    <div className="page_min_height">
      <ReceiptSearchBar />

      <div className="row">
        <div className="col-lg-2" />
        <div className="col-lg-8">
          <H2>{_.isEmpty(draft?.registration) ? 'No Results Found ' : `Results Found | ${draft?.registration?.receiptNumber}`}</H2>

          {!_.isEmpty(draft?.registration) && (
            <>
              <CardsContainer className="mb-3">
                <DrCard className="receipt-card">
                  <CardContent
                    title="Form Information"
                    content1={`Form Type ${draft?.registration?.formTypeName}`}
                    content2={draft?.classPreference}
                  />
                </DrCard>

                <DrCard className="receipt-card">
                  <CardContent
                    title="Primary Applicant/Beneficiary"
                    content1={`${primeApplicant?.firstName} ${primeApplicant?.middleName} ${primeApplicant?.lastName}`}
                    content2={primeApplicant?.aNumber}
                  />
                </DrCard>

                {rep && (
                  <DrCard className="receipt-card">
                    <CardContent title="Representative" content1={`${rep?.firstName} ${rep?.middleName} ${rep?.lastName}`} content2={rep?.firmName} />
                  </DrCard>
                )}

                {petitioner && (
                  <DrCard className="receipt-card">
                    <CardContent
                      title="Petitioner"
                      content1={`${petitioner?.firstName} ${petitioner?.middleName} ${petitioner?.lastName}`}
                      content2={petitioner?.firmName}
                    />
                  </DrCard>
                )}
              </CardsContainer>

              <BtnContainer>
                <DrButton data-testid="createNewLetter" variant="primary" className="btn-size" onClick={() => stageForCreateLetter(draft)}>
                  Create Letter
                </DrButton>

                <DrButton data-testid="goHome" variant="secondary" className="btn-size" onClick={goHome}>
                  Go Home
                </DrButton>
              </BtnContainer>

              <StyledHr />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
