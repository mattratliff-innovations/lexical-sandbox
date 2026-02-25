require 'json-schema'

class Api::Scribe::V1::LettersController < ApplicationController
  include LettersDateValidationConcern
  include LettersStrongParamsConcern # legacy strong-params; avoid using for new code
  include PermittedLetterParams

  # Read-only endpoints – permit View-Only and above
  before_action :authenticate_up_to_viewonly_permission!, only: [
    :index,
    :show,
    :letter_search,
    :letter_status,
    :correspondence_history
  ]

  # All write or admin endpoints – require creator and above
  before_action :authenticate_up_to_creator_permission!, only: [
    :create,
    :update,
    :update_letter_signature,
    :validate_and_fetch_scribe_data,
    :upload_pdf,
    :reassign_letter,
    :create_letter_from_echo,
    :submit_approval,
    :submit_disapproval,
    :send_for_review
  ]

  before_action :find_letter, only: [
    :update,
    :show,
    :update_letter_signature,
    :upload_pdf,
    :reassign_letter,
    :submit_approval,
    :submit_disapproval,
    :send_for_review
  ]

  before_action :set_modified_by, except: [:show]
  before_action :sanitize_vawa_letter_params, only: [:create]

  LETTER_INCLUDES = [
    :registration,
    :sections,
    :header,
    :source_system,
    { applicant_types: [:contact_address_xref, { address: :state }] },
    :petitioner_type,
    :contacts,
    :status,
    :representative_type,
    {
      letter_type: [
        { organizations: [:default_signature] }
      ],
      organization: [
        :organization_signatures,
        {
          organization_address_xrefs: [
            { address: :state }
          ]
        },
        {
          organization_header_letter_type_xrefs: [:letter_type, :header]
        }
      ]
    }
  ].freeze

  def index
    results = DraftLettersQuery.call(user: current_user)
    render json: results
  end

  def create
    return legacy_create unless FeatureFlag.enabled?(:new_letter_create)

    draft = Letters::CreateService.new(
      letter_params: permitted_letter_params,
      standard_paragraph_ids: params[:standard_paragraph_ids]
    ).call

    return render json: ErrorSerializer.for_record(draft), status: :unprocessable_content if draft.errors.any?

    render json: LetterSerializer.new(draft).serializable_hash, status: :created
  end

  # ECHO ENDPOINT
  # Creates a new letter using the parameters pass from echo (works with validate_and_fetch_scribe_data)
  def create_letter_from_echo
    create_letter(letter_params: echo_letter_params, echo: true)
  end

  # ECHO ENDPOINT
  # Determines if an organization has rolled over to Scribe yet.  Echo uses this to decide if Echo is creating the letter or Scribe.
  def validate_and_fetch_scribe_data # rubocop:disable Metrics/MethodLength
    required_params = [:network_id, :echo_org_id, :echo_lettertype_id, :echo_formtype_id]
    missing_params = required_params.select { |key| params[key].blank? }
    if missing_params.any?
      render json: { error: "Missing parameters: #{missing_params.join(', ')}" }, status: :bad_request
      return
    end

    result = LetterService.validate_and_fetch_scribe_data(
      network_id: params[:network_id],
      echo_org_id: params[:echo_org_id],
      echo_lettertype_id: params[:echo_lettertype_id],
      echo_formtype_id: params[:echo_formtype_id]
    )

    if result[:error]
      render json: { error: result[:error] }, status: result[:status]
    else
      render json: result[:data]
    end
  end

  def update
    @letter.update!(update_params)

    if params.dig(:letter, :end_notes).present?
      @letter.end_notes = params[:letter][:end_notes]
      @letter.save!
    end

    @letter.validate_for_printing
    render json: @letter
  end

  def show
    @letter.validate_for_printing
    render json: @letter
  end

  def update_letter_signature
    @letter.update!(update_signature_params)
    render json: @letter
  end

  def letter_search
    if valid_date_range?
      render json: LetterService.format_results_for_letter_search(
        LetterSearchService.search(filters: letter_search_params, user: current_user)
      )
    else
      render json: { error: "Invalid Date Range" }, status: :bad_request
    end
  end

  def letter_status
    render json: Status.order(name: :asc)
  end

  def upload_pdf
    draft = PdfLetterService.upload_pdf(letter: @letter, upload_pdf_params: upload_pdf_params, s3_client: Aws::S3::Client.new)

    render json: draft
  end

  def correspondence_history
    render json: LetterService.format_results_for_letter_search(
      LetterSearchService.search(filters: correspondence_history_params, user: current_user)
    )
  end

  def reassign_letter
    @letter.update!(reassign_letter_params)
    render json: @letter
  end

  def submit_approval
    @letter.submit_approval!
    render json: @letter
  end

  def submit_disapproval
    @letter.submit_disapproval!
    render json: @letter
  end

  def send_for_review
    @letter.submit_for_review!
    render json: @letter
  end

  private

  def find_letter
    @letter = Letter.includes(LETTER_INCLUDES)
      .left_outer_joins(organization: :organization_address_xrefs)
      .fetch_by_linking_id_or_uuid(params[:id])
  end

  def set_modified_by
    return unless @letter

    @letter.modified_by = current_user
  end

  def create_letter(letter_params:, standard_paragraph_ids: nil, echo: false) # rubocop:disable Metrics/MethodLength
    draft = LetterService.create_letter(
      letter_params: letter_params,
      standard_paragraph_ids: standard_paragraph_ids,
      echo: echo
    )

    if draft.errors.empty?
      if echo
        render json: draft.external_linking_id
      else
        draft_for_json = Letter.includes(LETTER_INCLUDES).find(draft.id)
        render json: draft_for_json
      end
    else
      errors = draft.errors.full_messages.join(', ')
      render json: { error: "Unable to create Draft Letter: #{errors}" }, status: :unprocessable_content
    end
  end

  def permitted_letter_params
    params.expect(letter: [*LETTER_PARAMS]).to_h
  end

  def legacy_create
    create_letter(
      letter_params: letter_params,
      standard_paragraph_ids: params[:standard_paragraph_ids],
      echo: false
    )
  end
end
