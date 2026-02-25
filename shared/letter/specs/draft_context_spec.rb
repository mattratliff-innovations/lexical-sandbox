require 'rails_helper'

RSpec.describe Letters::Creation::DraftContext do
  let(:source_system) { create(:source_system, code: 'eCISCOR_ELIS2') }
  let(:user)          { create(:user, network_id: 'net-1', piv_upn: 'token@uscis.dhs.gov') }
  let(:organization)  { create(:organization, active: true) }
  let(:header)        { create(:header) }
  let(:letter_type)   { create(:letter_type) }
  let(:form_type)     { create(:form_type) }
  let(:draft_status)  { create(:status_draft) }

  let(:params) do
    {
      'organization_id' => organization.id,
      'source_system_id' => source_system.id,
      'lettertype_uuid' => letter_type.id,
      'formtype_uuid' => form_type.id
    }
  end

  before do
    draft_status
    create(:user_organization_xref, user: user, organization: organization)
    # create(:organization_header_letter_type_xref, organization: organization, header: header, letter_type: letter_type)
  end

  def stub_token(piv_upn)
    token = Struct.new(:username, :piv_upn).new(piv_upn, piv_upn)
    allow(IcamOidcAuthentication).to receive(:parsed_jwt).and_return(token)
  end

  it 'validates complete payload' do
    stub_token(user.piv_upn)
    expect(described_class.new(params).valid?).to be true
  end

  context 'user lookup' do
    it 'passes with token user present' do
      stub_token(user.piv_upn)
      expect(described_class.new(params).valid?).to be true
    end

    it 'adds error when user missing' do
      stub_token('missing@uscis.dhs.gov')
      dc = described_class.new(params)
      dc.valid?
      expect(dc.errors).to eq(['User not found'])
    end
  end

  context 'organization lookup' do
    it 'passes when organization present' do
      stub_token(user.piv_upn)
      expect(described_class.new(params).valid?).to be true
    end

    it 'adds error when organization missing' do
      stub_token(user.piv_upn)
      orgless_params = params.merge('organization_id' => SecureRandom.uuid)
      dc = described_class.new(orgless_params)
      dc.valid?
      expect(dc.errors).to eq(['Active organization not found for user', 'Header required but not found for letter'])
    end
  end

  context 'header lookup' do
    let(:context_instance) { described_class.new(params) }

    it 'passes when header present' do
      stub_token(user.piv_upn)
      expect(context_instance.valid?).to be true
    end

    context "with organization header letter type xref" do
      before do
        create(:organization_header_letter_type_xref, organization: organization, header: header, letter_type: letter_type)
      end

      it "returns the header associated to the letter type and organization through the xref" do
        expect(context_instance.header).to eq(header)
      end
    end

    context "without organization header letter type xref" do
      it "returns the default letter for the organization" do
        expect(context_instance.header).to eq(organization.default_header)
      end
    end
  end

  context 'source system lookup' do
    it 'passes when source system present' do
      stub_token(user.piv_upn)
      expect(described_class.new(params).valid?).to be true
    end

    it 'adds error when source system missing' do
      stub_token(user.piv_upn)
      bad = params.merge('source_system_id' => SecureRandom.uuid)
      dc = described_class.new(bad)
      dc.valid?
      expect(dc.errors.first).to match(/Source System/)
    end
  end

  context 'letter type lookup' do
    it 'passes when letter type present' do
      stub_token(user.piv_upn)
      expect(described_class.new(params).valid?).to be true
    end

    it 'adds error when letter type missing' do
      stub_token(user.piv_upn)
      bad = params.merge('lettertype_uuid' => SecureRandom.uuid)
      dc = described_class.new(bad)
      dc.valid?
      expect(dc.errors).to eq(['Letter type not found'])
    end
  end

  context 'draft status lookup' do
    it 'passes when draft status present' do
      stub_token(user.piv_upn)
      expect(described_class.new(params).valid?).to be true
    end

    it 'adds error when draft status missing' do
      stub_token(user.piv_upn)
      Status.where(name: Status::DRAFT).delete_all
      dc = described_class.new(params)
      dc.valid?
      expect(dc.errors).to eq(['Draft status not found'])
    end
  end
end
