/* eslint-disable require-loading-check-for-axios */
import { useEffect } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { useParams } from 'react-router-dom';
import { toast, Flip } from 'react-toastify';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import { useAdminFormContext } from '../../../contexts/AdminFormContext';

const useGetSetData = (type) => {
  const { setAdminFormData, setAdminFormSettings } = useAdminFormContext();
  const axios = createAuthenticatedAxios();
  const { id } = useParams();
  const participle = type === 'Create' ? 'created' : 'edited';

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/form_types`, {})
      .then((formsRes) => {
        const formOptions = formsRes.data.map((form) => ({
          name: form.name,
          label: form.name,
          id: form.id,
        }));
        if (type === 'Edit') {
          axios
            .get(`${APP_API_ENDPOINT}/standard_paragraphs/${id}`)
            .then((paraData) => {
              const selectedFormsClassPreferences = paraData.data?.standardParagraphFormClassPreferenceXrefs?.map((xref) => ({
                id: xref.id,
                form: {
                  name: xref.formType.name,
                  label: xref.formType.name,
                  id: xref.formType.id,
                },
                classPreference: {
                  name: xref.classPreference.name,
                  label: xref.classPreference.name,
                  id: xref.classPreference.id,
                },
              }));

              const selectedFormsLetters = paraData.data?.standardParagraphFormLetterXrefs?.map((xref) => ({
                id: xref.id,
                form: {
                  name: xref.formType.name,
                  label: xref.formType.name,
                  id: xref.formType.id,
                },
                letter: {
                  name: xref.letterType.name,
                  label: xref.letterType.name,
                  id: xref.letterType.id,
                },
              }));

              const newObj = {
                ...paraData.data,
                formsAndLetters: {
                  formOptions,
                  selected: selectedFormsLetters,
                },
                formsAndClassPreferences: {
                  formOptions,
                  selected: selectedFormsClassPreferences,
                },
              };
              setAdminFormData(newObj);
            })
            .catch(() =>
              toast.error('There was an error retrieving the data needed.', {
                position: 'top-center',
                transition: Flip,
                theme: 'dark',
              })
            );
        } else {
          const initialValues = {
            id: '',
            code: '',
            description: '',
            content: '',
            active: true,
            locked: false,
            formsAndLetters: { formOptions, selected: [] },
            formsAndClassPreferences: { formOptions, selected: [] },
          };

          setAdminFormData(initialValues);
        }
      })
      .catch(() =>
        toast.error('There was an error retrieving the data needed.', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        })
      );

    setAdminFormSettings({ action: type, participle });
  }, []);
  return null;
};
export default useGetSetData;
