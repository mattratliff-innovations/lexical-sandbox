const selectContentOption = (e, valueToInsert, insertState, buttonState) => {
  document.querySelectorAll('button.selected').forEach((btn) => btn.classList.remove('selected'));
  e.currentTarget.classList.add('selected');

  insertState(valueToInsert);
  buttonState(false);
};

export default selectContentOption;
