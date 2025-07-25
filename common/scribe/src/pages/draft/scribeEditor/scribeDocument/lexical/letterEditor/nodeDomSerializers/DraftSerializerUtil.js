const primaryApplicant = (draft) => {
  const primaryApplicants = draft.applicantTypes?.filter((contact) => contact.primaryApplicant);
  return primaryApplicants?.length > 0 ? primaryApplicants[0] : null;
};

export default primaryApplicant;
