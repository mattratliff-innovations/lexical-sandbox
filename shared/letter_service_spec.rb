# rubocop:disable Layout/LineLength -- Line is too long
# rubocop:disable RSpec/VerifiedDoubles
describe LetterService do
  describe 'using letter types' do
    let(:username) { 'test-user' }
    let(:user) { create(:user, piv_upn: username) }
    let(:receipt_number) { 'SRC2407050076' }
    let(:associated_receipt_number) { 'SRC2407051111' }
    let(:receipt_date) { '2025-03-05' }
    let(:form_type_name) { 'I539N' }
    let(:letter_type) { create(:letter_type, signature_included: true) }
    let(:form_type) { create(:form_type) }
    let(:header) { create(:header) }
    let(:organization) { create(:organization, headers: [header]) }
    let(:registration) { create(:registration, form_type_name: form_type_name, receipt_number: receipt_number, associated_receipt_number: associated_receipt_number, receipt_date: receipt_date) }
    let!(:status) { create(:status_draft) }
    let(:standard_paragraphs) { create_list(:standard_paragraph, 3) }
    let(:standard_paragraphs_locked) { create(:standard_paragraph, locked: true) }
    let(:letter_params) do
      { 'letter_type_id' => letter_type.id, 'organization_id' => organization.id, 'registration_id' => registration.id,
        'header_id' => header.id,
        'registration_attributes' => { "id" => nil, "receipt_number" => receipt_number, "created_at" => nil, "updated_at" => nil, "form_type_name" => form_type_name, "associated_receipt_number" => associated_receipt_number, "receipt_date" => receipt_date },
        'filing_type_attributes' => { "name" => 'PAPER' } }
    end
    let(:echo_letter_params) do
      {
        'lettertype_uuid' => letter_type.id,
        'network_id' => user.piv_upn,
        'formtype_uuid' => form_type.id
      }
    end

    before do
      mock_icam_authentication('test-user')
      allow_any_instance_of(Api::Scribe::V1::LettersController).to receive(:validate_token_and_log_username!)
    end

    describe 'create_letter' do
      context 'from Scribe with contacts' do
        subject(:create_letter) { LetterService.create_letter(letter_params: letter_params.merge(applicant_types_attributes), standard_paragraph_ids: []) }

        before do
          user
        end

        let(:applicant_types_attributes) do
          { "applicant_types_attributes" => [{ "id" => nil, first_name: 'bob', last_name: 'bobberson', email: 'bob.bobberson@yahoo.com' }] }
        end

        it 'assigns letter recipients' do
          draft = create_letter
          expect(draft.applicant_types.first.letter_recipient).to be(true)
        end
      end

      context 'from Scribe with default signature' do
        let(:signature) { create(:organization_signature, organization: organization, default: true) }

        before do
          user
        end

        it 'creates the draft' do
          result = LetterService.create_letter(letter_params: letter_params, standard_paragraph_ids: standard_paragraphs.pluck(:id), echo: false)
          expect(result.letter_type_id).to eq(letter_type.id)
          expect(result.starts_with).to eq(letter_type.starts_with)
          expect(result.ends_with).to eq(letter_type.ends_with)
          expect(result.starts_with_locked).to eq(letter_type.starts_with_locked)
          expect(result.ends_with_locked).to eq(letter_type.ends_with_locked)
          expect(result.margin_top).to eq(letter_type.margin_top)
          expect(result.margin_left).to eq(letter_type.margin_left)
          expect(result.margin_right).to eq(letter_type.margin_right)
          expect(result.margin_bottom).to eq(letter_type.margin_bottom)
          expect(result.row1_col1).to eq(header.row1_col1)
          expect(result.row1_col2).to eq(header.row1_col2)
          expect(result.row2_col1).to eq(header.row2_col1)
          expect(result.row2_col2).to eq(header.row2_col2)
          expect(result.row3_col1).to eq(header.row3_col1)
          expect(result.row3_col2).to eq(header.row3_col2)
          expect(result.header_id).to eq(header.id)
          expect(result.status_id).to eq(status.id)
          expect(result.manual_creation).to be(false)
          letter_locator_code = "#{organization.code}#{form_type_name}#{letter_type.name[0, 5]}#{result.id}S"
          expect(result.locator_code).to eq(letter_locator_code)

          new_draft = Letter.where(id: result.id)
          expect(new_draft.length).to eq(1)

          sections = Section.where(letter_id: result.id)
          expect(sections[0].text).to eq(standard_paragraphs[0].content)
          expect(sections[1].text).to eq(standard_paragraphs[1].content)
          expect(sections[2].text).to eq(standard_paragraphs[2].content)

          expect(result.filing_type).to eq(FilingType.find_by(name: 'PAPER'))
        end

        it 'creates draft with mixed locked and unlocked standard-paragraphs' do
          result = LetterService.create_letter(letter_params: letter_params,
                                               standard_paragraph_ids: [standard_paragraphs[0].id, standard_paragraphs_locked.id,
            standard_paragraphs[2].id])
          sections = Section.where(letter_id: result.id)

          expect(sections[0].locked).to eq(standard_paragraphs[0].locked)
          expect(sections[1].locked).to eq(standard_paragraphs_locked.locked)
          expect(sections[2].locked).to eq(standard_paragraphs[2].locked)
        end

        it 'creates a draft if there is no filing_type in the params' do
          letter_params.delete('filing_type_attributes')
          result = LetterService.create_letter(
            letter_params: letter_params,
            standard_paragraph_ids: [standard_paragraphs[0].id, standard_paragraphs_locked.id, standard_paragraphs[2].id]
          )

          expect(result.filing_type).to be_nil
        end
      end

      context 'from Scribe without default signature' do
        let(:signature) { create(:organization_signature, organization: organization, default: false) }

        before do
          user
        end

        it 'creates the draft' do
          result = LetterService.create_letter(letter_params: letter_params, standard_paragraph_ids: standard_paragraphs.pluck(:id))

          expect(result.letter_type_id).to eq(letter_type.id)
          expect(result.starts_with).to eq(letter_type.starts_with)
          expect(result.ends_with).to eq(letter_type.ends_with)
          expect(result.starts_with_locked).to eq(letter_type.starts_with_locked)
          expect(result.ends_with_locked).to eq(letter_type.ends_with_locked)
          expect(result.margin_top).to eq(letter_type.margin_top)
          expect(result.margin_left).to eq(letter_type.margin_left)
          expect(result.margin_right).to eq(letter_type.margin_right)
          expect(result.margin_bottom).to eq(letter_type.margin_bottom)
          expect(result.organization_signature_id).to be_nil
          expect(result.status_id).to eq(status.id)
          expect(result.manual_creation).to be(false)

          new_draft = Letter.where(id: result.id)
          expect(new_draft.length).to eq(1)

          sections = Section.where(letter_id: result.id)
          expect(sections.length).to eq(3)
        end
      end
    end
  end


  describe 'create_letter_from_echo' do
let(:receipt_number) { 'SRC2407050076' }
let(:form_type_name) { 'I539N' }
let(:registration) { create(:registration, receipt_number: receipt_number, form_type_name: form_type_name) }
let(:network_id) { 'test-network-id' }
let(:user) { create(:user, piv_upn: network_id) } # Ensure piv_upn matches network_id
let(:echo_formtype_id) { form_type.id } # Define echo_formtype_id explicitly
let(:form_type) { create(:form_type, id: 1, ft_rolledover: true) } # Create FormType with matching ID
let(:echo_letter_params) do
  {
    'lettertype_uuid' => letter_type.id,
    'network_id' => network_id,
    'formtype_uuid' => echo_formtype_id,
    'receipt_num' => receipt_number
  }
end

  before do
    allow(User).to receive(:find_by).with(network_id: network_id).and_return(user)
    allow(FormType).to receive(:find).with(echo_formtype_id).and_return(form_type)
    allow(LetterType).to receive(:find).with(echo_lettertype_id).and_return(letter_type)
    allow(Organization).to receive(:find_by).with(echo_org_id: organization.id).and_return(organization)
  end

context 'when all parameters are valid' do
  it 'creates the draft letter successfully' do
    result = LetterService.create_letter(letter_params: echo_letter_params, echo: true)

    expect(result.errors).to be_empty
    expect(result.letter_type_id).to eq(letter_type.id)
    expect(result.registration_id).to eq(registration.id)
    expect(result.status.name).to eq(Status::DRAFT)
  end
end
end

  # TODO: Complete these rspec tests
  describe 'validate_and_fetch_scribe_data' do
    let(:network_id) { 'test_network_id' }
    let(:echo_lettertype_id) { 2 }
    let(:echo_formtype_id) { 1 }
    let(:organization) { double('Organization', id: 1, org_rolledover: true) }
    let(:form_type) { double('FormType', ft_rolledover: true) }
    let(:letter_type) { double('LetterType', id: echo_lettertype_id) }
    let(:user) { double('User', organizations: [organization]) }

    before do
      allow(Organization).to receive(:find_by).with(echo_org_id: organization.id).and_return(organization)
      allow(FormType).to receive(:find_by).with(echo_formtype_id: echo_formtype_id).and_return(form_type)
      allow(LetterType).to receive(:find_by).with(echo_lettertype_id: echo_lettertype_id).and_return(letter_type)
      allow(User).to receive(:find_by).with(network_id: network_id).and_return(user)
    end

    context 'when organization is valid' do
      let(:organization) { double('Organization', id: 1, org_rolledover: true) }
      let(:form_type) { double('FormType', id: 1, ft_rolledover: true) }
      let(:letter_type) { double('LetterType', id: 2) }
      let(:organizations_relation) { double('ActiveRecord::Relation') }
      let(:user) { double('User') }

      before do
        allow(user).to receive_message_chain(:organizations, :where).with(active: true).and_return([organization]) # rubocop:disable RSpec/MessageChain
      end

      it 'returns the Scribe Org ID and Letter Type ID' do
        result = LetterService.validate_and_fetch_scribe_data(network_id: network_id, echo_lettertype_id: echo_lettertype_id, echo_formtype_id: echo_formtype_id)
        expect(result).to eq({ data: { formtype_uuid: 1, lettertype_uuid: 2 } })
      end
    end

    context 'when organization has not rolled over to Scribe' do
      let(:organization) { double('Organization', id: 1, org_rolledover: false, active: true) }
      let(:organizations_relation) { double('ActiveRecord::Relation') }
      let(:user) { double('User') }

      before do
        allow(user).to receive_message_chain(:organizations, :where).with(active: true).and_return(organizations_relation) # rubocop:disable RSpec/MessageChain
        allow(organizations_relation).to receive(:first).and_return(organization)
      end

      it 'returns an error message' do
        result = LetterService.validate_and_fetch_scribe_data(
          network_id: network_id,
          echo_lettertype_id: echo_lettertype_id,
          echo_formtype_id: echo_formtype_id
        )

        expect(result).to eq({ error: 'Organization has not rolled over to Scribe', status: :unprocessable_entity })
      end
    end

    context 'when form type is invalid' do
      let(:form_type) { nil }
      let(:organizations_relation) { double('ActiveRecord::Relation') }
      let(:organization) { double('Organization', id: 1, org_rolledover: true, active: true) }
      let(:user) { double('User') }

      before do
        allow(user).to receive(:organizations).and_return(organizations_relation)
        allow(organizations_relation).to receive(:where).with(active: true).and_return([organization])
      end

      it 'returns an error message' do
        result = LetterService.validate_and_fetch_scribe_data(
          network_id: network_id,
          echo_lettertype_id: echo_lettertype_id,
          echo_formtype_id: echo_formtype_id
        )

        expect(result).to eq({ error: 'Form type has not rolled over to Scribe', status: :unprocessable_entity })
      end
    end

    context 'when letter type is invalid' do
      let(:letter_type) { nil }
      let(:organizations_relation) { double('ActiveRecord::Relation') }
      let(:organization) { double('Organization', id: 1, org_rolledover: true, active: true) }
      let(:user) { double('User') }

      before do
        allow(user).to receive(:organizations).and_return(organizations_relation)
        allow(organizations_relation).to receive(:where).with(active: true).and_return([organization])
      end

      it 'returns an error message' do
        result = LetterService.validate_and_fetch_scribe_data(
          network_id: network_id,
          echo_lettertype_id: echo_lettertype_id,
          echo_formtype_id: echo_formtype_id
        )

        expect(result).to eq({ error: 'Letter type not found for the given echo_lettertype_id', status: :not_found })
      end
    end

    context 'when user does not have access to Scribe' do
      before do
        allow(User).to receive(:find_by).with(network_id: network_id).and_return(nil)
      end

      it 'returns an error message' do
        result = LetterService.validate_and_fetch_scribe_data(
          network_id: network_id,
          echo_lettertype_id: echo_lettertype_id,
          echo_formtype_id: echo_formtype_id
        )

        expect(result).to eq({ error: 'User does not have access to Scribe', status: :forbidden })
      end
    end
  end

  def mock_icam_authentication(username, rights=Role::ISO_PERMISSION)
    permission = rights # Role::ISO_PERMISSION
    validation_result = IcamOidcAuthentication::JwtValidationResult.new(
      success: true, token: 'some token', username: username, scopes: [permission], body_map: { user_attributes: { piv_upn: username } }
    )
    allow(IcamOidcAuthentication).to receive(:parsed_jwt).and_return validation_result
  end
end
# rubocop:enable Layout/LineLength -- Line is too long
# rubocop:enable RSpec/VerifiedDoubles
