import styled from '@emotion/styled';

export const StyledHeader = styled.h1`
  font-family: Merriweather;
  font-weight: 600;
  font-size: 32px;
`;

export const SecondaryHeader = styled.h4`
  font-family: Merriweather;
  font-weight: 600;
`;

export const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
`;

export const StyledSelect = styled.select`
  border: ${(props) => (props.disabled ? '#EEEEEE 2px solid' : '#707070 2px solid')};
  color: ${(props) => (props.disabled ? '#EEEEEE' : '#000000')};
  height: 32px;
  width: 100%;
  ${(props) => `text-transform: ${props.textType}`};
`;

export const StyledOption = styled.option`
  border: #707070 2px solid;
  height: 32px;
  width: 100%;
  ${(props) => `text-transform: ${props.textType}`};
`;

export const StyledInput = styled.input`
  border: ${(props) => (props.disabled ? '#EEEEEE 2px solid' : '#707070 2px solid')};
  background-color: #ffffff;
  height: 32px;
`;

export const StyledInputUpperCase = styled.input`
  border: #707070 2px solid;
  height: 32px;
  text-transform: uppercase;
  width: 100%;
`;

export const StyledComment = styled(StyledInput)`
  height: 96px;
`;

export const StyledCheckbox = styled.input`
  height: 20px;
  width: 20px;
  accent-color: #336cbc;
`;

export const CheckBoxColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const CheckBoxContainer = styled.div`
  display: flex;
  gap: 10px;
`;

export const LabelContainer = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 16px;
  gap: 4px;
`;

export const CardData = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 17px;
`;

export const StyledLabel = styled.label`
  font-family: SourceSans3;
  font-size: 16px;
  color: ${(props) => (props.disabled ? '#EEEEEE' : '#000000')};
`;

export const StyledLabel2 = styled.label`
  font-size: 26px;
  font-family: Merriweather;
  font-weight: bold;
  color: ${(props) => (props.disabled ? '#EEEEEE' : '#000000')};
`;

export const StyledNote = styled(StyledLabel)`
  display: flex;
  flex-direction: column;
  font-size: 14px;
  color: #707070;
`;

export const BtnContainer = styled.div`
  display: flex;
  gap: 24px;
`;

export const StyledHr = styled.div`
  border-top: #223b72 6px solid;
  margin-top: 20px;
  margin-bottom: 15px;
`;

export const HrNoTopMargin = styled.div`
  border-top: #223b72 6px solid;
  margin-bottom: 15px;
`;

export const StyledHr3 = styled.div`
  border-top: black 3px solid;
  margin-top: 10px;
  margin-bottom: 10px;
`;
