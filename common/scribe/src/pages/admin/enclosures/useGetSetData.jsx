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
            .get(`${APP_API_ENDPOINT}/enclosures/${id}`)
            .then((enclosureData) => {
              const selectedFormsLetters = enclosureData.data?.enclosureFormLetterXrefs?.map((enclosureXref) => ({
                id: enclosureXref.id,
                form: {
                  name: enclosureXref.formType.name,
                  label: enclosureXref.formType.name,
                  id: enclosureXref.formType.id,
                },
                letter: {
                  name: enclosureXref.letterType.name,
                  label: enclosureXref.letterType.name,
                  id: enclosureXref.letterType.id,
                },
              }));

              const newObj = {
                ...enclosureData.data,
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
