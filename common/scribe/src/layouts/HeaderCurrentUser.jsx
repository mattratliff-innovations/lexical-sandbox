import React, { useContext, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import styled from '@emotion/styled';

import { useLocation } from 'react-router-dom';
import { toast, Flip } from 'react-toastify';
import { PersonFill } from 'react-bootstrap-icons';
import { AppContext } from '../AppProvider';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../http/authenticatedAxios';
import { DISABLE_CREATE_LETTER_PAGE, DISABLE_DRAFT_PAGE, CONTACTS_PAGE } from '../constants';
import { getRoleNameFromToken } from '../oidc/Authentication';
import LoadingFallback from '../utils/LoadingFallback';

export const BLANK_ORG_ID = 'blank';

const OrgContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 700;
`;

export default function HeaderCurrentUser() {
  const { currentUser, draftOrganization, setCurrentUser, userOrgsListEdit } = useContext(AppContext);

  const axios = createAuthenticatedAxios();
  const location = useLocation();
  const { register, setValue } = useForm();

  const [organizationsList, setOrganizationsList] = useState([]);
  const [selectedOption, setSelectedOption] = useState();
  const [disabledOrganization, setDisabledOrganization] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/users/current_user_with_organizations`)
      .then((response) => {
        setOrganizationsList(response.data.organizations);
        const userWithOrgs = response.data;
        const userOrgXref = userWithOrgs.userOrganizationXrefs.find((org) => org.default === true);
        const selectedOrg = userWithOrgs.organizations.find((org) => org.id === userOrgXref?.organizationId);
        setSelectedOption(selectedOrg?.name || 'None');
        setCurrentUser({ ...userWithOrgs, defaultOrg: selectedOrg?.id });
      })
      .catch(() => {
        toast.error('There was an error retrieving user with organizations.', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      })
      .finally(() => setLoading(false));
  }, [userOrgsListEdit, JSON.stringify(location)]);

  useEffect(() => {
    const userOrganization = currentUser?.defaultOrg ? currentUser?.defaultOrg : BLANK_ORG_ID;
    setValue('userOrganization', userOrganization);
  }, [currentUser]);

  useEffect(() => {
    if (draftOrganization) setValue('userOrganization', draftOrganization);
  }, [draftOrganization]);

  useEffect(() => {
    const disableCreateLetterPage = new RegExp(DISABLE_CREATE_LETTER_PAGE);
    const disableDraftPage = new RegExp(DISABLE_DRAFT_PAGE);
    const contactPage = new RegExp(CONTACTS_PAGE);

    if ([disableCreateLetterPage, disableDraftPage, contactPage].some((pattern) => pattern.test(location.pathname))) setDisabledOrganization(true);
    else setDisabledOrganization(false);

    if ([disableDraftPage, contactPage].some((pattern) => pattern.test(location.pathname))) setValue('userOrganization', draftOrganization);
    else setValue('userOrganization', currentUser?.defaultOrg);
  }, [location]);

  const changeDefaultOrganization = (orgId) => {
    axios
      .put(`${APP_API_ENDPOINT}/users/change_default_organization/${currentUser.id}`, { organizationId: orgId })
      .then((response) => {
        const userWithDefaultOrg = { ...response.data, defaultOrg: orgId };
        setCurrentUser(userWithDefaultOrg);

        toast.success('Successfully updated your default organization!', {
          position: 'top-center',
          autoClose: 1000,
          transition: Flip,
          theme: 'dark',
          toastId: 'toastContact',
        });
      })
      .catch(() => {
        toast.error('There was an error changing your default organization!', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      });
  };

  const organizationDropDownList = () => {
    if (currentUser?.defaultOrg) return organizationsList;
    return [{ id: BLANK_ORG_ID, name: '' }, ...organizationsList];
  };

  const handleChange = (e) => {
    setSelectedOption(organizationsList.find((org) => org.id === e.target.value)?.name);
    changeDefaultOrganization(e.target.value);
  };

  if (loading) return <LoadingFallback blank />;

  return (
    <div className="d-flex justify-content-start align-items-center">
      <span className="me-2 fw-bold" data-testid="header-currentuser-name">
        <PersonFill className="me-2 text-secondary" size="1.5em" data-testid="person-avatar" />
        {`${currentUser?.firstName}   ${currentUser?.lastName}`}
      </span>

      <span className="me-2">|</span>

      <span className="me-3" data-testid="header-currentuser-role" title={getRoleNameFromToken()}>
        {getRoleNameFromToken()}
      </span>

      <form>
        <OrgContainer>
          <Label htmlFor="userOrganization">Organization</Label>
          <select
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...register('userOrganization')}
            id="userOrganization"
            data-testid="userOrganization"
            className="form-select"
            disabled={disabledOrganization}
            onChange={(e) => handleChange(e)}
            title={selectedOption}
            aria-label="Organization">
            {organizationDropDownList().map((org) => (
              <option key={org.id} value={org.id} data-testid={`organizationId_${org.id}`}>
                {org.name}
              </option>
            ))}
          </select>
        </OrgContainer>
      </form>
    </div>
  );
}
