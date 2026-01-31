import styled from '@emotion/styled';

export const StyledTextarea = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: sans-serif;
  font-size: 16px;
  min-height: 100px;
  resize: vertical; /* Allow vertical resizing */

  &:focus {
    outline: none;
    border-color: #007bff; /* Highlight on focus */
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }

  &::placeholder {
    color: #999;
  }
`;

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
