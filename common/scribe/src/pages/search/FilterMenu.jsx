import PropTypes from 'prop-types';
import React, { useState, useRef, useEffect } from 'react';
import { Dropdown } from 'react-bootstrap';
import { H2 } from '../../components/typography';
import IconFilter from '../../assets/icon-filter.svg';
import { CheckBoxContainer, StyledCheckbox, LabelContainer, StyledLabel } from '../../components/designedComponents';
import './FilterMenu.css';

export default function FilterMenu(props) {
  const { currentFilters, handleFilterCheckboxOnClick } = props;

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleBlur = (e) => {
    // Check if the blur event target is within the dropdown
    if (dropdownRef.current && !dropdownRef.current.contains(e.relatedTarget)) {
      setOpen(false);
    }
  };

  const handleToggle = (isOpen) => {
    setOpen(isOpen);
  };

  useEffect(() => {
    if (open && dropdownRef.current) {
      const firstFocusableElement = dropdownRef.current.querySelector('button, a, input, select, textarea');
      if (firstFocusableElement) {
        firstFocusableElement.focus();
      }
    }
  }, [open]);

  return (
    <Dropdown show={open} onToggle={handleToggle}>
      <Dropdown.Toggle variant="custom" id="dropdown-basic">
        <img className="filter-menu-icon" src={IconFilter} alt="Show Filter Menu" title="Show Filter Menu" />
      </Dropdown.Toggle>

      <Dropdown.Menu data-testid="filterMenu" onBlur={handleBlur} ref={dropdownRef}>
        <Dropdown.Header>
          <H2>Display Filters</H2>
        </Dropdown.Header>

        <Dropdown.ItemText>
          <CheckBoxContainer>
            <StyledCheckbox
              id="organizationFilterCheckbox"
              type="checkbox"
              onChange={handleFilterCheckboxOnClick}
              checked={currentFilters.organizationFilterCheckbox}
              data-associated-select-id="organizationId"
            />
            <LabelContainer>
              <StyledLabel htmlFor="organizationFilterCheckbox">Organizations</StyledLabel>
            </LabelContainer>
          </CheckBoxContainer>
        </Dropdown.ItemText>

        <Dropdown.ItemText>
          <CheckBoxContainer>
            <StyledCheckbox
              id="statusFilterCheckbox"
              type="checkbox"
              onChange={handleFilterCheckboxOnClick}
              checked={currentFilters.statusFilterCheckbox}
              data-associated-select-id="statusId"
            />
            <LabelContainer>
              <StyledLabel htmlFor="statusFilterCheckbox">Statuses</StyledLabel>
            </LabelContainer>
          </CheckBoxContainer>
        </Dropdown.ItemText>

        <Dropdown.ItemText>
          <CheckBoxContainer>
            <StyledCheckbox
              id="formTypeFilterCheckbox"
              type="checkbox"
              onChange={handleFilterCheckboxOnClick}
              checked={currentFilters.formTypeFilterCheckbox}
              data-associated-select-id="formTypeCode"
            />
            <LabelContainer>
              <StyledLabel htmlFor="formTypeFilterCheckbox">Form Types</StyledLabel>
            </LabelContainer>
          </CheckBoxContainer>
        </Dropdown.ItemText>

        <Dropdown.ItemText>
          <CheckBoxContainer>
            <StyledCheckbox
              id="alienNumberFilterCheckbox"
              type="checkbox"
              onChange={handleFilterCheckboxOnClick}
              checked={currentFilters.alienNumberFilterCheckbox}
              data-associated-select-id="alienNumber"
            />
            <LabelContainer>
              <StyledLabel htmlFor="alienNumberFilterCheckbox">A-Number</StyledLabel>
            </LabelContainer>
          </CheckBoxContainer>
        </Dropdown.ItemText>

        <Dropdown.ItemText>
          <CheckBoxContainer>
            <StyledCheckbox
              id="letterTypeFilterCheckbox"
              type="checkbox"
              onChange={handleFilterCheckboxOnClick}
              checked={currentFilters.letterTypeFilterCheckbox}
              data-associated-select-id="letterType"
            />
            <LabelContainer>
              <StyledLabel htmlFor="letterTypeFilterCheckbox">Letter Type</StyledLabel>
            </LabelContainer>
          </CheckBoxContainer>
        </Dropdown.ItemText>
      </Dropdown.Menu>
    </Dropdown>
  );
}

FilterMenu.propTypes = {
  currentFilters: PropTypes.shape({
    alienNumberFilterCheckbox: PropTypes.bool.isRequired,
    formTypeFilterCheckbox: PropTypes.bool.isRequired,
    letterTypeFilterCheckbox: PropTypes.bool.isRequired,
    organizationFilterCheckbox: PropTypes.bool.isRequired,
    statusFilterCheckbox: PropTypes.bool.isRequired,
  }).isRequired,
  handleFilterCheckboxOnClick: PropTypes.func.isRequired,
};
