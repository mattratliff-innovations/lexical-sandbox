import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { toast, Flip } from 'react-toastify';
import './CreateLetter.css';
import { Eye, ArrowUpShort, ArrowDownShort } from 'react-bootstrap-icons';
import Button from 'react-bootstrap/Button';
import Lock from '../../assets/lock.svg';
import { StyledHr, StyledHr3 } from '../../components/designedComponents';
import { H2, H3 } from '../../components/typography';

import { StandardParagraphTitleLine, IconContainer } from '../draft/scribeEditor/scribeDocument/lexical/AddContentModalDesignComponents';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../http/authenticatedAxios';
import StandardParagraphModal from './StandardParagraphModal';
import LoadingFallback from '../../utils/LoadingFallback';

export default function StandardParagraphSelector({ letterTypeId = '', formTypeCode, register, setValue, classPreferenceId = '' }) {
  const axios = createAuthenticatedAxios();

  const [availableStdParagraphsForLetterType, setAvailableStdParagraphsForLetterType] = useState([]);
  const [includedStdParagraphs, setIncludedStdParagraphs] = useState([]);
  const [availableStdParagraphsForClassPref, setAvailableStdParagraphsForClassPref] = useState([]);
  const [availableStdParagraphsCombined, setAvailableStdParagraphsCombined] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalParagraph, setModalParagraph] = useState([]);

  const [loading, setLoading] = useState(true);

  const fetchStandardParagraphs = (endpoint, params, setParagraphsState) => {
    axios
      .get(`${APP_API_ENDPOINT}/standard_paragraphs/${endpoint}`, { params })
      .then((response) => {
        const sortedParagraphs = response.data.sort((a, b) => a.name.localeCompare(b.name));
        setParagraphsState(sortedParagraphs);
        setIncludedStdParagraphs([]);
      })
      .catch(() => {
        toast.error('There was an error retrieving the Standard Paragraphs list', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      })
      .finally(() => setLoading(false));
  };

  const handleStandardParagraphLetterType = () => {
    fetchStandardParagraphs(
      'available_standard_paragraphs_form_letter_type',
      { letter_type_id: letterTypeId, form_type_code: formTypeCode },
      setAvailableStdParagraphsForLetterType
    );
  };

  const handleStandardParagraphClassPref = () => {
    fetchStandardParagraphs(
      'available_standard_paragraphs_form_class_preference',
      { class_preference_id: classPreferenceId, form_type_code: formTypeCode },
      setAvailableStdParagraphsForClassPref
    );
  };

  const handleStandardParagraphChange = (option, isChecked) => {
    const updateAndSort = (array, opt, shouldRemove, sort) => {
      const updatedArray = shouldRemove ? array.filter((item) => item.id !== opt.id) : [...array, opt];

      return sort ? updatedArray.sort((a, b) => a.name.localeCompare(b.name)) : updatedArray;
    };

    if (isChecked) {
      setAvailableStdParagraphsCombined((current) => updateAndSort(current, option, true, true));

      setIncludedStdParagraphs((current) => updateAndSort(current, option, false, false));
    } else {
      setAvailableStdParagraphsCombined((current) => updateAndSort(current, option, false, true));

      setIncludedStdParagraphs((current) => updateAndSort(current, option, true, false));
    }
  };

  const moveStandardParagraph = (item, index, direction) => {
    const tempArray = [...includedStdParagraphs];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    tempArray[index] = tempArray[swapIndex];
    tempArray[swapIndex] = item;
    setIncludedStdParagraphs(tempArray);
  };

  useEffect(() => handleStandardParagraphLetterType(), [letterTypeId, formTypeCode]);
  useEffect(() => handleStandardParagraphClassPref(), [classPreferenceId, formTypeCode]);

  useEffect(() => {
    setValue(
      'includedStdParagraphsInput',
      includedStdParagraphs.map((p) => p.id)
    );
  }, [includedStdParagraphs]);

  useEffect(() => {
    // Filters 1st array to include only elements that also exist in 2nd array based on a matching id.
    if (availableStdParagraphsForClassPref.length > 0) {
      const combined = availableStdParagraphsForLetterType.filter((paragraph1) =>
        availableStdParagraphsForClassPref.some((paragraph2) => paragraph2.id === paragraph1.id)
      );
      setAvailableStdParagraphsCombined(combined);
    } else {
      setAvailableStdParagraphsCombined(availableStdParagraphsForLetterType);
    }
  }, [availableStdParagraphsForLetterType, availableStdParagraphsForClassPref]);

  const showEyeContent = (e, paragraph) => {
    if (e.type === 'click' || e.key === 'Enter' || e.key === ' ') {
      setModalParagraph(paragraph);
      setShowModal(true);
    }
  };

  if (loading) return <LoadingFallback blank />;

  return (
    <>
      <StyledHr />

      <H2>Associated Standard Paragraphs</H2>

      <div className="border border-dark p-3">
        {includedStdParagraphs.length > 0 && (
          <div data-testid="included-standard-paragraphs-div">
            <H3>Included Standard Paragraph(s)</H3>

            {includedStdParagraphs.map((paragraph, index) => (
              <StandardParagraphTitleLine key={paragraph.id}>
                <input
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('includedStdParagraphsInput')}
                  type="checkbox"
                  checked
                  value={paragraph.id}
                  id={`included-standard-paragraph-${paragraph.id}`}
                  data-testid={`included-standard-paragraph-${paragraph.id}`}
                  onChange={(e) => handleStandardParagraphChange(paragraph, e.target.checked)}
                  className="checkbox-150 me-2"
                />

                <span className="me-2">
                  <Button
                    data-testid={`included-up-arrow-${paragraph.id}`}
                    id={`included-up-arrow-${paragraph.id}`}
                    className="standard-paragraph-sort-button"
                    title={`move ${paragraph.name} | ${paragraph.code} up`}
                    aria-label={`move ${paragraph.name} | ${paragraph.code} up`}
                    onClick={() => moveStandardParagraph(paragraph, index, 'up')}
                    disabled={index === 0}>
                    <ArrowUpShort className="standard-paragraph-sort-arrow" />
                  </Button>

                  <Button
                    data-testid={`included-down-arrow-${paragraph.id}`}
                    id={`included-down-arrow-${paragraph.id}`}
                    className="standard-paragraph-sort-button"
                    title={`move ${paragraph.name} | ${paragraph.code} down`}
                    aria-label={`move ${paragraph.name} | ${paragraph.code} down`}
                    onClick={() => moveStandardParagraph(paragraph, index, 'down')}
                    disabled={index === includedStdParagraphs.length - 1}>
                    <ArrowDownShort className="standard-paragraph-sort-arrow" />
                  </Button>
                </span>

                <label htmlFor={`included-standard-paragraph-${paragraph.id}`}>{`${paragraph.name} | ${paragraph.code}`}</label>

                <IconContainer>
                  <Eye
                    data-testid={`included-standard-paragraph-eye-icon-${paragraph.id}`}
                    onClick={(e) => showEyeContent(e, paragraph)}
                    onKeyDown={(e) => showEyeContent(e, paragraph)}
                    title={`view ${paragraph.name} | ${paragraph.code} details`}
                    aria-label={`view ${paragraph.name} | ${paragraph.code} details`}
                    role="button"
                    tabIndex={0}
                  />
                </IconContainer>

                {paragraph.locked && (
                  <IconContainer>
                    <img src={Lock} alt="locked" />
                  </IconContainer>
                )}
              </StandardParagraphTitleLine>
            ))}

            <StyledHr3 />
          </div>
        )}

        <div data-testid="available-standard-paragraphs-div">
          <H3>Check Standard Paragraphs to include in this Letter:</H3>

          {availableStdParagraphsCombined.length === 0 && <p>No Associated Standard Paragraphs</p>}

          {availableStdParagraphsCombined.map((paragraph) => (
            <StandardParagraphTitleLine key={paragraph.id}>
              {/* No need to register this non-submitting list with RHF. Doing so produces rare edge-case checkbox issue. */}
              <input
                type="checkbox"
                checked={false}
                value={paragraph.id}
                id={`available-standard-paragraph-${paragraph.id} is locked:`}
                data-testid={`available-standard-paragraph-${paragraph.id}`}
                onChange={(e) => handleStandardParagraphChange(paragraph, e.target.checked)}
                aria-label={`${paragraph.name} | ${paragraph.code} ${paragraph.locked ? 'locked' : ''}`}
                className="checkbox-150 me-2"
              />

              <label htmlFor={`available-standard-paragraph-${paragraph.id}`}>{`${paragraph.name} | ${paragraph.code}`}</label>

              <IconContainer>
                <Eye
                  data-testid={`available-standard-paragraph-eye-icon-${paragraph.id}`}
                  onClick={(e) => showEyeContent(e, paragraph)}
                  onKeyDown={(e) => showEyeContent(e, paragraph)}
                  title={`view ${paragraph.name} | ${paragraph.code} details`}
                  aria-label={`view ${paragraph.name} | ${paragraph.code} details`}
                  role="button"
                  tabIndex={0}
                />
              </IconContainer>

              {paragraph.locked && (
                <IconContainer>
                  <img src={Lock} alt="locked" />
                </IconContainer>
              )}
            </StandardParagraphTitleLine>
          ))}
        </div>
      </div>

      <StandardParagraphModal showModal={showModal} setShowModal={setShowModal} modalParagraph={modalParagraph} />
    </>
  );
}

StandardParagraphSelector.propTypes = {
  letterTypeId: PropTypes.string,
  formTypeCode: PropTypes.string.isRequired,
  register: PropTypes.func.isRequired,
  setValue: PropTypes.func.isRequired,
  classPreferenceId: PropTypes.string,
};
