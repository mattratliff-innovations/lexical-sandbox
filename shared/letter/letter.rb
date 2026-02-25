# frozen_string_literal: true

class Letter < ApplicationRecord # rubocop:disable Metrics/ClassLength
  include AASM
  include StateMachineConcern
  include StateMachineLogsConcern
  include SearchScopes
  include MainCopyConcern

  # Letter specific helpers
  include Letter::PrintingConcern
  include Letter::SourceSystemConcern

  belongs_to :letter_type
  belongs_to :registration
  belongs_to :organization
  belongs_to :letter_category_hac, optional: true
  belongs_to :filing_type, optional: true
  belongs_to :source_system, optional: true # TODO: should this be optional?
  belongs_to :class_preference, optional: true

  has_many :contacts, dependent: :destroy
  has_many :contact_address_xrefs, through: :contacts
  has_many :addresses, through: :contacts
  has_many :sections, dependent: :destroy
  has_many :form_types, through: :letter_type

  has_many :letter_copies, dependent: :destroy
  has_many :letter_publications, inverse_of: :letter, dependent: :destroy

  has_many :letter_enclosure_xrefs, dependent: :destroy
  has_many :enclosures, through: :letter_enclosure_xrefs, inverse_of: :letters

  # Contact STI Models
  has_many :applicant_types, dependent: :destroy
  has_one :petitioner_type, dependent: :destroy
  has_one :representative_type, dependent: :destroy

  has_one :letter_print_queue_xref, dependent: :destroy
  has_one :print_queue, through: :letter_print_queue_xref, dependent: :destroy

  has_one :letter_category, through: :letter_type

  has_one  :main_copy_contact,      -> { where(main_copy: true)     }, class_name: 'Contact', inverse_of: :letter, dependent: :destroy
  has_many :courtesy_copy_contacts, -> { where(courtesy_copy: true) }, class_name: 'Contact', inverse_of: :letter, dependent: :destroy

  has_many :comments, dependent: :destroy, inverse_of: :letter
  has_many :response_logs, class_name: 'Kafka::ResponseLog', dependent: :nullify, inverse_of: :letter
  has_many :status_logs, class_name: 'LetterStatusLog', inverse_of: :letter, dependent: :destroy

  belongs_to :header, optional: true
  belongs_to :organization_signature, optional: true
  belongs_to :status, optional: true

  belongs_to :creator, class_name: 'User', foreign_key: 'created_by', primary_key: 'piv_upn', inverse_of: :letters
  belongs_to :assigned, class_name: 'User', foreign_key: 'assigned_to_id', primary_key: 'id', inverse_of: :assigned_letters
  belongs_to :modified_by, class_name: 'User', primary_key: 'id', inverse_of: :modified_letters, optional: true

  before_validation :set_is_bcu, on: :create

  before_create :assign_category_hac_id

  accepts_nested_attributes_for :sections, allow_destroy: true
  accepts_nested_attributes_for :registration
  accepts_nested_attributes_for :letter_type

  accepts_nested_attributes_for :contacts, allow_destroy: true
  accepts_nested_attributes_for :applicant_types, allow_destroy: true
  accepts_nested_attributes_for :petitioner_type, allow_destroy: true
  accepts_nested_attributes_for :representative_type, allow_destroy: true
  accepts_nested_attributes_for :enclosures, allow_destroy: true
  accepts_nested_attributes_for :filing_type

  validates :created_by, presence: true
  validates :vawa, inclusion: { in: [true, false] }

  scope :completed, -> { where(aasm_state: Letter.completed_statuses) }

  def self.fetch_by_linking_id_or_uuid(id)
    id.to_s.match?(/^[0-9]{9}$/) ? find_by!(external_linking_id: id.to_i) : find(id)
  end

  #   ,_,
  #  (O,O)   << STOP >>
  #  (   )   These PARAM constants support the legacy create-letter path.
  #   " "    If you change them, also update PermittedLetterParams::LETTER_PARAMS.

  ECHO_LETTER_PARAMS = [
    :network_id, :org_uuid, :source_code, :formtype_uuid, :lettertype_uuid,
    {
      filing_type_attributes: FilingType::FILING_TYPE_PARAMS,
      registration_attributes: Registration::REGISTRATION_PARAMS
    }
  ].freeze

  LETTER_PARAMS = [
    :created_by, :assigned_to_id, :letter_type_id, :registration_id, :deleted, :organization_id, :days_forward, :letter_type,
    :letter_date_override, :return_address_override, :header_id, :manual_creation, :vawa, :filing_type_id, :source_system_id,
    :letter_category_hac_id, :class_preference_id, :row1_col1, :row1_col2, :row2_col1, :row2_col2, :row3_col1, :row3_col2,

    {
      end_notes: [],
      enclosure_ids: [],
      letter_publication_ids: [],
      letter_type_attributes: LetterType::LETTER_TYPE_PARAMS,
      representative_type_attributes: Contact::CONTACT_PARAMS,
      petitioner_type_attributes: Contact::CONTACT_PARAMS,
      organization_attributes: Organization::ORGANIZATION_PARAMS,
      registration_attributes: Registration::REGISTRATION_PARAMS,
      applicant_types_attributes: [Contact::CONTACT_PARAMS],
      contacts_attributes: [Contact::CONTACT_PARAMS],
      filing_type_attributes: FilingType::FILING_TYPE_PARAMS,
      letter_publications: LetterPublication::LETTER_PUBLICATION_PARAMS
    }
  ].freeze

  LETTER_S3_BUCKET = 'LETTER_S3_BUCKET'

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
    'http://pdf-generator:8080'
  end

  def as_json(options={}) # rubocop:disable Metrics/MethodLength
    super(include: [:registration, :sections, :header, :enclosures, :status, :creator, :source_system,
                    { filing_type: { only: [:id, :name] } },
                    { applicant_types: { include: [:address] },
                      letter_type: { include: [:organizations] },
                      petitioner_type: { include: [:address] },
                      representative_type: { include: [:address] },
                      contacts: { methods: [:type, :errors], include: { address: { methods: [:errors] } } } },
                    { organization: {
                      include: [
                        { organization_header_letter_type_xrefs: { include: [:letter_type, :header] } },
                        { organization_signatures: { methods: [:signature_image_url, :encoded_signature] } },
                        { organization_address_xrefs: { include: :address } }
                      ]
                    } },
                    :letter_category]).merge(options).merge(errors: errors.messages, endNotes: end_notes || [],
                                                            may_submit_to_central_print: may_submit_to_central_print?,
                                                            form_type: form_type&.as_json,
                                                            class_preference: class_preference&.as_json,
                                                            leaves_central_print_queue_at: central_print_queue_expires_at)
  end

  def form_type
    return unless registration

    FormType.find_by(code: registration.form_type_name)
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

  def a_number
    has_primary?&.a_number
  end

  def infer_locator_code
    return unless persisted?

    organization.code + concat_with_limit(registration.form_type_name, letter_type.name) + id
  end

  def all_printed?
    letter_copies.where.not(status: :centralprint_sent_printed).none?
  end

  def assign_letter_date
    return self if letter_date.present?

    if letter_date_override
      self.letter_date = letter_date_override
      return self
    end

    self.letter_date = default_letter_date

    self
  end

  def default_letter_date
    ::BusinessDay.days_ahead(organization.days_forward || 0)
  end

  def self.completed_statuses
    %w[centralprint_completed centralprint_stacks_completed individualprint_complete individualprint_stacks_completed stacks_complete]
  end

  def assign_category_hac_id
    return if letter_category_hac_id.present? || letter_category.name == "Request for Evidence"

    self.letter_category_hac = letter_category.letter_category_hacs.first
  end

  private

  def concat_with_limit(str_1, str_2, limit=10)
    str_1_part = str_1[0, limit]
    str_1_part + str_2[0, limit - str_1_part.length]
  end

  def set_is_bcu
    self.is_bcu = letter_type&.is_bcu
  end
end
