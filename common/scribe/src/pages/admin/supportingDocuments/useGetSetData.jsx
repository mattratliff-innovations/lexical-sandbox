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
            .get(`${APP_API_ENDPOINT}/supporting_documents/${id}`)
            .then((supportingDocumentData) => {
              const selectedFormsLetters = supportingDocumentData.data?.supportingDocumentFormLetterXrefs?.map((sdxref) => ({
                id: sdxref.id,
                form: {
                  name: sdxref.formType.name,
                  label: sdxref.formType.name,
                  id: sdxref.formType.id,
                },
                letter: {
                  name: sdxref.letterType.name,
                  label: sdxref.letterType.name,
                  id: sdxref.letterType.id,
                },
              }));

              const newObj = {
                ...supportingDocumentData.data,
                formsAndLetters: {
                  formOptions,
                  selected: selectedFormsLetters,
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
            name: '',
            active: true,
            prepend: false,
            courtesy: false,
            marginTop: 0.65,
            marginBottom: 1.0,
            marginLeft: 1.0,
            marginRight: 1.0,
            formsAndLetters: { formOptions, selected: [] },
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
