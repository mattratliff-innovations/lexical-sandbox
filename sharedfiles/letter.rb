class Letter < ApplicationRecord
  include MainCopyConcern

  belongs_to :letter_type
  belongs_to :registration
  belongs_to :organization

  has_many :contacts, dependent: :destroy
  has_many :contact_address_xrefs, through: :contacts
  has_many :addresses, through: :contacts
  has_many :sections, dependent: :destroy
  has_many :form_types, through: :letter_type

  has_many :letter_enclosure_xrefs, dependent: :destroy
  has_many :enclosures, through: :letter_enclosure_xrefs, inverse_of: :letters

  # Contact STI Models
  has_many :applicant_types, dependent: :destroy
  has_one :petitioner_type, dependent: :destroy
  has_one :representative_type, dependent: :destroy

  has_one :letter_category, through: :letter_type

  has_one  :main_copy_contact,      -> { where(main_copy: true)     }, class_name: 'Contact', inverse_of: :letter, dependent: :destroy
  has_many :courtesy_copy_contacts, -> { where(courtesy_copy: true) }, class_name: 'Contact', inverse_of: :letter, dependent: :destroy

  belongs_to :header

  belongs_to :organization_signature, optional: true
  belongs_to :status, optional: true

  belongs_to :creator, class_name: 'User', foreign_key: 'created_by', primary_key: 'piv_upn', inverse_of: :letters
  belongs_to :assigned, class_name: 'User', foreign_key: 'assigned_to_id', primary_key: 'id', inverse_of: :letters

  accepts_nested_attributes_for :sections, allow_destroy: true
  accepts_nested_attributes_for :registration
  accepts_nested_attributes_for :letter_type

  accepts_nested_attributes_for :contacts, allow_destroy: true
  accepts_nested_attributes_for :applicant_types, allow_destroy: true
  accepts_nested_attributes_for :petitioner_type, allow_destroy: true
  accepts_nested_attributes_for :representative_type, allow_destroy: true
  accepts_nested_attributes_for :enclosures, allow_destroy: true

  validates :created_by, presence: true
  validates :vawa, inclusion: { in: [true, false] }

  # JSONB column - no serialization needed, Rails handles it automatically

  # Each scope here is used on the LetterSearch page
  scope :receipt_number_search, ->(param) { where("registrations.receipt_number LIKE ?", "#{param}%") if param.present? }
  scope :status_id_search, ->(param) { where(status_id: param) if param.present? }
  scope :organization_id_search, ->(param) { where(organization_id: param) if param.present? }
  scope :form_type_code_search, ->(param) { where(registrations: { form_type_name: param }) if param.present? }
  scope :alien_number_search, ->(param) { joins(:contacts).where(contacts: { a_number: param }) if param.present? }
  scope :letter_type_id_search, ->(param) { where(letter_type_id: param) if param.present? }

  DRAFT_PARAMS = [
    :created_by, :letter_type_id, :registration_id, :deleted, :organization_id, :days_forward, :letter_type,
    :letter_date_override, :return_address_override, :header_id, :manual_creation, :vawa,
    {
      end_notes: [],
      enclosure_ids: [], 
      letter_type_attributes: LetterType::LETTER_TYPE_PARAMS, 
      representative_type_attributes: Contact::CONTACT_PARAMS,
      petitioner_type_attributes: Contact::CONTACT_PARAMS, 
      organization_attributes: Organization::ORGANIZATION_PARAMS,
      registration_attributes: Registration::REGISTRATION_PARAMS, 
      applicant_types_attributes: [Contact::CONTACT_PARAMS],
      contacts_attributes: [Contact::CONTACT_PARAMS]
    }
  ].freeze

  SUPPORTED_VARIABLES = ["[[[RECEIPT_NUMBER]]]", "[[[RECIPIENT_ADDRESS]]]", "[[[A_NUMBER_BARCODE]]]", "[[[RECEIPT_NUMBER_BARCODE]]]",
    "[[[DHS_SEAL]]]", "[[[ORGANIZATION_ADDRESS]]]", "[[[ORGANIZATION_NAME]]]", "[[[LETTER_DATE]]]", "[[[A_NUMBER]]]"].freeze

  LETTER_S3_BUCKET = 'LETTER_S3_BUCKET'.freeze

  def self.ransackable_attributes(_auth_object=nil)
    %w[starts_with ends_with]
  end

  def self.ransackable_associations(_auth_object=nil)
    ["sections"]
  end

  def self.letter_bucket
    ENV.fetch(LETTER_S3_BUCKET, nil)
  end

  def self.pdf_generator_base_url
    'http://pdf-generator:8080'.freeze
  end

  def as_json(options={})
    super(include: [:registration, :sections, :header, :enclosures,
                    { applicant_types: { include: [:address] },
                      letter_type: { include: [:form_types, :organizations] },
                      petitioner_type: { include: [:address] },
                      representative_type: { include: [:address] },
                      contacts: { methods: [:type, :errors], include: { address: { methods: [:errors] } } } },
                    { organization: { include: [:headers, { organization_signatures: { methods: [:signature_image_url, :encoded_signature] } },
                      { organization_address_xrefs: { include: :address } }] } },
                    :letter_category]).merge(options).merge(errors: errors.messages, endNotes: end_notes || [])
  end

  def has_primary?
    primary = applicant_types.detect { |contact| contact.primary_applicant == true }

    return primary if primary

    [petitioner_type, representative_type].each do |person|
      next if person.blank?

      primary = person if person.primary_applicant == true
      break if primary
    end

    primary
  end

  def assign_primary!
    return self if has_primary?

    assign_primary_applicant! || assign_primary_petitioner! || assign_primary_representative!
  end

  # Assign a primary applicant in this preferred order:
  #  - Has an address and an A-Number
  #  - Has an address
  #  - The first applicant
  # @return [Letter, nil]
  def assign_primary_applicant!
    return self if has_primary?
    # return nil if applicants.empty?
    return nil if applicant_types.empty?

    if (primary = applicant_types.find(&:has_mailable_address_and_a_number?))
      primary.primary_applicant = true
      return self
    end

    if (primary = applicant_types.find(&:has_mailable_address?))
      primary.primary_applicant = true
      return self
    end

    applicant_types.first.primary_applicant = true

    self
  end

  def assign_primary_petitioner!
    return self if has_primary?
    return nil if petitioner_type.blank?

    petitioner_type.primary_applicant = true

    self
  end

  def assign_primary_representative!
    return self if has_primary?
    return nil if representative_type.blank?

    representative_type.primary_applicant = true

    self
  end

  def assign_default_letter_recipients!
    if petitioner_type&.first_name.present?
      petitioner_type.letter_recipient = true
    else
      applicant_types[0]&.letter_recipient = true
    end

    return if representative_type&.firm_name.blank?

    representative_type.letter_recipient = true
  end

  def validate_for_printing
    letter_recipients = contacts.select(&:letter_recipient)
    if letter_recipients.empty?
      errors.add(:print, 'Missing Letter Recipient')
      return
    end
    letter_recipients.each(&:validate_for_printing)
    find_missing_variables
    find_placeholders
  end

  def a_number
    has_primary?&.a_number
  end

  private

  def combine_all_content
    contents = ''
    %w[row1_col1 row1_col2 row2_col1 row2_col2 row3_col1 row3_col2 starts_with ends_with].each do |content_attribute|
      contents += send(content_attribute) || ''
    end
    sections.each do |section|
      contents += section.text || ''
    end
    contents
  end

  def combine_all_sections
    contents = ''
    %w[starts_with ends_with].each do |content_attribute|
      contents += send(content_attribute) || ''
    end
    sections.each do |section|
      contents += section.text || ''
    end
    contents
  end

  def strip_images_from_content(content)
    strip_seal_content = content.gsub(/data-dhs-seal=".*?"/, 'data-dhs-seal=""')
    strip_image_content = strip_seal_content.gsub(/"[^"]*data:image[^"]*"/, '')
    strip_image_content.strip
  end

  def find_missing_variables
    regex = /\[\[\[.*?\]\]\]/
    matching_variables = []

    combine_all_content.scan(regex) { |match| matching_variables.push(match.upcase) }
    unique_matching_variables = matching_variables.uniq
    supported_variables = unique_matching_variables.filter.each { |uv| SUPPORTED_VARIABLES.include? uv }
    unsupported_variables = unique_matching_variables.filter.each { |uv| SUPPORTED_VARIABLES.exclude?(uv) }

    errors.add(:print, "Missing variable values for: #{supported_variables.to_sentence}") unless supported_variables.empty?
    errors.add(:print, "Unsupported variable found. Please replace: #{unsupported_variables.to_sentence}") unless unsupported_variables.empty?
  end

  def find_placeholders
    placeholder_regex = /(?i)xxx/

    cleaned_content = strip_images_from_content(combine_all_sections)
    matching_placeholders = cleaned_content.scan(placeholder_regex)

    return if matching_placeholders.empty?

    errors.add(:print, "You must resolve placeholder references (XXX) before printing the letter")
  end
end