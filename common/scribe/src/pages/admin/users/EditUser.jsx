import React, { useState, useEffect, useCallback, useContext } from 'react';
import { toast, Flip } from 'react-toastify';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { DrButton } from '@druid/druid';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import TypeaheadWithSelectedList from '../../../components/typeaheadWithSelectedList/TypeaheadWithSelectedList';
import { StyledHr, HrNoTopMargin, BtnContainer } from '../../../components/designedComponents';
import { H1, H2 } from '../../../components/typography';
import { AppContext } from '../../../AppProvider';
import { getRoleNameFromPermission } from '../../../oidc/Authentication';
import useMultiRequestLoading from '../../../hooks/useMultiRequestLoading';
import LoadingFallback from '../../../utils/LoadingFallback';

export default function EditUser() {
  const redirect = useNavigate();
  const axios = createAuthenticatedAxios();
  const { id } = useParams();
  const { setHandleButtonClick } = useOutletContext();

  const [user, setUser] = useState({});
  const [allOrganizations, setAllOrganizations] = useState([]);
  const { setUserOrgsListEdit } = useContext(AppContext);
  const { loading, markFinished } = useMultiRequestLoading(2);

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/users/${id}`)
      .then((response) => setUser(response.data))
      .catch(() => {
        toast.error('There was an error retrieving the User data', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      })
      .finally(() => markFinished());

    axios
      .get(`${APP_API_ENDPOINT}/organizations/available_organizations_for_user`, { params: { user_id: id } })
      .then((response) => {
        const allOrgs = response.data.map((org) => ({
          ...org,
          label: org.name,
          value: org.id,
          selected: org.userOrganizationXrefs?.length > 0,
        }));

        setAllOrganizations(allOrgs);
      })
      .catch(() =>
        toast.error('There was an error retrieving Organization data', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        })
      )
      .finally(() => markFinished());
  }, []);

  const saveUserOrganizationMapping = () => {
    axios
      .put(`${APP_API_ENDPOINT}/users/set_user_organization_mapping/${id}`, {
        user: {
          userOrganizationXrefsAttributes: allOrganizations
            .filter((org) => org.selected)
            .map((selected) => ({
              userId: id,
              organizationId: selected.id,
              default: selected.userOrganizationXrefs[0]?.default,
            })),
        },
      })
      .then(() => {
        setUserOrgsListEdit(true);

        toast.success('Updated the user successfully!', {
          position: 'top-center',
          autoClose: 1000,
          transition: Flip,
          theme: 'dark',
          toastId: 'toastContact',
        });

        redirect('/admin/users');
      })
      .catch(() =>
        toast.error('There was an error saving user data.', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        })
      );
  };

  // Quick Actions Pattern
  const handleButtonClick = useCallback(() => saveUserOrganizationMapping(), [allOrganizations]);

  useEffect(() => setHandleButtonClick(() => handleButtonClick), [handleButtonClick]);

  if (loading) return <LoadingFallback />;

  return (
    <>
      <div className="row mt-3">
        <div className="col-10">
          <H1>
            <span>Edit User | </span>
            <span>{`${user.lastName}, ${user.firstName}`}</span>
          </H1>
        </div>
      </div>

      <div className="row">
        <div className="col-sm-5">
          <HrNoTopMargin />
        </div>
      </div>

      <div className="row">
        <div className="col-sm-5">
          <div>
            <span className="fw-bold">{'Full Name: '}</span>
            {`${user.firstName} `}
            {user?.middleInitial && `${user?.middleInitial} `}
            {user.lastName}
          </div>

          <div>
            <span className="fw-bold">{'Email Address: '}</span>
            {user.email}
          </div>

          <div>
            <span className="fw-bold">{'Privilege Level: '}</span>
            {getRoleNameFromPermission(user.roleName)}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-sm-8">
          <StyledHr />
        </div>
      </div>

      <div className="row">
        <div className="col-sm-5">
          <H2>Organization(s)</H2>
        </div>
      </div>

      <div className="row">
        <div className="col-sm-5">
          <TypeaheadWithSelectedList
            typeaheadId="organizations"
            typeaheadLabel="Organization(s)"
            options={allOrganizations}
            setValues={setAllOrganizations}
            userSelectedOptionDisplayKey="name"
          />
        </div>
      </div>

      <div className="row">
        <div className="col-sm-5">
          <StyledHr />
        </div>
      </div>

      <BtnContainer className="mb-4">
        <DrButton variant="primary" data-testid="saveUserButton" onClick={handleButtonClick} className="btn-size">
          Save
        </DrButton>

        <DrButton variant="secondary" data-testid="cancelEditUserButton" onClick={() => redirect('/admin/users')} className="btn-size">
          Back
        </DrButton>
      </BtnContainer>
    </>
  );
}
