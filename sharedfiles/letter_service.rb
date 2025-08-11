class LetterService
  RESULTS_MAX = 100
  SEARCH_BASE_INCLUDES = [:registration, :sections, :header, :applicant_types,
    :contacts, :organization_signature, :organization,
    { petitioner_type: [:address],
      representative_type: [:address],
      letter_type: [:form_types, :organizations] }].freeze

  SEARCH_ORGANIZATION_INCLUDES = {
    organization: [:organization_signatures, :default_signature, :headers, { organization_address_xrefs: [:address] }],
    applicant_types: [:address]
  }.freeze

  class << self
    def create_letter(letter_params:, standard_paragraph_ids:)
      draft = Letter.new(letter_params)
      draft.status = Status.find(Status::DRAFT)

      if draft.letter_type_id.present?
        letter_type = LetterType.find(draft.letter_type_id)
        organization = Organization.includes(:headers, :default_signature).find(letter_params["organization_id"])
        standard_paragraph_sections = build_standard_paragraph_sections(standard_paragraph_ids)
        create_letter_transaction(draft, letter_type, organization, standard_paragraph_sections)
      else
        draft.errors.add(:base, 'Letter type must exist')
      end
      draft
    end

    def search_letters(params:, admin_role:, user_org_ids:)
      start_date = params[:updated_at_start].present? ? params[:updated_at_start].in_time_zone.utc.beginning_of_day : params[:updated_at_start]
      end_date = params[:updated_at_end].present? ? params[:updated_at_end].in_time_zone.utc.end_of_day : params[:updated_at_end]
      search = build_base_search(start_date, end_date, params)
      search = add_full_text_to_search(params, search) if params[:full_text_search]

      return search if search == Letter.none

      user_orgs_search = build_user_orgs_search(start_date, end_date, user_org_ids, params)
      search = add_non_admin_limits_to_search(params, search, user_orgs_search) unless admin_role

      search.order(updated_at: :desc).limit(RESULTS_MAX).distinct
    end

    def add_non_admin_limits_to_search(params, search, user_orgs_search)
      if params[:status_id].present?
        # Only allow the user to see drafts they created
        search.where(created_by: IcamOidcAuthentication.parsed_jwt.username)
      else
        # ISOs may see their own drafts and any completed letters in their organizations.
        search.where(created_by: IcamOidcAuthentication.parsed_jwt.username,
                     status_id: Status::DRAFT).or(user_orgs_search.where(status_id: Status::COMPLETED_STATUSES))
      end
    end

    def add_full_text_to_search(params, search)
      letters = Letter.ransack(starts_with_or_ends_with_or_sections_text_cont: params[:full_text_search]).result

      return search.where(id: letters.pluck(:id)) if letters.pluck(:id).present?

      Letter.none
    end

    def build_base_search(start_date, end_date, params)
      base_query = Letter.joins(:letter_type, :registration).left_outer_joins(:contacts)
        .where(updated_at: start_date..end_date, deleted: false)

      # This calls all the search scopes on the Letter model
      add_letter_scopes(base_query, params)
    end

    # Returns a ActiveRecord::Relation:
    #   Between start and end date
    #   For the user_org_ids
    #   Not deleted
    #   And any other params
    def build_user_orgs_search(start_date, end_date, user_org_ids, params)
      base_query = Letter.joins(:letter_type, :registration).left_outer_joins(:contacts)
        .where(updated_at: start_date..end_date, deleted: false)

      query = add_letter_scopes(base_query, params)

      # Limit query to the user's orgs
      query.where(organization_id: [user_org_ids], deleted: false)
    end

    def add_letter_scopes(relation, params)
      relation = relation.receipt_number_search(params[:receipt_number])
      relation = relation.status_id_search(params[:status_id])
      relation = relation.organization_id_search(params[:organization_id])
      relation = relation.form_type_code_search(params[:form_type_code])
      relation = relation.alien_number_search(params[:alien_number])
      relation.letter_type_id_search(params[:letter_type])
    end

    def format_results_for_letter_search(results)
      results.map do |letter|
        { id: letter.id, receipt_number: letter.registration.receipt_number, form_type_name: letter.registration.form_type_name,
          status_id: letter.status_id, updated_at: letter.updated_at, created_at: letter.created_at,
          letter_date_override: letter.letter_date_override, letter_type_name: letter.letter_type.name, organization_name: letter.organization.name,
          created_by: letter.creator.full_name, a_number: letter.a_number, vawa: letter.vawa }
      end
    end

    def build_standard_paragraph_sections(standard_paragraph_ids)
      if standard_paragraph_ids.present?
        standard_paragraphs = StandardParagraph.where(id: standard_paragraph_ids)
        standard_paragraphs_sorted = standard_paragraph_ids.map { |id| standard_paragraphs.find { |item| item.id == id } }
        standard_paragraphs_sorted.map.with_index(0) do |paragraph, index|
          { order: index, text: paragraph.content, locked: paragraph.locked, _destroy: false }
        end
      else
        []
      end
    end

    private

    def concat_with_limit(str_1, str_2, limit=10)
      len_1 = [str_1.length, limit].min # Take as much of str1 up to limit
      len_2 = [limit - len_1, str_2.length].min # Fill remaining limit with str2
      str_1[0, len_1] + str_2[0, len_2]
    end

    # rubocop:disable Metrics/MethodLength
    def create_letter_transaction(letter, letter_type, organization, standard_paragraphs)
      header = organization.headers[0]
      locator_code_prefix = organization.code + concat_with_limit(letter.registration.form_type_name, letter_type.name)

      begin
        ActiveRecord::Base.transaction do
          letter.created_by = IcamOidcAuthentication.parsed_jwt.username
          letter.assigned = User.find_by(piv_upn: IcamOidcAuthentication.parsed_jwt.username)
          letter.days_forward = letter.organization.days_forward
          letter.starts_with = letter_type.starts_with
          letter.starts_with_locked = letter_type.starts_with_locked
          letter.ends_with = letter_type.ends_with
          letter.ends_with_locked = letter_type.ends_with_locked
          letter.margin_top = letter_type.margin_top
          letter.margin_left = letter_type.margin_left
          letter.margin_right = letter_type.margin_right
          letter.margin_bottom = letter_type.margin_bottom
          letter.row1_col1 = header.row1_col1
          letter.row1_col2 = header.row1_col2
          letter.row2_col1 = header.row2_col1
          letter.row2_col2 = header.row2_col2
          letter.row3_col1 = header.row3_col1
          letter.row3_col2 = header.row3_col2
          letter.header_id = header.id
          letter.assign_default_letter_recipients!
          letter.sections_attributes = standard_paragraphs
          letter.save!

          letter_locator_code = "#{locator_code_prefix}#{letter.id}S"
          letter.update!(locator_code: letter_locator_code)
        end
      rescue ActiveRecord::RecordInvalid => e
        letter.errors.add(:base, e.message)
      end
    end
    # rubocop:enable Metrics/MethodLength
  end
end
