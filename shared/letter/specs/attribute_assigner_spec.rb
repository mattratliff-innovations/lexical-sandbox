# spec/services/letters/creation/attribute_assigner_spec.rb
require 'rails_helper'

RSpec.describe Letters::Creation::AttributeAssigner do
  # baseline records
  let(:creator)       { create(:user, network_id: 'net-1', piv_upn: 'creator@uscis.dhs.gov') }
  let(:assignee)      { create(:user) }
  let(:organization)  { create(:organization, active: true, days_forward: 12) }
  let(:header)        { create(:header) }
  let(:letter_type)   do
    create(:letter_type,
           starts_with: 'Dear',
           ends_with: 'Sincerely',
           starts_with_locked: true,
           ends_with_locked: true)
  end
  let(:form_type)     { create(:form_type) }
  let(:source_system) { create(:source_system) }
  let(:draft_status)  { create(:status_draft) }
  let(:class_preference) { create(:class_preference) }

  before do
    draft_status
    create(:user_organization_xref, user: creator, organization: organization)
  end

  # helper to run the assigner
  def run_assigner(params)
    ctx    = Letters::Creation::DraftContext.new(params).tap(&:valid?)
    letter = Letter.new
    Letters::Creation::AttributeAssigner.new(letter: letter, params: params, context: ctx).call
    letter
  end

  # ------------------------------------------------------------
  # Internal payload (no network_id)
  # ------------------------------------------------------------
  context 'internal payload (no network_id)' do
    let(:token_username) { creator.piv_upn } # matches creator
    let(:letter) { run_assigner(params) }

    let(:params) do
      {
        'organization_id' => organization.id,
        'source_system_id' => source_system.id,
        'lettertype_uuid' => letter_type.id,
        'formtype_uuid' => form_type.id,
        'class_preference_id' => class_preference.id,
        'deleted' => true
      }
    end

    before do
      token_stub = Struct.new(:username).new(token_username)
      allow(IcamOidcAuthentication).to receive(:parsed_jwt).and_return(token_stub)

      # Needs update after jira https://maestro.dhs.gov/jira/browse/DIDIT-70437 "Refactor Filing Type table into an enumerated column"
      create(:filing_type, :paper)
      create(:filing_type, :scanned)
      create(:filing_type, :eprocessing)
    end

    it 'sets organization' do
      expect(letter.organization).to eq(organization)
    end

    it 'sets status to draft' do
      expect(letter.status).to eq(draft_status)
    end

    it 'sets created_by from token username' do
      expect(letter.created_by).to eq(token_username)
    end

    it 'assigns creator as default assignee' do
      expect(letter.assigned).to eq(creator)
    end

    it 'copies deleted flag' do
      expect(letter.deleted).to be true
    end

    it 'sets days_forward from organization' do
      expect(letter.days_forward).to eq(12)
    end

    it 'copies starts_with and ends_with from letter_type' do
      expect(letter.starts_with).to eq('Dear')
      expect(letter.ends_with).to   eq('Sincerely')
    end

    it 'retains locked flags from letter_type' do
      expect(letter.starts_with_locked).to be true
      expect(letter.ends_with_locked).to   be true
    end

    it 'assigns source_system' do
      expect(letter.source_system).to eq(source_system)
    end

    it 'defaults filing_type to PAPER' do
      expect(letter.filing_type.name).to eq('PAPER')
    end

    it 'sets class_preference' do
      expect(letter.class_preference).to eq(class_preference)
    end
  end

  # ------------------------------------------------------------
  # Internal payload with explicit assignee
  # ------------------------------------------------------------
  context 'internal payload with explicit assignee' do
    let(:token_username) { creator.piv_upn }
    let(:letter) { run_assigner(params) }

    let(:params) do
      {
        'organization_id' => organization.id,
        'source_system_id' => source_system.id,
        'lettertype_uuid' => letter_type.id,
        'formtype_uuid' => form_type.id,
        'assigned_to_id' => assignee.id,
        'class_preference_id' => class_preference.id
      }
    end

    before do
      token_stub = Struct.new(:username).new(token_username)
      allow(IcamOidcAuthentication).to receive(:parsed_jwt).and_return(token_stub)
      create(:user_organization_xref, user: assignee, organization: organization)
    end

    it 'assigns the specified assignee' do
      expect(letter.assigned).to eq(assignee)
    end
  end

  # ------------------------------------------------------------
  # External payload (network_id present)
  # ------------------------------------------------------------
  context 'external payload (network_id present)' do
    let(:params) do
      {
        'network_id' => creator.network_id,
        'organization_id' => organization.id,
        'source_system_id' => source_system.id,
        'lettertype_uuid' => letter_type.id,
        'formtype_uuid' => form_type.id,
        'class_preference_id' => class_preference.id
      }
    end

    let(:letter) { run_assigner(params) }

    it 'sets created_by from creator piv_upn' do
      expect(letter.created_by).to eq(creator.piv_upn)
    end

    it 'sets days_forward to zero' do
      expect(letter.days_forward).to eq(0)
    end

    it 'unlocks locked flags' do
      expect(letter.starts_with_locked).to be false
      expect(letter.ends_with_locked).to   be false
    end
  end
end
