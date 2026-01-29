require 'rails_helper'

RSpec.describe Letters::CreateService do
  let(:status_draft) { create(:status_draft) } # ensure Status 'draft' exists
  let(:receipt_number) { 'IOE0993491112' }
  let(:base_params) do
    {
      'network_id' => user.network_id,
      'organization_id' => organization.id,
      'formtype_uuid' => form_type.id,
      'lettertype_uuid' => letter_type.id,
      'source_code' => source_system.code,
      'registration_attributes' => {
        'receipt_number' => receipt_number
      }
    }
  end

  let(:form_type)   { create(:form_type) }
  let(:letter_type) { create(:letter_type) }
  let(:source_system) { create(:source_system) }

  let(:user) { create(:user, network_id: 'net-1') }
  let(:piv_upn_user) { create(:user) }
  let(:organization) { create(:organization, active: true) }
  let(:header) { create(:header) }
  let(:letter_type) { create(:letter_type) }
  let!(:organization_header_letter_type_xref) do
    create(:organization_header_letter_type_xref, organization: organization, header: header, letter_type: letter_type)
  end


  before do
    status_draft
    create(:user_organization_xref, user: user, organization: organization)
    create(:user_organization_xref, user: piv_upn_user, organization: organization)

    token_stub = Struct.new(:username).new(piv_upn_user.piv_upn)
    allow(IcamOidcAuthentication).to receive(:parsed_jwt).and_return(token_stub)

    # Needs update after jira https://maestro.dhs.gov/jira/browse/DIDIT-70437 "Refactor Filing Type table into an enumerated column"
    create(:filing_type, :paper)
    create(:filing_type, :scanned)
    create(:filing_type, :eprocessing)
  end

  def run_service(params, standard_paragraph_ids=[])
    described_class.new(
      letter_params: params,
      standard_paragraph_ids: standard_paragraph_ids
    ).call
  end

  describe 'persistence / locator code' do
    let(:letter) { run_service(base_params) }

    it('persists the letter') { expect(letter).to be_persisted }

    it 'sets the locator code with the correct suffix' do
      expect(letter.locator_code).to end_with("#{letter.id}S")
    end
  end

  context 'organization_id param' do
    let(:other_org) { create(:organization, active: true) }
    let(:other_header) { create(:header) }

    before do
      create(:user_organization_xref, user: user, organization: other_org)
      create(:organization_header_xref, organization: other_org, header: other_header)
    end

    it 'uses the organization specified in the params' do
      letter = run_service(base_params.merge('organization_id' => other_org.id))
      expect(letter.organization).to eq(other_org)
    end
  end

  context 'source_system_id param' do
    it 'finds the source system by id when provided' do
      sys_by_id = create(:source_system)
      letter = run_service(
        base_params.merge(
          'source_system_id' => sys_by_id.id,
          'source_code' => nil # suppress code lookup
        )
      )
      expect(letter.source_system).to eq(sys_by_id)
    end
  end

  it 'creates a draft when echo_formtype_id (and echo_lettertype_id) are provided' do
    form_type.update!(echo_formtype_id: 101, ft_rolledover: true)
    letter_type.update!(echo_lettertype_id: 202)
    organization.update!(org_rolledover: true, echo_org_id: 303)

    params = base_params
      .except('formtype_uuid', 'lettertype_uuid', 'organization_id')
      .merge(
        'echo_formtype_id' => 101,
        'echo_lettertype_id' => 202,
        'echo_org_id' => 303
      )

    letter = run_service(params)

    expect(letter.errors).to be_empty
    expect(letter.letter_type).to eq(letter_type)
    expect(letter.registration.form_type_name).to eq(form_type.name)
  end

  it 'persists assigned_to_id when provided' do
    assignee = create(:user)
    params   = base_params.merge('assigned_to_id' => assignee.id)
    letter   = run_service(params)
    expect(letter.errors).to be_empty
    expect(letter.assigned_to_id).to eq(assignee.id)
  end

  it 'persists deleted when provided' do
    letter = run_service(base_params.merge('deleted' => true))
    expect(letter.errors).to be_empty
    expect(letter.deleted).to be true
  end

  it 'persists return_address_override' do
    addr = create(:address_contact_type)
    letter = run_service(base_params.merge('return_address_override' => addr.id))
    expect(letter.errors).to be_empty
    expect(letter.return_address_override).to eq(addr.id)
  end

  it 'persists manual_creation' do
    letter = run_service(base_params.merge('manual_creation' => true))
    expect(letter.errors).to be_empty
    expect(letter.manual_creation).to be true
  end

  it 'persists vawa' do
    letter = run_service(base_params.merge('vawa' => true))
    expect(letter.errors).to be_empty
    expect(letter.vawa).to be true
  end

  it 'uses the filing type specified by filing_type_id' do
    existing_ft = create(:filing_type)
    params = base_params.except('filing_type_attributes')
      .merge('filing_type_id' => existing_ft.id)
    letter = run_service(params)
    expect(letter.errors).to be_empty
    expect(letter.filing_type).to eq(existing_ft)
  end

  it 'persists letter_category_hac_id' do
    cat = create(:letter_category_hac)
    letter = run_service(base_params.merge('letter_category_hac_id' => cat.id))
    expect(letter.errors).to be_empty
    expect(letter.letter_category_hac_id).to eq(cat.id)
  end

  it 'creates a petitioner from petitioner_type_attributes' do
    params = base_params.merge(
      'petitioner_type_attributes' => { 'first_name' => 'Pat', 'last_name' => 'Smith' }
    )
    letter = run_service(params)
    expect(letter.petitioner_type.first_name).to eq('Pat')
  end

  it 'auto-fills form_type_name on the built registration' do
    letter = run_service(base_params)
    expect(letter.registration.form_type_name).to eq(form_type.name)
  end

  it 'creates a representative from representative_type_attributes' do
    params = base_params.merge(
      'representative_type_attributes' => {
        'first_name' => 'Rep',
        'last_name' => 'Jones',
        'firm_name' => 'Law & Co.'
      }
    )

    letter = run_service(params)

    expect(letter.representative_type.firm_name).to eq('Law & Co.')
    expect(letter.representative_type.first_name).to eq('Rep')
  end

  it 'persists end_notes passed in the params' do
    notes   = ['note one', 'note two']
    letter  = run_service(base_params.merge('end_notes' => notes))
    expect(letter.end_notes).to eq(notes)
  end

  it 'persists enclosure_ids passed in the params' do
    enclosure = create(:enclosure)
    letter    = run_service(base_params.merge('enclosure_ids' => [enclosure.id]))
    expect(letter.enclosures.first).to eq(enclosure)
  end

  context 'user derived from token piv_upn when network_id is absent' do
    it 'locates the token user and assigns it to the letter' do
      letter = run_service(base_params.except('network_id'))

      token_user = User.find_by(piv_upn: IcamOidcAuthentication.parsed_jwt.username)

      expect(letter.errors).to be_empty
      expect(letter.assigned).to eq(token_user)
      expect(letter.created_by).to eq(token_user.piv_upn)
    end
  end

  it 'sets created_by to the network-id user piv_upn when network_id is present' do
    letter = run_service(base_params)
    expect(letter.created_by).to eq(user.piv_upn)
  end

  it 'sets created_by to token username when network_id is absent' do
    letter = run_service(base_params.except('network_id'))
    expect(letter.created_by).to eq(piv_upn_user.piv_upn)
  end

  it 'assigns the token user when network_id is absent' do
    letter = run_service(base_params.except('network_id'))
    expect(letter.assigned).to eq(piv_upn_user)
  end

  context 'days_forward' do
    it 'is 0 when network_id is present' do
      letter = run_service(base_params)
      expect(letter.days_forward).to eq(0)
    end

    it 'uses organization.days_forward when network_id is absent' do
      organization.update!(days_forward: 5)
      letter = run_service(base_params.except('network_id'))
      expect(letter.days_forward).to eq(5)
    end
  end

  context 'locked flags' do
    it 'forces starts_with_locked / ends_with_locked to false when network_id is present' do
      custom_lt = create(:letter_type, starts_with_locked: true, ends_with_locked: true)
      letter    = run_service(base_params.merge('lettertype_uuid' => custom_lt.id))

      expect(letter.starts_with_locked).to be false
      expect(letter.ends_with_locked).to   be false
    end

    it 'copies locked flags from letter_type when network_id is absent' do
      custom_lt = create(:letter_type, starts_with_locked: true, ends_with_locked: true)
      organization.update!(days_forward: 3) # to avoid days_forward nil
      letter = run_service(base_params.except('network_id').merge('lettertype_uuid' => custom_lt.id))

      expect(letter.starts_with_locked).to be true
      expect(letter.ends_with_locked).to   be true
    end
  end

  it 'assigns a default letter recipient' do
    params = base_params.merge(
      'applicant_types_attributes' => [
        { 'first_name' => 'Alice', 'last_name' => 'Doe' }
      ]
    )
    letter = run_service(params)
    expect(letter.applicant_types.first.letter_recipient).to be true
  end

  it 'persists letter_date_override when provided' do
    override_date = Date.new(2025, 12, 25)
    letter = run_service(base_params.merge('letter_date_override' => override_date))
    expect(letter.errors).to be_empty
    expect(letter.letter_date_override).to eq(override_date)
  end

  describe 'attribute assignments' do
    let(:filing_type) { FilingType.find_by(name: 'PAPER') } # for the default lookup
    let(:letter)      { run_service(base_params) }

    before do
      filing_type
    end

    it 'copies header fields onto the letter' do
      letter = run_service(base_params)
      expect(letter.header_id).to eq(header.id)
    end

    it 'copies margin attributes onto the letter' do
      letter = run_service(base_params)
      expect(letter.margin_top).to eq(letter_type.margin_top)
    end

    it 'builds sections from standard_paragraph_ids' do
      paragraph = create(:standard_paragraph, content: 'Test paragraph', locked: false)
      letter = run_service(base_params, [paragraph.id])
      expect(letter.sections.first.text).to eq('Test paragraph')
    end

    it('sets organization')         { expect(letter.organization).to eq(organization) }
    it('sets registration')         { expect(letter.registration.receipt_number).to eq(receipt_number) }
    it('sets status')               { expect(letter.status).to eq(status_draft) }
    it('sets created_by')           { expect(letter.created_by).to eq(user.piv_upn) }
    it('sets assigned user')        { expect(letter.assigned).to eq(user) }
    it('sets days_forward')         { expect(letter.days_forward).to eq(0) }
    it('copies starts_with text')   { expect(letter.starts_with).to eq(letter_type.starts_with) }
    it('copies starts_with_locked') { expect(letter.starts_with_locked).to be(false) }
    it('copies ends_with text')     { expect(letter.ends_with).to eq(letter_type.ends_with) }
    it('copies ends_with_locked')   { expect(letter.ends_with_locked).to be(false) }
    it('sets source_system')        { expect(letter.source_system).to eq(source_system) }
    it('sets filing_type')          { expect(letter.filing_type).to eq(filing_type) }
  end

  context 'when setup errors exist' do
    before do
      # Override global token stub so no user matches
      missing_token = Struct.new(:username).new('no-such-piv')
      allow(IcamOidcAuthentication).to receive(:parsed_jwt).and_return(missing_token)
    end

    let(:result) { run_service(base_params.merge('network_id' => 'missing')) }

    it('returns the draft letter') { expect(result).to be_a(Letter) }
    it('is not persisted')         { expect(result).to_not be_persisted }
    it('contains the setup error') { expect(result.errors.full_messages).to include('User not found') }
  end

  context 'ensure_user' do
    before do
      # override the global stub so no user matches the token either
      missing_token = Struct.new(:username).new('no-such-piv')
      allow(IcamOidcAuthentication).to receive(:parsed_jwt).and_return(missing_token)
    end

    it 'adds error when user missing' do
      params  = base_params.merge('network_id' => 'missing')
      letter  = run_service(params)
      expect(letter.errors.full_messages).to include('User not found')
    end
  end

  context 'ensure_organization' do
    it 'adds error when organization_id is missing' do
      params = base_params.except('organization_id')
      letter = run_service(params)
      expect(letter.errors.full_messages).to include('Active organization not found for user')
    end

    it 'adds error when organization_id is invalid' do
      params = base_params.merge('organization_id' => SecureRandom.uuid)
      letter = run_service(params)
      expect(letter.errors.full_messages).to include('Active organization not found for user')
    end

    it 'adds error when echo_org_id is invalid' do
      params = base_params.except('organization_id').merge('echo_org_id' => 999_999)
      letter = run_service(params)
      expect(letter.errors.full_messages).to include('Active organization not found for user')
    end
  end

  context 'ensure_source_system' do
    it 'adds error when source system missing' do
      params = base_params.merge('source_code' => 'bad')
      letter = run_service(params)
      expect(letter.errors.full_messages).to include("Source System with code 'bad' not found")
    end
  end

  context 'ensure_registration' do
    it 'adds error when registration is not provided' do
      params = base_params.except('registration_attributes') # remove the hash
      letter = run_service(params)

      expect(letter.errors.full_messages).to include('Registration not provided')
    end
  end

  context 'ensure_letter_type' do
    it 'adds error when letter_type id invalid' do
      params = base_params.merge('lettertype_uuid' => SecureRandom.uuid)
      letter = run_service(params)
      expect(letter.errors.full_messages).to include('Letter type not found')
    end
  end

  context 'ensure_draft_status' do
    it 'adds error when draft status missing' do
      Status.where(name: Status::DRAFT).delete_all
      letter = run_service(base_params)
      expect(letter.errors.full_messages).to include('Draft status not found')
    end
  end

  it 'auto-fills form_type_name when registration_attributes lack it' do
    new_receipt = 'IOE5555555566'

    params = base_params
      .except('receipt_num') # omit the old lookup key
      .merge('registration_attributes' => {
        'receipt_number' => new_receipt # no form_type_name key
      })

    expect { run_service(params) }
      .to change(Registration, :count).by(1)
      .and change(Letter, :count).by(1)

    draft = Letter.last
    expect(draft.registration.receipt_number).to eq(new_receipt)
    expect(draft.registration.form_type_name).to eq(form_type.name) # auto-filled
  end

  it 'logs a Kafka fire-hose record after draft creation' do
    expect_any_instance_of(Letter)
      .to receive(:log_kafka_queue_firehose_record).once

    run_service(base_params)
  end
end
