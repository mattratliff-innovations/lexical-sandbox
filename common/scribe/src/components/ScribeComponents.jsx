import React from 'react';
import { DrIcon } from '@druid/druid';
import styled from '@emotion/styled';
import { Dialog } from '@mui/material';
import PropTypes from 'prop-types';

const XBtn = styled.button`
  border: none;
  background: none;
  margin: 0px 4px 4px 0px;
`;

const StyledDialog = styled(Dialog)`
  backdrop-filter: ${(props) => props.type === 'logout' && 'blur(6px)'};
`;

const Btn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 134px;
  min-height: 48px;
  padding: 12px 0px;
  font-size: 18px;
  border: 2px solid #336cbc;
  color: #ffffff;
  background-color: #336cbc;
  border-radius: 6px;
  font-weight: bold;
  &:focus-visible {
    outline-offset: 6px;
  }
  ${(props) =>
    props.variant === 'secondary' &&
    `
    color: #336CBC;
    background-color: #ffffff;
  `}
`;

export function ScribeModal({ type = '', dataTestId = '', showModal, children, width = 'lg' }) {
  return (
    <StyledDialog
      data-testid={dataTestId}
      open={showModal}
      type={type}
      slotProps={{ paper: { sx: { borderRadius: '20px', width: '1140px', position: 'absolute', top: '0%' } } }}
      maxWidth={width}>
      {children}
    </StyledDialog>
  );
}

export function ScribeBtn({ id = '', onClick, children, type = 'button', dataTestId = '', variant = 'primary' }) {
  return (
    // eslint-disable-next-line react/button-has-type
    <Btn id={id} onClick={onClick} data-testid={dataTestId} type={type} variant={variant}>
      {children}
    </Btn>
  );
}

export function XCloseBtn({ handleClose }) {
  return (
    <XBtn data-testid="closeButtonModal" onClick={handleClose} ariaLabel="Close">
      <DrIcon iconName="xmark" height="40px" width="40px" color="#707070" />
    </XBtn>
  );
}

XCloseBtn.propTypes = {
  handleClose: PropTypes.func.isRequired,
};

ScribeModal.propTypes = {
  dataTestId: PropTypes.string,
  showModal: PropTypes.bool.isRequired,
  children: PropTypes.shape({}).isRequired,
  width: PropTypes.string,
  type: PropTypes.string,
};

ScribeBtn.propTypes = {
  id: PropTypes.string,
  dataTestId: PropTypes.string,
  children: PropTypes.shape({}).isRequired,
  type: PropTypes.string,
  variant: PropTypes.string,
  onClick: PropTypes.func.isRequired,
};
