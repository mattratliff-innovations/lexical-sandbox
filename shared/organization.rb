class Organization < ApplicationRecord
  has_many :organization_signatures,   dependent: :restrict_with_exception, inverse_of: :organization

  # TODO: Remove
  has_many :organization_header_xrefs, dependent: :destroy
  has_many :headers,                   through:   :organization_header_xrefs

  has_many :user_organization_xrefs,   dependent: :destroy
  has_many :users,                     through:   :user_organization_xrefs
  has_many :organization_address_xrefs, dependent: :destroy
  has_many :addresses, through: :organization_address_xrefs, dependent: :destroy
  has_many :organization_letter_type_xrefs, dependent: :destroy
  has_many :letter_types, through: :organization_letter_type_xrefs
  has_many :form_types, -> { distinct }, through: :letter_types
  has_many :print_queues, dependent: :destroy

  # TODO: Remove
  belongs_to :header

  has_many :organization_header_letter_type_xrefs, dependent: :destroy

  has_many :user_supervisions, dependent: :destroy, inverse_of: :organization

  has_one :default_signature, -> { where({ default: true }) },
    class_name: 'OrganizationSignature', foreign_key: :organization_id, dependent: :restrict_with_exception, inverse_of: :organization

  validates :name, presence: true, uniqueness: true
  validates :code, presence: true, uniqueness: true

  before_validation :upcase_code

  accepts_nested_attributes_for :organization_address_xrefs
  accepts_nested_attributes_for :organization_letter_type_xrefs
  accepts_nested_attributes_for :organization_header_letter_type_xrefs

  scope :active, -> { where(active: true) }

  ORGANIZATION_PARAMS = [:id, :name, :active, :created_at, :updated_at].freeze

  def serializable_hash(options=nil)
    hash = super(options)
    # super.merge("default_signature" => default_signature)
    hash["default_signature"] = default_signature
    hash
  end

  def as_xrefs_result
  as_json(
    include: {
      letter_types: {},
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
    organization_header_letter_type_xrefs.reject do |orgxref|
      organization_params['organization_header_letter_type_xrefs_attributes'].any? do |params|
        orgxref.id == params['id']
      end
    end
  end

  private

  def upcase_code
    self.code = code.to_s.upcase if code.present?
  end

end
