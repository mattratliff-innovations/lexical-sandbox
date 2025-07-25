import styled from '@emotion/styled';

export const ContentContainer = styled.div`
  border: 2px solid #707070;
  height: 500px;
  margin-top: 20px;
  padding: 4px;
  overflow: auto;
`;

export const SnippetGroupContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  border-bottom: 3px solid silver;
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
  border: solid 2px transparent;
  border-bottom: solid 2px #eeeeee;
  outline: none;
  &:focus {
    border: solid 2px silver;
  }
  &:selected {
    border: solid 2px #00b7dc;
  }
`;

export const StandardParagraphTitleLine = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: bold;
`;

export const StandardParagraphContent = styled.div`
  display: flex;
  padding: 0;
  p {
    margin-bottom: 4px;
  }
`;

export const StandardParagraphContainer = styled.button`
  width: 100%;
  padding: 2px 6px 2px 6px;
  flex-direction: column;
  background-color: white;
  border: solid 2px transparent;
  outline: none;
  &:focus {
    border: solid 2px silver;
  }
  &.selected {
    border: solid 2px #00b7dc;
  }
`;

export const IconContainer = styled.div`
  width: 16px;
`;
