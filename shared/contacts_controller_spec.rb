require 'rails_helper'

describe Api::Scribe::V1::ContactsController do
  let(:user) { build(:user) }
  let(:organization) { create(:organization, name: 'Test Org') }

  describe "GET /index" do
    let(:action) { get '/api/scribe/v1/contacts' }

    context 'without iso privileges' do
      it_behaves_like 'iso_permissions_required'
    end

    context 'with iso privileges' do
      before do
        authenticate_to_creator
      end

      context 'with data in the db' do
        let(:draft) { create(:letter) }
        let!(:contact) { create(:representative_type, letter: draft) }
        let!(:address) { create(:address_contact_type, contact: contact, city: "Test City") }

        it 'returns a json list of contacts' do
          action

          expect(response).to have_http_status(:ok)
          expect(response.body).to include(contact.id)
          expect(response.body).to include(draft.id)
          expect(response.body).to include(contact.first_name)
          expect(response.body).to include(contact.last_name)
          expect(response.body).to include(contact.type)
          expect(response.body).to include(address.city)
          expect(response.body).to include(address.type)
          expect(response.body).to include(contact.contact_address_xref.id)
          expect(response.body).to include(contact.contact_address_xref.address.id)
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

  # Show
  describe 'show' do
    let(:draft) { create(:letter) }
    let!(:contact) { create(:petitioner_type, letter: draft) }
    let(:action) { get "/api/scribe/v1/contacts/#{contact.id}" }

    describe 'without iso permissions' do
      it_behaves_like 'iso_permissions_required'
    end

    describe 'with iso permissions' do
      before do
        authenticate_to_creator
      end

      it 'a contact' do
        action

        expect(response.body).to eq(contact.reload.to_json)
      end
    end
  end

  describe 'create' do
    let(:action) { post '/api/scribe/v1/contacts', params: contact_params }

    describe 'without iso permissions' do
      let(:contact_params) { {} }

      it_behaves_like 'iso_permissions_required'
    end

    describe 'with iso permissions' do
      before do
        authenticate_to_creator
      end

      context 'Representative with valid params' do
        let(:first_name) { "Test First Name" }
        let(:last_name) { "Test Last Name" }
        let(:type) { "RepresentativeType" }
        let(:street) { "100 East Elm" }
        let(:city) { "Green" }
        let(:state) { create(:state) }
        let(:zip) { "22335" }
        let(:address_type) { "AddressContactType" }

        let(:draft) { create(:letter) }

        it 'returns contact json' do
          post '/api/scribe/v1/contacts',
            params: {
              contact: {
                letter_id: draft.id,
                first_name: first_name,
                last_name: last_name,
                type: type,
                contact_address_xref_attributes: {
                  address_attributes: {
                    street: street,
                    city: city,
                    state_id: state.id,
                    zip_code: zip,
                    type: address_type
                  }
                }
              }
            }

          expect(response).to have_http_status(:ok)
          expect(response.body).to include(first_name)
          expect(response.body).to include(last_name)
          expect(response.body).to include(type)
          expect(response.body).to include(street)
          expect(response.body).to include(city)
          expect(response.body).to include(state.id)
          expect(response.body).to include(zip)
          expect(response.body).to include(address_type)
        end
      end

      context 'Primary Applicant with valid params' do
        let!(:original_primary_applicant) { create(:applicant_type, letter: draft, primary_applicant: true) }

        let(:first_name) { "Test First Name" }
        let(:last_name) { "Test Last Name" }
        let(:type) { "ApplicantType" }
        let(:street) { "100 East Elm" }
        let(:city) { "Green" }
        let(:state) { create(:state) }
        let(:zip) { "22335" }
        let(:primary_applicant) { true }
        let(:address_type) { "AddressContactType" }
        let(:draft) { create(:letter) }

        it 'returns contact json' do
          post '/api/scribe/v1/contacts',
            params: {
              contact: {
                letter_id: draft.id,
                first_name: first_name,
                last_name: last_name,
                type: type,
                primary_applicant: primary_applicant,
                contact_address_xref_attributes: {
                  address_attributes: {
                    street: street,
                    city: city,
                    state_id: state.id,
                    zip_code: zip,
                    type: address_type
                  }
                }
              }
            }, as: :json

          expect(response).to have_http_status(:ok)
          expect(response.body).to include(first_name)
          expect(response.body).to include(last_name)
          expect(response.body).to include(type)
          expect(response.body).to include(street)
          expect(response.body).to include(city)
          expect(response.body).to include(state.id)
          expect(response.body).to include(zip)
          expect(response.body).to include(address_type)
          expect(response.parsed_body["primary_applicant"]).to be(true)

          # Verify original contact is no longer the primary applicant
          expect(Contact.find(original_primary_applicant.id).primary_applicant).to be false
        end
      end

      context 'with invalid params' do
        it 'returns error' do
          expect { post '/api/scribe/v1/contacts' }.to raise_error(ActionController::ParameterMissing)
        end
      end

      context 'with contact save error' do
        it 'returns error' do
          post '/api/scribe/v1/contacts',
            params: {
              contact: {
                letter_id: "999",
                last_name: "any"
              }
            }

          expect(response).to have_http_status(:unprocessable_content)
          expect(response.parsed_body["error"]).to eq("Unable to create Contact: Letter must exist")
        end
      end
    end
  end

  describe 'contacts_for_letter' do
    let(:draft) { create(:letter) }
    let(:action) do
      get '/api/scribe/v1/contacts/contacts_for_letter',
          params: {
            contact: {
              letter_id: draft.id
            }
          }
    end

    describe 'without iso permissions' do
      it_behaves_like 'iso_permissions_required'
    end

    describe 'with iso permissions' do
      before do
        authenticate_to_creator
      end

      context 'with valid params' do
        let!(:contact) { create(:representative_type, letter: draft) }
        let!(:address) { create(:address_contact_type, contact: contact, city: "Test City") }

        it 'returns contact json' do
          action

          expect(response).to have_http_status(:ok)
          expect(response.body).to include(draft.id)
          expect(response.body).to include(contact.type)
          expect(response.body).to include(address.type)
          expect(response.body).to include(contact.contact_address_xref.id)
          expect(response.body).to include(contact.contact_address_xref.address.id)
        end
      end

      context 'with contacts with missing printer requirements' do
        let!(:contact) { create(:representative_type, letter: draft, contact_address_xref: nil, letter_recipient: true) }

        it 'returns errors json' do
          get '/api/scribe/v1/contacts/contacts_for_letter',
            params: {
              contact: {
                letter_id: draft.id
              }
            }

          expect(response).to have_http_status(:ok)
          expect(response.body).to include(draft.id)
          expect(response.body).to include(contact.type)
          expect(response.body).to include('Recipient does not have an address.')
        end
      end
    end
  end

  describe 'update' do
    describe 'without iso permissions' do
      let(:draft) { create(:letter) }
      let!(:contact) { create(:representative_type, letter: draft, address: AddressContactType.create!(city: "Test City")) }
      let(:action) { put "/api/scribe/v1/contacts/#{contact.id}", params: {} }

      it_behaves_like 'iso_permissions_required'
    end

    describe 'with iso permissions' do
      before do
        authenticate_to_creator
      end

      context 'with representative valid params' do
        let!(:contact) { create(:representative_type, letter: draft, address: AddressContactType.create!(city: "Test City")) }

        let(:first_name) { "Updated First Name" }
        let(:last_name) { "Updated Last Name" }
        let(:city) { "Updated City" }
        let(:draft) { create(:letter) }

        it 'returns contact json' do
          put "/api/scribe/v1/contacts/#{contact.id}",
            params: {
              contact: {
                letter_id: draft.id,
                last_name: last_name,
                first_name: first_name,
                contact_address_xref_attributes: { id: contact.contact_address_xref.id,
                                                   address_attributes: {
                                                     id: contact.contact_address_xref.address.id,
                                                     city: city,
                                                     type: "AddressContact"
                                                   } }
              }
            }

          expect(response).to have_http_status(:ok)
          expect(response.body).to include(last_name)
          expect(response.body).to include(first_name)
          expect(response.body).to include(city)
        end
      end

      context 'with updated primary applicant' do
        let!(:original_primary_applicant) { create(:applicant_type, letter: draft, primary_applicant: true) }
        let!(:new_primary_applicant) { create(:applicant_type, letter: draft, primary_applicant: false) }

        let(:first_name) { "Updated First Name" }
        let(:last_name) { "Updated Last Name" }
        let(:draft) { create(:letter) }

        it 'returns contact json' do
          put "/api/scribe/v1/contacts/#{new_primary_applicant.id}",
            params: {
              contact: {
                id: new_primary_applicant.id,
                letter_id: draft.id,
                last_name: last_name,
                first_name: first_name,
                primary_applicant: true,
                type: "ApplicantType"
              }
            }, as: :json

          expect(response).to have_http_status(:ok)
          expect(response.body).to include(last_name)
          expect(response.body).to include(first_name)
          expect(response.parsed_body["primary_applicant"]).to be(true)

          # Verify original contact is no longer the primary applicant
          expect(Contact.find(original_primary_applicant.id).primary_applicant).to be false
        end
      end

      describe 'with invalid params' do
        let!(:applicant) { create(:applicant_type, letter: create(:letter)) }

        it 'shows errors' do
          put "/api/scribe/v1/contacts/#{applicant.id}",
            params: {
              contact: {
                id: applicant.id,
                letter_id: nil
              }
            }, as: :json

          expect(response).to have_http_status(:unprocessable_content)
          expect(response.parsed_body['error']).to eq("Unable to edit Contact: Letter must exist")
        end
      end
    end
  end

  describe 'delete' do
    let(:draft) { create(:letter) }
    let!(:contact) { create(:representative_type, letter: draft) }
    let(:action) do
      delete "/api/scribe/v1/contacts/#{contact.id}",
          params: {
            contact: {
              letter_id: draft.id
            }
          }
    end

    describe 'without iso permissions' do
      it_behaves_like 'iso_permissions_required'
    end

    describe 'with iso permissions' do
      before do
        authenticate_to_creator
      end

      context 'with valid params' do
        it 'returns contact attributes' do
          action

          expect(response).to have_http_status(:ok)
          expect { Contact.find(contact.id) }.to raise_error(ActiveRecord::RecordNotFound)
        end
      end
    end
  end
end
