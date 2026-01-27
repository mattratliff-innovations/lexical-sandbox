export const filterHeaders = (headers, selectedLetterType, selectedAssociations) =>
  headers?.filter((header) => {
    if (selectedLetterType.length === 0) return false;
    const currentLetterTypeId = selectedLetterType[0]?.id;
    return !selectedAssociations.some((assoc) => assoc.letterType?.id === currentLetterTypeId && assoc.header?.id === header.id);
  });

export const handleRemoveAssociation = (associationToRemove, selectedAssociations, onChange) => {
  const updatedAssociations = selectedAssociations.filter(
    (assoc) => !(assoc.letterType?.id === associationToRemove.letterType?.id && assoc.header?.id === associationToRemove.header?.id)
  );
  onChange(updatedAssociations);
};

export const updatedAssociations = (selectedAssociations, associationToRemove) =>
  selectedAssociations.filter(
    (assoc) => !(assoc.letterType?.id === associationToRemove.letterType?.id && assoc.header?.id === associationToRemove.header?.id)
  );
