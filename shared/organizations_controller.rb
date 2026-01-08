class Api::Scribe::V1::OrganizationsController < ApplicationController
  before_action :authenticate_up_to_superadmin_permission!, only: %i[
    create
  ]

  before_action :authenticate_up_to_supervisor_permission!, only: %i[
    available_organizations_for_user
  ]

  before_action :authenticate_up_to_groupadmin_permission!, only: %i[
    update
    default_address
  ]

  before_action :authenticate_up_to_group_or_template_permission!, only: %i[
    index
    show
  ]

  before_action :verify_group_admin_org_access!, only: %i[
    update
    default_address
  ]

  before_action :authenticate_up_to_creator_permission!, only: [
    :available_organization_header_letter_type
  ]

  def index
    render json: Organization.includes([:default_signature]).order(name: :asc)
  end

  def create
    org_params = activate_default_address(organization_params)
    @organization = Organization.create(org_params)

    if @organization.save
      render json: organization.as_xrefs_result
    else
      errors = @organization.errors.map(&:full_message).join(', ')
      errors = errors.gsub("Name", "Organization Name")
      render json: { error: "Unable to create Organization: #{errors}" }, status: :unprocessable_content
    end
  end

  def show
    organization = Organization.find(params[:id])
    puts organization.as_xrefs_result
    render json: organization.as_xrefs_result
    # @organization = Organization.includes(
    #   :letter_types,
    #   :organization_signatures,
    #   { organization_address_xrefs: { address: %i[state country] } }
    # ).find(params[:id])

    # render json: @organization.as_json(
    #   include: [
    #     :letter_types,
    #     {
    #       organization_signatures: { methods: :signature_image_url },
    #       organization_address_xrefs: { include: :address }
    #     }
    #   ]
    # )
  end

  def update
    organization = Organization.find(params[:id])

    ActiveRecord::Base.transaction do
      organization.removed_header_letter_type_xrefs(organization_params).each do |entry|
        spxref = OrganizationHeaderLetterTypeXref.find(entry['id'])
        spxref.destroy
      end

      if organization.update(organization_params)
        render json: organization.as_xrefs_result
      else
        errors = organization.errors.map(&:full_message).join(', ')
        # errors = errors.gsub("Code", "Paragraph Code")
        render json: { error: "Unable to edit Organization: #{errors}" }, status: :unprocessable_content
      end
    end
    # @organization = Organization.includes(organization_address_xrefs: [:address]).find(params[:id])
    # org_params = activate_default_address(organization_params)
    # if @organization.update(org_params)
    #   render json: @organization.to_json(include: [:letter_types, { organization_signatures: { methods: :signature_image_url },
    #                                                                 organization_address_xrefs: { include: :address } }])
    # else
    #   errors = @organization.errors.map(&:full_message).join(', ')
    #   render json: { error: "Unable to edit Organization: #{errors}" }, status: :unprocessable_content
    # end
  end

  def available_organization_header_letter_type
    available_organizations = Organization.includes(:organization_header_letter_type_xrefs, :headers, :letter_types).where(
      organization_header_letter_type_xrefs: {
        letter_types: { id: params[:letter_type_id] },
        headers: { code: params[:header_id] }
      }
    )
    render json: available_organizations
  end

  def default_address
    organization = Organization.find(params[:id])
    updated_organization = OrganizationService.update_default_address(organization: organization, organization_params: organization_params)
    render json: updated_organization.to_json(include: { organization_signatures: { methods: :signature_image_url },
                                                         organization_address_xrefs: { include: :address } })
  end

  def available_organizations_for_user
    api_results = AvailableOrganizationsForUserService.call(current_user, params[:user_id])

    render json: api_results
  end

  private

  def organization_params
    params.expect(organization: [
                    :id, :name, :active, :days_forward, :code, :occ, :header_id,
                    { letter_type_ids: [],
                      organization_address_xrefs_attributes: [[
                        :id, :premium_processing, :active, :default,
                        {
                          address_attributes: [
                            :id, :street, :apt_suite_floor, :city, :state_id, :zip_code, :type, :nickname, :pre_address
                          ]
                        }
                      ]]
                    },
                    { organization_header_letter_type_xrefs_attributes: [[:id, :letter_type_id, :header_id]] }
                  ])
  end

  def activate_default_address(org_params)
    # Ensure default address is active
    org_params["organization_address_xrefs_attributes"]&.each do |address|
      address["active"] = true if address["default"] == true
    end
    org_params
  end

  def verify_group_admin_org_access!
    return unless current_user.is_groupadmin?

    org_id = params[:id].to_i
    return if current_user.organization_ids.include?(org_id)

    head :forbidden
  end
end
