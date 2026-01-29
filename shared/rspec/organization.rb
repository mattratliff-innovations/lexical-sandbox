class Organization < ApplicationRecord
  has_many :organization_signatures,   dependent: :restrict_with_exception, inverse_of: :organization

  has_many :user_organization_xrefs,   dependent: :destroy
  has_many :users,                     through:   :user_organization_xrefs
  has_many :organization_address_xrefs, dependent: :destroy
  has_many :addresses, through: :organization_address_xrefs, dependent: :destroy
  has_many :organization_letter_type_xrefs, dependent: :destroy
  has_many :letter_types, through: :organization_letter_type_xrefs
  has_many :headers, through: :organization_letter_type_xrefs
  has_many :form_types, -> { distinct }, through: :letter_types
  has_many :print_queues, dependent: :destroy

  has_many :organization_header_letter_type_xrefs, dependent: :destroy

  has_many :user_supervisions, dependent: :destroy, inverse_of: :organization

  # eProcessing excluded categories
  has_many :excluded_organization_letter_category_links,
           -> { AppSettingOrganizationLetterCategoryXref.for_excluded_organization_letter_categories },
           class_name: 'AppSettingOrganizationLetterCategoryXref',
           inverse_of: :organization,
           dependent: :destroy

  has_many :excluded_organization_letter_categories,
           through: :excluded_organization_letter_category_links,
           source: :letter_category

  # Scanned/Digital/Paper excluded categories
  has_many :excluded_organization_scanned_digital_paper_letter_category_links,
           -> { AppSettingOrganizationLetterCategoryXref.for_excluded_organization_scanned_digital_paper_letter_categories },
           class_name: 'AppSettingOrganizationLetterCategoryXref',
           inverse_of: :organization,
           dependent: :destroy

  has_many :excluded_organization_scanned_digital_paper_letter_categories,
           through: :excluded_organization_scanned_digital_paper_letter_category_links,
           source: :letter_category

  has_one :default_signature, -> { where(default: true) },
          class_name: 'OrganizationSignature',
          foreign_key: :organization_id,
          dependent: :restrict_with_exception,
          inverse_of: :organization

  validates :name, presence: true, uniqueness: true
  validates :code, presence: true, uniqueness: true

  normalizes :code, with: -> { it.upcase }

  accepts_nested_attributes_for :organization_address_xrefs
  accepts_nested_attributes_for :organization_letter_type_xrefs
  accepts_nested_attributes_for :organization_header_letter_type_xrefs

  scope :active, -> { where(active: true) }

  ORGANIZATION_PARAMS = [:id, :name, :active, :created_at, :updated_at].freeze

  def serializable_hash(options=nil)
    hash = super
    # super.merge("default_signature" => default_signature)
    hash["default_signature"] = default_signature
    hash
  end

  def as_show_json
    base = as_json(
      include: [
        :letter_types,
        {
          organization_signatures: { methods: :signature_image_url },
          organization_address_xrefs: { include: :address },
          organization_header_letter_type_xrefs: {
            include: {
              letter_type: { only: [:id, :name] },
              header: { only: [:id, :name] }
            }
          },
          excluded_organization_letter_categories: { only: %i[id name c3_letter_category_id] },
          excluded_organization_letter_category_links: { only: %i[id letter_category_id app_setting_id] },
          excluded_organization_scanned_digital_paper_letter_categories: { only: %i[id name c3_letter_category_id] },
          excluded_organization_scanned_digital_paper_letter_category_links: { only: %i[id letter_category_id app_setting_id] }
        }
      ]
    )

    base.merge(excluded_organization_letter_categories_payload)
  end

  def as_xrefs_result
    as_json(
      include: {
        letter_types: {},
        organization_signatures: { methods: :signature_image_url },
        organization_address_xrefs: { include: :address },
        organization_header_letter_type_xrefs: {
          include: {
            letter_type: { only: [:id, :name] },
            header: { only: [:id, :name] }
          },
          only: [:id]
        }
      }
    )
  end

  def removed_header_letter_type_xrefs(organization_params)
    # If only updating the address then the header letter type structure won't exist
    return [] unless organization_params['organization_header_letter_type_xrefs_attributes']

    organization_header_letter_type_xrefs.reject do |orgxref|
      organization_params['organization_header_letter_type_xrefs_attributes'].any? do |params|
        orgxref.id == params['id']
      end
    end
  end

  private

  def excluded_organization_letter_categories_payload
    {
      excluded_organization_letter_categories: excluded_eproc_payload,
      excluded_organization_scanned_digital_paper_letter_categories: excluded_sdp_payload
    }
  end

  def excluded_eproc_payload
    (excluded_organization_letter_categories || []).map do |c|
      {
        id: c.id,
        name: c.name,
        c3_letter_category_id: c.c3_letter_category_id
      }
    end
  end

  def excluded_sdp_payload
    (excluded_organization_scanned_digital_paper_letter_categories || []).map do |c|
      {
        id: c.id,
        name: c.name,
        c3_letter_category_id: c.c3_letter_category_id
      }
    end
  end
end
