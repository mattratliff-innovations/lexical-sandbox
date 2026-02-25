require 'rails_helper'

RSpec.describe Letters::Creation::Callbacks::BeforeValidate do
  # baseline data
  let(:user) { create(:user, piv_upn: 'token@uscis.dhs.gov') }
  # minimal params needed for internal (token) flow
  let(:params) do
    {
      'organization_id' => organization.id,
      'lettertype_uuid' => letter_type.id,
      'formtype_uuid' => form_type.id,
      'applicant_types_attributes' => [{ 'first_name' => 'Alice', 'last_name' => 'Doe' }]
    }
  end
  let(:context) { Letters::Creation::DraftContext.new(params).tap(&:valid?) }
  let(:letter)  { Letter.new }
  let(:organization)  { create(:organization, active: true) }
  let(:header)        { create(:header) }
  let(:letter_type)   { create(:letter_type, margin_top: 2.5) }
  let(:form_type)     { create(:form_type) }
  let(:paragraph)     { create(:standard_paragraph, content: 'Sample text', locked: false) }

  before do
    create(:user_organization_xref, user: user, organization: organization)
    create(:status_draft)
    create(:organization_header_letter_type_xref, organization: organization, header: header, letter_type: letter_type)

    token_stub = Struct.new(:username).new(user.piv_upn)
    allow(IcamOidcAuthentication).to receive(:parsed_jwt).and_return(token_stub)
    described_class.new(
      letter: letter,
      params: params,
      standard_paragraph_ids: [paragraph.id],
      context: context
    ).call
  end

  it 'copies nested applicant attributes' do
    expect(letter.applicant_types.first.first_name).to eq('Alice')
  end

  it 'copies header fields onto the letter' do
    expect(letter.row1_col1).to eq(header.row1_col1)
  end

  it 'copies margin attributes from letter type' do
    expect(letter.margin_top).to eq(letter_type.margin_top)
  end

  it 'builds standard paragraph section' do
    expect(letter.sections.first.text).to eq('Sample text')
  end

  it 'marks first applicant as default recipient' do
    expect(letter.applicant_types.first.letter_recipient).to be true
  end

  context "prunes all-nil nested attributes from params using deep_compact!" do
    let(:nested_keys) { %w[contacts_attributes applicant_types_attributes filing_type_attributes] }

    it "removes all-nil hashes and arrays from params" do
      params = {
        "contacts_attributes" => [
          { "first_name" => nil, "last_name" => nil, "address_attributes" => { "city" => nil, "type" => nil } }
        ],
        "applicant_types_attributes" => [
          { "first_name" => nil, "last_name" => nil, "address_attributes" => { "city" => nil, "type" => nil } }
        ],
        "filing_type_attributes" => { "name" => nil }
      }
      described_class.new(
        letter: Letter.new,
        params: params,
        standard_paragraph_ids: [],
        context: context
      ).call
      expect(params["contacts_attributes"]).to eq([])
      expect(params["applicant_types_attributes"]).to eq([])
      expect(params).to_not have_key("filing_type_attributes")
    end

    it "removes only nil keys from non-blank hashes and keeps non-blank hashes" do
      params = {
        "contacts_attributes" => [
          { "first_name" => "Jane", "last_name" => nil, "address_attributes" => { "city" => nil, "type" => nil } }
        ],
        "applicant_types_attributes" => [
          { "first_name" => nil, "last_name" => nil, "address_attributes" => { "city" => "Metropolis", "type" => nil } }
        ],
        "filing_type_attributes" => { "name" => "SCANNED", "foo" => nil }
      }
      described_class.new(
        letter: Letter.new,
        params: params,
        standard_paragraph_ids: [],
        context: context
      ).call
      expect(params["contacts_attributes"]).to eq([{ "first_name" => "Jane", "address_attributes" => {} }])
      expect(params["applicant_types_attributes"]).to eq([{ "address_attributes" => { "city" => "Metropolis" } }])
      expect(params["filing_type_attributes"]).to eq({ "name" => "SCANNED" })
    end

    it "does nothing if keys are missing" do
      params = { "foo" => "bar" }
      expect do
        described_class.new(
          letter: Letter.new,
          params: params,
          standard_paragraph_ids: [],
          context: context
        ).call
      end.to_not change { params }
    end

    it "removes all-nil nested hashes and arrays" do
      params = {
        "contacts_attributes" => [
          { "first_name" => nil, "address_attributes" => { "city" => nil, "zip_code" => nil } }
        ]
      }
      described_class.new(
        letter: Letter.new,
        params: params,
        standard_paragraph_ids: [],
        context: context
      ).call
      expect(params["contacts_attributes"]).to eq([])
    end
  end
end
