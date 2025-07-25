import { createContext, useContext } from 'react';

const DataContext = createContext();

const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    return { draftState: null, setDraftState: () => {} };
  }
  return context;
};

export { DataContext, useDataContext };
