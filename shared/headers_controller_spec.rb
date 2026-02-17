require 'rails_helper'
require 'json'

describe Api::Scribe::V1::HeadersController do
  let(:user) { build(:user) }
  let(:header_name) { "Coolest Header" }
  let(:header_row1col1) { "[[[LETTER_DATE]]]" }
  let(:header_row1col2) { "[[[CIS_ADDRESS]]]" }
  let(:header_row2col1) { "[[[MORE_DATE]]]" }
  let(:header_row2col2) { "[[[MORE_ADDRESS]]]" }
  let(:header_row3col1) { "[[[OTHER_DATE]]]" }
  let(:header_row3col2) { "[[[OTHER_ADDRESS]]]" }
  let(:header) { create(:header) }
  let(:header_2) { create(:header) }

  describe 'authentication filters' do
    it_behaves_like 'auth_filter',
                    verb: :get,
                    path: -> { '/api/scribe/v1/headers' },
                    allowed: %i[groupadmin templateadmin superadmin developer],
                    forbidden: %i[viewonly creator creatorprinter supervisor]

    it_behaves_like 'auth_filter',
                    verb: :get,
                    path: -> { "/api/scribe/v1/headers/#{header.id}" },
                    allowed: %i[creator creatorprinter supervisor groupadmin templateadmin superadmin developer],
                    forbidden: %i[viewonly]

    it_behaves_like 'auth_filter',
                    verb: :post,
                    path: -> { '/api/scribe/v1/headers' },
                    params: -> { { header: { name: 'x' } } },
                    allowed: %i[templateadmin superadmin developer],
                    forbidden: %i[viewonly creator creatorprinter supervisor groupadmin]

    it_behaves_like 'auth_filter',
                    verb: :put,
                    path: -> { "/api/scribe/v1/headers/#{header.id}" },
                    params: -> { { header: { id: header.id, name: 'z' } } },
                    allowed: %i[templateadmin superadmin developer],
                    forbidden: %i[viewonly creator creatorprinter supervisor groupadmin]

    it_behaves_like 'auth_filter',
                    verb: :get,
                    path: -> { api_scribe_v1_headers_available_headers_for_organization_path },
                    allowed: %i[groupadmin templateadmin superadmin developer],
                    forbidden: %i[viewonly creator creatorprinter supervisor]

    it_behaves_like 'auth_filter',
                    verb: :get,
                    path: -> { active_api_scribe_v1_organization_headers_path(organization_id: create(:organization).id) },
                    allowed: %i[creator creatorprinter supervisor groupadmin templateadmin superadmin developer],
                    forbidden: %i[viewonly]
  end

  describe "GET /index" do
    let(:action) { get '/api/scribe/v1/headers' }

    describe 'without templateadmin permissions' do
      it_behaves_like 'templateadmin_permissions_required'
    end

    describe 'with templateadmin permissions' do
      before do
        authenticate_to_templateadmin
      end

      context 'with data in the db' do
        it 'returns a json list of headers' do
          action

          expect(response).to have_http_status(:ok)
        end
      end

      context 'with no data in the db' do
        it 'returns a blank json list' do
          Header.destroy_all
          action

          expect(response).to have_http_status(:ok)
          expect(response.body).to eq([].to_json)
        end
      end
    end
  end

  # Create
  describe 'POST /headers' do
    describe 'with templateadmin permissions' do
      before do
        authenticate_to_templateadmin
      end

      context 'with valid params' do
        it 'returns header json' do
          post '/api/scribe/v1/headers', params: { header: { name: header_name } }

          expect(response).to have_http_status(:ok)
          expect(response.body).to include(header_name)
        end
      end

      context 'with invalid params' do
        it 'returns an error message' do
          post '/api/scribe/v1/headers', params: {}, as: :json
          
          expect(response).to have_http_status(:bad_request)
        end
      end

      context 'when a header with the same name exists' do
        let(:expected) { "Unable to create Header: Letter Header Name has already been taken" }

        it 'returns an error message' do
          post '/api/scribe/v1/headers', params: { header: { name: header.name } }

          expect(response).to have_http_status(:unprocessable_content)
          expect(response.parsed_body["error"]).to eq(expected)
        end
      end
    end
  end

  # Show
  describe 'show' do
    let(:action) { get "/api/scribe/v1/headers/#{header.id}" }

    describe 'without creator permissions' do
      it_behaves_like 'creator_permissions_required'
    end

    describe 'with creator permissions' do
      before do
        authenticate_to_creator
      end

      it 'a header' do
        action

        response_json = JSON.parse(response.body.force_encoding('UTF-8'))
        header_json = JSON.parse(header.to_json)

        expect(response_json).to eq(header_json)
      end
    end
  end

  # Edit
  describe 'PUT /headers' do
    describe 'without templateadmin permissions' do
      let(:action) do
        put "/api/scribe/v1/headers/#{header.id}", params: { header: { id: header.id,
                                                                       name: header_name,
                                                                       row1_col1: header_row1col1,
                                                                       row1_col2: header_row1col2,
                                                                       row2_col1: header_row2col1,
                                                                       row2_col2: header_row2col2,
                                                                       row3_col1: header_row3col1,
                                                                       row3_col2: header_row3col2,
                                                                       active: true } }
      end

      it_behaves_like 'templateadmin_permissions_required'
    end

    describe 'with templateadmin permissions' do
      before do
        authenticate_to_templateadmin
      end

      context 'with valid params' do
        it 'returns header json' do
          put "/api/scribe/v1/headers/#{header.id}", params: { header: { id: header.id,
                                                                         name: header_name,
                                                                         row1_col1: header_row1col1,
                                                                         row1_col2: header_row1col2,
                                                                         row2_col1: header_row2col1,
                                                                         row2_col2: header_row2col2,
                                                                         row3_col1: header_row3col1,
                                                                         row3_col2: header_row3col2,
                                                                         active: true } }

          expect(response).to have_http_status(:ok)
          expect(response.body).to include(header_name)
          expect(response.body).to include(header_row1col1)
          expect(response.body).to include(header_row3col2)
          expect(response.body).to include("true")
        end
      end

      context 'with invalid params' do
        it 'returns an error message' do
          put \"/api/scribe/v1/headers/#{header.id}\", params: {}, as: :json
          
          expect(response).to have_http_status(:bad_request)
        end
      end

      context 'when a header with the same name exists' do
        it 'returns an error message' do
          put "/api/scribe/v1/headers/#{header.id}", params: { header: { name: header_2.name,
                                                                         row1_col1: header_row1col1,
                                                                         row1_col2: header_row1col2,
                                                                         row2_col1: header_row2col1,
                                                                         row2_col2: header_row2col2,
                                                                         row3_col1: header_row3col1,
                                                                         row3_col2: header_row3col2 } }

          expect(response).to have_http_status(:unprocessable_content)
          expect(response.parsed_body["error"]).to eq("Unable to edit Header: Name has already been taken")
        end
      end
    end
  end

  describe 'available_headers_for_organization' do
    let(:organization) { create(:organization) }
    let(:organization_header_letter_type_xrefs) { create(:organization_header_letter_type_xref, organization: organization, header: header) }

    describe 'without templateadmin permissions' do
      let(:action) { get api_scribe_v1_headers_available_headers_for_organization_path }

      it_behaves_like 'templateadmin_permissions_required'
    end

    describe 'with templateadmin permissions' do
      before do
        authenticate_to_templateadmin
        organization_header_letter_type_xrefs
        header.active = true
        header.organizations = [organization]
        header.save!
      end

      it 'returns only active headers if there is no organization id present' do
        Header.destroy_all
        header  # Ensure header is created
        get api_scribe_v1_headers_available_headers_for_organization_path

        body_json = response.parsed_body
        expect(body_json.length).to eq(1)
        expect(body_json[0]['name']).to eq(header.name)
      end

      it 'returns the associated organization record if the header is associated with an organization' do
        get api_scribe_v1_headers_available_headers_for_organization_path, params: { organization_id: organization.id }

        body_json = response.parsed_body
        expect(body_json.length).to eq(1)
        expect(body_json[0]['name']).to eq(organization.name)
      end
    end
  end

  describe 'active' do
    let!(:organization) { create(:organization, active: true) }
    let!(:header_active) { create(:header, active: true) }
    let!(:header_inactive) { create(:header, active: false) }
    let(:action) { get active_api_scribe_v1_organization_headers_path(organization_id: organization.id) }

    describe 'without creator permissions' do
      it_behaves_like 'creator_permissions_required'
    end

    describe 'with creator permissions' do
      it 'only returns active headers' do
        create(:organization_header_letter_type_xref, organization: organization, header: header_active)
        create(:organization_header_letter_type_xref, organization: organization, header: header_inactive)
        authenticate_to_creator

        action

        body_json = response.parsed_body
        expect(body_json.length).to eq(1)
        expect(body_json).to include(header_active.as_json)
        expect(body_json).to_not include(header_inactive.as_json)
      end
    end
  end
end
