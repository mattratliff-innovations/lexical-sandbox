class Api::Scribe::V1::LettersController < ApplicationController
  before_action :authenticate_up_to_iso_permission!

  before_action :find_letter, only: [:update, :show, :update_letter_signature, :update_status, :upload_pdf]
  before_action :sanitize_vawa_letter_params, only: [:create]

  LETTER_INCLUDES = [
    :registration,
    :sections,
    :header,
    :applicant_types,
    :petitioner_type,
    :contacts,
    :organization_signature,
    :representative_type,
    { letter_type: [:form_types, { organizations: [:default_signature] }],
      organization: [:headers, :organization_signatures, { organization_address_xrefs: [:address] }] }
  ].freeze

  MAX_DATE_RANGE_DAYS = 366

  def index
    puts '*************** IN INDEX:'
    draft_list = Letter.joins(:registration, :letter_type, :organization)
      .select('letters.id, registrations.receipt_number, registrations.form_type_name, letters.status_id, ' \
    'letters.updated_at, letters.created_at, organizations.name as organization_name, letter_types.name as letter_type_name')
      .where(assigned: current_user, deleted: false, status_id: Status::DRAFT)
      .order(updated_at: :desc)

    results = draft_list.map do |result|
      { id: result.id, receipt_number: result.receipt_number, form_type_name: result.form_type_name, status_id: result.status_id,
        updated_at: result.updated_at, created_at: result.created_at, organization_name: result.organization_name,
        letter_type_name: result.letter_type_name }
    end

    puts '************************************'
    puts results
    render json: results
  end

  def create
    draft = LetterService.create_letter(letter_params: letter_params, standard_paragraph_ids: params[:standard_paragraph_ids])
    if draft.errors.empty?
      # Requery to get associations
      draft_for_json = Letter.includes(LETTER_INCLUDES).find(draft.id)

      render json: draft_for_json
    else
      errors = draft.errors.map(&:full_message).join(', ')

      render json: { error: "Unable to create Draft Letter: #{errors}" }, status: :unprocessable_entity
    end
  end

  def update
    @letter.update!(update_params)

    @letter.validate_for_printing

    render json: @letter
  end

  def show
    @letter.validate_for_printing
    render json: @letter
  end

  def destroy
    # soft delete
    draft = Letter.find_by!(id: params[:id], created_by: IcamOidcAuthentication.parsed_jwt.username)
    draft.status = Status.find(Status::DELETED)
    draft.save!
    render json: draft.attributes
  end

  def update_letter_signature
    @letter.update!(update_signature_params)
    render json: @letter
  end

  def update_status
    @letter.update!(update_status_params)
    render json: @letter
  end

  def letter_search
    if valid_date_range?
      render json: LetterService.format_results_for_letter_search(
        LetterService.search_letters(params: letter_search_params, admin_role: admin?, user_org_ids: current_user.organizations.pluck(:id))
      )
    else
      render json: { error: "Invalid Date Range" }, status: :bad_request
    end
  end

  def letter_status
    render json: Status.order(id: :asc)
  end

  def upload_pdf
    draft = PdfLetterService.upload_pdf(letter: @letter, html_letter: upload_pdf_params, s3_client: Aws::S3::Client.new)

    render json: draft
  end

  private

  def update_params
    params.expect(letter: [
                    :starts_with, :ends_with, :organization_signature_id,
      :letter_date_override, :letter_type_id, :return_address_override, :row1_col1, :row1_col2,
      :row2_col1, :row2_col2, :row3_col1, :row3_col2, :header_id,
      {
        end_notes: [],
        enclosure_ids: [],
        sections_attributes: [[:id, :order, :text, :_destroy]],
        enclosures_attributes: [[:id, :_destroy]]
      }
                  ])
  end

  def update_signature_params
    params.expect(letter: [:organization_signature_id])
  end

  def letter_params
    params.expect(letter: Letter::DRAFT_PARAMS)
  end

  def sanitize_vawa_letter_params
    sanitize_letter_vawa_attribute
    sanitize_petitioner_type_vawa_attribute
    sanitize_applicant_types_vawa_attribute
  end

  def sanitize_letter_vawa_attribute
    return unless params[:letter][:vawa]&.nil?

    params[:letter][:vawa] = false
  end

  def sanitize_petitioner_type_vawa_attribute
    petitioner_attrs = params[:letter][:petitioner_type_attributes]
    return unless petitioner_attrs && petitioner_attrs[:vawa].nil?

    petitioner_attrs[:vawa] = false
  end

  def sanitize_applicant_types_vawa_attribute
    # Handles ActionController interpretation of empty arrays
    if params[:letter][:applicant_types_attributes].present? &&
       params[:letter][:applicant_types_attributes] != [""]

      params[:letter][:applicant_types_attributes]&.each do |applicant|
        applicant[:vawa] = false if applicant[:vawa].nil?
      end
    end
  end

  def update_status_params
    params.expect(letter: [:status_id])
  end

  def upload_pdf_params
    params.require(:html_letter)
  end

  def letter_search_params
    params.expect(letter: [:receipt_number, :organization_id, :form_type_code, :alien_number, :status_id, :letter_type, :updated_at_start,
:updated_at_end, :full_text_search])
  end

  def find_letter
    @letter = Letter.includes(LETTER_INCLUDES).left_outer_joins(organization: :organization_address_xrefs).find(params[:id])
    puts @letter
  end

  def valid_date_range?
    return false if letter_search_params[:updated_at_start].blank?
    return false if letter_search_params[:updated_at_end].blank?

    # Handle invalid formats
    begin
      start_date = DateTime.strptime(letter_search_params[:updated_at_start], "%Y-%m-%d")
      end_date = DateTime.strptime(letter_search_params[:updated_at_end], "%Y-%m-%d")
    rescue ArgumentError
      return false
    end

    return false if end_date < start_date
    return false if future_date_range?(start_date, end_date)
    return false if max_date_range_exceeded?(start_date, end_date)

    true
  end

  def future_date_range?(start_date, end_date)
    today = DateTime.now
    end_date > today || start_date > today
  end

  def max_date_range_exceeded?(start_date, end_date)
    days_apart = end_date - start_date
    days_apart.to_i > MAX_DATE_RANGE_DAYS
  end
end