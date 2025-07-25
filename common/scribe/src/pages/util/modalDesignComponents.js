import styled from '@emotion/styled';

export const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0px 0px 16px;
`;

export const Header = styled.h1`
  font-family: Merriweather;
  font-weight: 600;
`;

export const Body = styled.div`
  padding: 0px 16px 0px;
  font-family: SourceSans3, sans-serif;
  font-size: 16px;
  line-height: 20px;
`;

export const Footer = styled.div`
  display: flex;
  justify-content: flex-start;
  padding: 24px;
  gap: 24px;
`;

export const HeaderLine = styled.div`
  border-top: #223b72 6px solid;
  margin: 0px 24px;
  width: 50%;
`;

export const Note = styled.div`
  font-style: italic;
`;
