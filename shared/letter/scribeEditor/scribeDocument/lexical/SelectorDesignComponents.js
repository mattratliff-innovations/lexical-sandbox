import styled from '@emotion/styled';

export const SnippetGroupContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  border-bottom: 1px solid #eeeeee;
  padding: 4px 0px;
`;

export const Name = styled.span`
  font-weight: 600;
`;

export const SnippetTitleLine = styled.div`
  display: flex;
`;

export const SnippetContainer = styled.button`
  width: 100%;
  padding: 4px 0px 4px 38px;
  flex-direction: column;
  background-color: white;
  border: none;
  border-bottom: 1px solid #eeeeee;
  outline: none;
  &:focus {
    border: solid 4px #00b7dc;
  }
  &:target {
    border: solid 4px #00b7dc;
  }
`;
