require 'rails_helper'

describe Api::Scribe::V1::OrganizationsController do
  let(:organization) { create(:organization, days_forward: 30, active: true) }
  let(:organization_2) { create(:organization, active: true) }
  let(:signature) { create(:organization_signature, organization: organization, default: true) }
  let(:signature_2) { create(:organization_signature, organization: organization_2) }
  let(:address) { create(:address_organization_type, organization: organization, city: "Test City") }
  let(:name) { "Texas Service Center Updated" }
  let(:nickname) { "PS" }
  let(:street) { "111 Test Street" }
  let(:active) { true }
  let(:premium_processing) { true }
  let(:default) { true }
  let(:header) { create(:header) }
  let(:letter_type) { create(:letter_type) }
  let(:days_forward) { 2 }
  let(:state) { create(:state) }
  let(:country) { create(:country) }

  let(:org_hash) do
    { name: name,
      code: 'TSU',
      organization_address_xrefs_attributes: [{
        active: active,
        premium_processing: premium_processing,
        default: default,
        address_attributes: {
          pre_address: "111 Presidential Street",
          nickname: nickname,
          street: street,
          apt_suite_floor: "Apt 7",
          city: "Silver Moon",
          state_id: state.id,
          zip_code: "20119-0001",
          type: "AddressOrganizationType"
        }
      }],
      organization_header_letter_type_xrefs_attributes: [{
        letter_type_id: letter_type.id,
        header_id: header.id
      }],
      header_id: header.id,
      active: true,
      days_forward: days_forward,
      occ: true,
      org_rolledover: true }
  end

  let(:org_inactive_default_address_hash) do
    { name: name,
      code: 'TSU',
      organization_address_xrefs_attributes: [{
        active: false,
        premium_processing: premium_processing,
        default: true,
        address_attributes: {
          pre_address: "111 Presidential Street",
          nickname: nickname,
          street: street,
          apt_suite_floor: "Apt 7",
          city: "Silver Moon",
          state_id: state.id,
          zip_code: "20119-0001",
          type: "AddressOrganizationType"
        }
      }],
      organization_header_letter_type_xrefs_attributes: [{
        letter_type_id: letter_type.id,
        header_id: header.id
      }],
      header_id: header.id,
      active: true,
      days_forward: days_forward }
  end

  describe 'authentication filters' do
    before do
      create(:app_setting, :excluded_organization_letter_categories)
      create(:app_setting, :excluded_organization_scanned_digital_paper_letter_categories)
    end

    it_behaves_like 'auth_filter',
                    verb: :get,
                    path: -> { '/api/scribe/v1/organizations' },
                    allowed: %i[groupadmin templateadmin superadmin developer],
                    forbidden: %i[viewonly creator creatorprinter supervisor]

    it_behaves_like 'auth_filter',
                    verb: :get,
                    path: -> { "/api/scribe/v1/organizations/#{organization.id}" },
                    allowed: %i[groupadmin templateadmin superadmin developer],
                    forbidden: %i[viewonly creator creatorprinter supervisor]

    it_behaves_like 'auth_filter',
                    verb: :post,
                    path: -> { '/api/scribe/v1/organizations' },
                    params: -> { { organization: { name: 'x' } } },
                    allowed: %i[superadmin developer],
                    forbidden: %i[viewonly creator creatorprinter supervisor groupadmin templateadmin]

    it_behaves_like 'auth_filter',
                    verb: :put,
                    path: -> { "/api/scribe/v1/organizations/#{organization.id}" },
                    params: -> { { organization: { id: organization.id, name: 'z' } } },
                    allowed: %i[superadmin developer],
                    forbidden: %i[viewonly creator creatorprinter supervisor groupadmin templateadmin]

    it_behaves_like 'auth_filter',
                    verb: :put,
                    path: -> { "/api/scribe/v1/organizations/default_address/#{organization.id}" },
                    params: -> { { organization: { organization_address_xrefs_attributes: [] } } },
                    allowed: %i[superadmin developer],
                    forbidden: %i[viewonly creator creatorprinter supervisor groupadmin templateadmin]

    it_behaves_like 'auth_filter',
                    verb: :get,
                    path: -> { api_scribe_v1_organizations_available_organizations_for_user_path(user_id: create(:user).id) },
                    allowed: %i[supervisor groupadmin templateadmin superadmin developer],
                    forbidden: %i[viewonly creator creatorprinter]
  end

  describe "GET /index" do
    let(:action) { get '/api/scribe/v1/organizations' }

    describe 'without templateadmin permissions' do
      it_behaves_like 'templateadmin_permissions_required'
    end

    describe 'with superadmin permissions' do
      before do
        authenticate_to_superadmin
      end

      context 'with data in the db' do
        it 'returns a json list of organizations' do
          action

          expect(response).to have_http_status(:ok)
        end
      end

      context 'with no data in the db' do
        it 'returns a blank json list' do
          action

          expect(response).to have_http_status(:ok)
          expect(response.body).to eq([].to_json)
        end
      end
    end
  end

  # Create
  describe 'POST /organizations' do
    describe 'without superadmin permissions' do
      let(:action) { post '/api/scribe/v1/organizations', params: {}, as: :json }

      it_behaves_like 'superadmin_permissions_required'
    end

    describe 'with superadmin permissions' do
      before do
        create(:app_setting, :excluded_organization_letter_categories)
        create(:app_setting, :excluded_organization_scanned_digital_paper_letter_categories)
        authenticate_to_superadmin
      end

      context 'with valid params' do
        it 'returns organization json' do
          post '/api/scribe/v1/organizations', params: { organization: org_hash }, as: :json

          expect(response).to have_http_status(:ok)
          response_json = response.parsed_body

          expect(response_json['name']).to eq(name)
          expect(response_json['days_forward']).to eq(days_forward)
          org_addresses = response_json['organization_address_xrefs']
          expect(org_addresses.length).to eq(1)
          org_address = org_addresses[0]
          expect(org_address['address']['street']).to eq(street)
          expect(org_address['active']).to be(true)
          expect(org_address['premium_processing']).to be(true)
          expect(org_address['default']).to be(true)
          expect(response_json['occ']).to be(true)
          expect(response_json['org_rolledover']).to be(true)
        end
      end

      context 'with invalid params' do
        it 'returns an error message' do
          expect { post '/api/scribe/v1/organizations' }.to raise_error(ActionController::ParameterMissing)
        end
      end

      context 'when a organization with the same name exists' do
        let(:expected) { "Organization Name has already been taken" }

        it 'returns an error message' do
          post '/api/scribe/v1/organizations', params: { organization: { name: organization.name, code: 'SNA' } }, as: :json
          expect(response).to have_http_status(:unprocessable_content)
          expect(response.parsed_body["error"]).to match(expected)
        end
      end

      context 'with inactive default address' do
        it 'returns organization json with default set to active' do
          post '/api/scribe/v1/organizations', params: { organization: org_inactive_default_address_hash }, as: :json

          expect(response).to have_http_status(:ok)
          response_json = response.parsed_body

          org_addresses = response_json['organization_address_xrefs']
          expect(org_addresses.length).to eq(1)
          org_address = org_addresses[0]
          expect(org_address['active']).to be(true)
          expect(org_address['default']).to be(true)
        end
      end
    end
  end

  # Show
  describe 'show' do
    before do
      signature
      address
    end

    let(:action) { get "/api/scribe/v1/organizations/#{organization.id}" }

    describe 'without templateadmin permissions' do
      it_behaves_like 'templateadmin_permissions_required'
    end

    describe 'with superadmin permissions' do
      let!(:excluded_organization_letter_category) { create(:letter_category, name: 'Excluded Category') }
      let!(:app_setting) { create(:app_setting, name: AppSetting::EXCLUDED_ORGANIZATION_LETTER_CATEGORIES, active: true) }

      before do
        create(:app_setting, name: AppSetting::EXCLUDED_ORGANIZATION_SCANNED_DIGITAL_PAPER_LETTER_CATEGORIES, active: true)
        create(:app_setting_organization_letter_category_xref, app_setting: app_setting, organization: organization,
                                                               letter_category: excluded_organization_letter_category)
        authenticate_to_superadmin
      end

      it 'renders organization json' do
        action
        response_json = response.parsed_body
        expect(response_json['id']).to eq(organization.id)
        expect(response_json['name']).to eq(organization.name)
        expect(response_json['days_forward']).to eq(organization.days_forward)
        signatures = response_json['organization_signatures']
        expect(signatures.length).to eq(1)
        sig = signatures[0]
        expect(sig['id']).to eq(signature.id)
        expect(sig['signature_image_url']).to include("amazonaws.com/#{signature.id}/#{signature.original_filename}")
        org_addresses = response_json['organization_address_xrefs']
        expect(org_addresses.length).to eq(1)
        org_address = org_addresses[0]
        expect(org_address['address']['id']).to eq(address.id)
        expect(org_address['address']['city']).to eq("Test City")
        default_signature = response_json['default_signature']
        expect(default_signature['signatory_title']).to eq(signature.signatory_title)
        excluded_categories = response_json['excluded_organization_letter_categories']
        expect(excluded_categories.length).to eq(1)
        expect(excluded_categories[0]['id']).to eq(excluded_organization_letter_category.id)
        expect(excluded_categories[0]['name']).to eq(excluded_organization_letter_category.name)
      end
    end
  end

  # Update
  describe 'PUT /organizations' do
    describe 'without superadmin permissions' do
      let(:action) { put "/api/scribe/v1/organizations/#{organization.id}", params: { organization: {} }, as: :json }

      it_behaves_like 'superadmin_permissions_required'
    end

    describe 'with superadmin permissions' do
      before { authenticate_to_superadmin }

      context 'with valid params' do
        before do
          create(:app_setting, :excluded_organization_letter_categories)
          create(:app_setting, :excluded_organization_scanned_digital_paper_letter_categories)
        end

        it 'returns organization json' do
          put "/api/scribe/v1/organizations/#{organization.id}", params: { organization: org_hash }, as: :json
          expect(response).to have_http_status(:ok)
          response_json = response.parsed_body
          expect(response_json['name']).to eq(name)
          expect(response_json['days_forward']).to eq(days_forward)
          org_addresses = response_json['organization_address_xrefs']
          expect(org_addresses.length).to eq(1)
          org_address = org_addresses[0]
          expect(org_address['address']['nickname']).to eq(nickname)
          expect(org_address['active']).to be(true)
          expect(org_address['premium_processing']).to be(true)
          expect(org_address['default']).to be(true)
          org_header_letter_type_xrefs = Organization.find(organization.id).organization_header_letter_type_xrefs
          expect(org_header_letter_type_xrefs.length).to eq(1)
          expect(org_header_letter_type_xrefs[0].header_id).to eq(header.id)
          expect(org_header_letter_type_xrefs[0].letter_type_id).to eq(letter_type.id)
          expect(response_json['occ']).to be(true)
          expect(response_json['org_rolledover']).to be(true)
        end
      end

      context 'with valid params and inactive address' do
        before do
          create(:app_setting, :excluded_organization_letter_categories)
          create(:app_setting, :excluded_organization_scanned_digital_paper_letter_categories)
        end

        it 'returns organization json without default address' do
          put "/api/scribe/v1/organizations/#{organization.id}", params: { organization: org_inactive_default_address_hash }, as: :json
          expect(response).to have_http_status(:ok)
          response_json = response.parsed_body
          expect(response_json['name']).to eq(name)
          org_addresses = response_json['organization_address_xrefs']
          expect(org_addresses.length).to eq(1)
          org_address = org_addresses[0]
          expect(org_address['active']).to be(true)
          expect(org_address['default']).to be(true)
        end
      end

      context 'with invalid params' do
        it 'returns an error message' do
          expect { put "/api/scribe/v1/organizations/#{organization.id}" }.to raise_error(ActionController::ParameterMissing)
        end
      end

      context 'when a organization with the same name exists' do
        it 'returns an error message' do
          put "/api/scribe/v1/organizations/#{organization.id}", params: { organization: { name: organization_2.name } }, as: :json
          expect(response).to have_http_status(:unprocessable_content)
          expect(response.parsed_body["error"]).to eq("Unable to edit Organization: Name has already been taken")
        end
      end
    end
  end

  # Default Address
  describe 'Default Address' do
    let!(:original_default) do
      AddressOrganizationType.create!(organization: organization, street: 'original default street', apt_suite_floor: 'apt 2B',
                                      city: 'Miami', state_id: state.id, zip_code: '30165',
                                      country: country, pre_address: 'National Center', nickname: 'NC')
    end

    let!(:default_address) do
      OrganizationAddressXref.where(address_id: original_default.id).update(premium_processing: true, active: true, default: true)
    end

    let!(:new_default) do
      AddressOrganizationType.create!(organization: organization, street: 'new default Street', apt_suite_floor: 'floor 7',
                                      city: 'San Diego', state_id: state.id, zip_code: '12345',
                                      country: country, pre_address: 'Org 2', nickname: 'O2')
    end

    let(:new_default_address) do
      OrganizationAddressXref.where(address_id: new_default.id).update(premium_processing: true, active: false, default: false)
    end

    let(:action) do
      put "/api/scribe/v1/organizations/default_address/#{organization.id}",
    params: {
      organization: {
        organization_address_xrefs_attributes: [{
          id: organization.organization_address_xrefs[1].id,
          default: default_address[0].default,
          address_attributes: {
            id: new_default.id,
            nickname: 'test nickname'
          }
        }]
      }
    }, as: :json
    end

    describe 'without superadmin permissions' do
      it_behaves_like 'superadmin_permissions_required'
    end

    describe 'with superadmin permissions' do
      before do
        authenticate_to_superadmin
      end

      context 'with default address' do
        it 'returns organization json' do
          action

          response_json = response.parsed_body

          expect(response_json['name']).to eq(organization.name)
          expect(response_json['days_forward']).to eq(organization.days_forward)
          org_addresses = response_json['organization_address_xrefs']
          expect(org_addresses.length).to eq(2)
          expect(org_addresses[0]['address']['street']).to eq(original_default.street)
          expect(org_addresses[0]['default']).to be(false)
          expect(org_addresses[0]['active']).to be(true)
          expect(org_addresses[1]['address']['street']).to eq(new_default.street)
          expect(org_addresses[1]['default']).to be(true)
          expect(org_addresses[1]['active']).to be(true)
        end
      end
    end
  end

  describe 'available_organizations_for_user' do
    let(:user) { create(:user) }
    let(:user2) { create(:user) }
    let!(:organization_1) { create(:organization, users: [user]) }
    let!(:organization_2) { create(:organization) }
    let!(:organization_3) { create(:organization, users: [user2]) }
    let(:organization_4) { create(:organization, active: false) }
    let(:action) { get api_scribe_v1_organizations_available_organizations_for_user_path, params: { user_id: user.id } }

    describe 'without supervisor permissions' do
      it_behaves_like 'supervisor_permissions_required'
    end

    describe 'with supervisor permissions' do
      before do
        user_xref = organization_1.user_organization_xrefs[0]
        user_xref.default = true
        user_xref.save!
        organization_4
        authenticate_to_supervisor
      end

      it 'returns the active organizations as well as the organizations mapped to the user already and does not return other users\' organizations' do
        action

        json_response = response.parsed_body

        expect(json_response.length).to eq(3)
        response_org_1 = json_response.find { |org| org['id'] == organization_1.id }
        expect(response_org_1['user_organization_xrefs'].length).to eq(1)
        expect(response_org_1['user_organization_xrefs'][0]['user_id']).to eq(user.id)
        expect(response_org_1['user_organization_xrefs'][0]['default']).to be(true)
        response_org_2 = json_response.find { |org| org['id'] == organization_2.id }
        expect(response_org_2['user_organization_xrefs'].length).to eq(0)
        expect(json_response.find { |org| org['id'] == organization_3.id }['user_organization_xrefs']).to be_empty
      end
    end
  end
end
