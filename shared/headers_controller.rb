class Api::Scribe::V1::HeadersController < ApplicationController
  before_action :authenticate_up_to_creator_permission!, only: [
    :show,
    :active
  ]

  before_action :authenticate_up_to_templateadmin_permission!, only: [
    :create,
    :update
  ]

  before_action :authenticate_up_to_group_or_template_permission!, only: [
    :index,
    :available_headers_for_organization
  ]

  def index
    render json: Header.order(updated_at: :desc)
  end

  def create
    @header = Header.create(header_params)

    if @header.save
      render json: @header
    else
      errors = @header.errors.map(&:full_message).join(', ')
      errors = errors.gsub("Name", "Letter Header Name")

      render json: { error: "Unable to create Header: #{errors}" }, status: :unprocessable_content
    end
  end

  def show
    @header = Header.find(params[:id])
    render json: @header
  end

  def update
    @header = Header.find(params[:id])
    if @header.update(header_params)
      render json: @header
    else
      errors = @header.errors.map(&:full_message).join(', ')
      render json: { error: "Unable to edit Header: #{errors}" }, status: :unprocessable_content
    end
  end

  def available_headers_for_organization
    active_query = { active: true }

    result = if params[:organization_id]
               # Find headers that are associated with the letter type/headers in the organization
               Organization.eager_load(:organization_header_letter_type_xrefs)
                 .joins(:organization_header_letter_type_xrefs)
                 .where(organization_header_letter_type_xrefs: { organization_id: params[:organization_id] })
                 .where(active_query)
                 .distinct
                 .as_json(include: :organization_header_letter_type_xrefs)
             else
               Header.where(active_query)
             end

    render json: result
  end

  def active
    organization = Organization.find(params[:organization_id])

    # Get all headers associated with this organization through the xref table
    headers = Header.joins(:organization_header_letter_type_xrefs)
      .where(organization_header_letter_type_xrefs: { organization_id: organization.id })
      .where(active: true)
      .distinct
      .order(updated_at: :desc)

    render json: headers
  end

  private

  def header_params
    params.expect(header: [:id, :name, :row1_col1, :row1_col2, :row2_col1, :row2_col2, :row3_col1, :row3_col2,
                                   :active])
  end
end
