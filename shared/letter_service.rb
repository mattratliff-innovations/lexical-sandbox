class LetterService # rubocop:disable Metrics/ClassLength
  class << self
    def create_letter(letter_params:, standard_paragraph_ids: nil, echo: false)
      draft = initialize_draft(letter_params, echo)

      if draft.letter_type_id.present?
        letter_type = LetterType.find(draft.letter_type_id)

        if echo
          filing_type = determine_filing_type(letter_params["filing_type"])
          create_echo_letter(draft, letter_params, letter_type, filing_type)
        else
          create_scribe_letter(draft, letter_params, standard_paragraph_ids, letter_type)
        end
      else
        draft.errors.add(:base, 'Letter type must exist')
      end

      draft
    end

    def create_echo_letter(draft, letter_params, letter_type, filing_type) # rubocop:disable Metrics/MethodLength
      user = User.find_by(network_id: letter_params["network_id"])
      source_system = SourceSystem.find_by(code: letter_params["source_code"])

      unless user
        draft.errors.add(:base, "User with network_id '#{letter_params['network_id']}' not found")
        return draft
      end

      unless source_system
        draft.errors.add(:base, "Source System with code '#{letter_params['source_code']}' not found")
        return draft
      end

      organization = user.organizations.where(active: true).first
      create_transaction(letter: draft,
                         letter_type: letter_type,
                         organization: organization,
                         standard_paragraphs: nil,
                         filing_type: filing_type,
                         user: user,
                         source_system: source_system,
                         is_echo: true)
    end

    def create_scribe_letter(draft, letter_params, standard_paragraph_ids, letter_type)
      organization = Organization.includes(:headers).find(letter_params["organization_id"])
      standard_paragraph_sections = build_standard_paragraph_sections(standard_paragraph_ids)
      filing_type_attributes = letter_params["filing_type_attributes"]
      filing_type = FilingType.find_or_create_by!(name: filing_type_attributes['name']) if filing_type_attributes&.[]('name').present?
      source_system = SourceSystem.find_by(id: draft["source_system_id"])

      create_transaction(letter: draft,
                         letter_type: letter_type,
                         organization: organization,
                         standard_paragraphs: standard_paragraph_sections,
                         filing_type: filing_type,
                         user: nil,
                         source_system: source_system,
                         is_echo: false)
    end

    def update_letter_with_vawa_status(contact)
      letter = contact.letter
      return unless letter[:vawa] == false && contact[:vawa] == true

      letter[:vawa] = contact[:vawa]
      letter.save
    end

    def format_results_for_letter_search(results)
      preload_for_letter_search(results).map { |letter| letter_search_hash(letter) }
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

    def format_results_for_correspondence_history(results)
      preload_for_correspondence(results).map { |letter| correspondence_hash(letter) }
    end

    def validate_and_fetch_scribe_data(network_id:, echo_lettertype_id:, echo_formtype_id:)
      user = validate_user(network_id)
      return { error: "User does not have access to Scribe", status: :forbidden } unless user

      form_type = validate_form_type(echo_formtype_id)
      return { error: "Form type has not rolled over to Scribe", status: :unprocessable_entity } unless form_type

      letter_type = validate_letter_type(echo_lettertype_id)
      return { error: "Letter type not found for the given echo_lettertype_id", status: :not_found } unless letter_type

      organization = user.organizations.where(active: true).first
      return { error: "User does not have access to the organization", status: :no_access } unless organization

      return { error: 'Organization has not rolled over to Scribe', status: :unprocessable_entity } if organization && !organization.org_rolledover

      { data: { lettertype_uuid: letter_type.id, formtype_uuid: form_type.id } }
    end

    private

    def determine_filing_type(input_type)
      input_type ||= 'PAPER'
      FilingType.find_by(name: input_type)
    end

    def initialize_draft(params, echo)
      if echo
        form_type = FormType.find(params["formtype_uuid"])
        registration = Registration.find_by(receipt_number: params["receipt_num"], form_type_name: form_type.code)
        Letter.new({
          "letter_type_id" => params["lettertype_uuid"],
          "registration_id" => registration.id,
          status: Status.find_by(name: Status::DRAFT)
        })
      else
        params = params.except("network_id", "form_type_name", "receipt_number")
        Letter.new(params.merge(status: Status.find_by(name: Status::DRAFT)))
      end
    end

    def preload_for_letter_search(relation)
      relation.includes(
        :registration,
        :status,
        :letter_type,
        :organization,
        :applicant_types,
        :petitioner_type,
        :representative_type
      )
    end

    def preload_for_correspondence(relation)
      relation.includes(
        :registration,
        :letter_type,
        :organization,
        :status
      )
    end

    def letter_search_hash(letter)
      {
        id: letter.id,
        receipt_number: letter.registration.receipt_number,
        form_type_name: letter.registration.form_type_name,
        status_id: letter.status_id,
        status_name: letter.status.name,
        updated_at: letter.updated_at,
        created_at: letter.created_at,
        letter_date_override: letter.letter_date_override,
        letter_type_name: letter.letter_type.name,
        organization_name: letter.organization.name,
        created_by: letter.creator.full_name,
        a_number: letter.a_number,
        vawa: letter.vawa
      }
    end

    def correspondence_hash(letter)
      {
        id: letter.id,
        form_type_name: letter.registration.form_type_name,
        letter_type_name: letter.letter_type.name,
        organization_name: letter.organization.name,
        status_id: letter.status_id,
        updated_at: letter.updated_at
      }
    end

    def validate_organization(echo_org_id)
      organization = Organization.find_by(echo_org_id: echo_org_id)
      return nil unless organization&.org_rolledover

      organization
    end

    def validate_form_type(echo_formtype_id)
      form_type = FormType.find_by(echo_formtype_id: echo_formtype_id)
      return nil unless form_type&.ft_rolledover

      form_type
    end

    def validate_letter_type(echo_lettertype_id)
      letter_type = LetterType.find_by(echo_lettertype_id: echo_lettertype_id)
      return nil unless letter_type

      letter_type
    end

    def validate_user(network_id)
      user = User.find_by(network_id: network_id)
      return nil unless user

      user
    end

    def concat_with_limit(str_1, str_2, limit=10)
      len_1 = [str_1.length, limit].min # Take as much of str1 up to limit
      len_2 = [limit - len_1, str_2.length].min # Fill remaining limit with str2
      str_1[0, len_1] + str_2[0, len_2]
    end

    def create_transaction(letter:, letter_type:, organization: nil, user: nil, # rubocop:disable Metrics/ParameterLists
      source_system: nil, standard_paragraphs: nil, filing_type: nil, is_echo: false)
      header = organization.headers[0]
      locator_code_prefix = organization.code + concat_with_limit(letter.registration.form_type_name, letter_type.name)

      ActiveRecord::Base.transaction do
        assign_common_attributes(letter, letter_type, organization, user, source_system, is_echo, header)
        assign_additional_attributes(letter, standard_paragraphs, filing_type, is_echo)
        save_and_update_locator_code(letter, locator_code_prefix)
      end
    rescue ActiveRecord::RecordInvalid => e
      letter.errors.add(:base, e.message)
    end

    def assign_common_attributes(letter, letter_type, organization, user, source_system, is_echo, header) # rubocop:disable Metrics/MethodLength
      letter.created_by = is_echo ? user.piv_upn : IcamOidcAuthentication.parsed_jwt.username
      letter.assigned = is_echo ? user : User.find_by(piv_upn: IcamOidcAuthentication.parsed_jwt.username)
      letter.organization = organization
      letter.days_forward = is_echo ? 0 : letter.organization.days_forward
      letter.starts_with = letter_type.starts_with
      letter.starts_with_locked = is_echo ? false : letter_type.starts_with_locked
      letter.ends_with = letter_type.ends_with
      letter.ends_with_locked = is_echo ? false : letter_type.ends_with_locked
      letter.margin_top = letter_type.margin_top
      letter.margin_left = letter_type.margin_left
      letter.margin_right = letter_type.margin_right
      letter.margin_bottom = letter_type.margin_bottom
      letter.source_system = source_system
      letter.row1_col1 = header.row1_col1
      letter.row1_col2 = header.row1_col2
      letter.row2_col1 = header.row2_col1
      letter.row2_col2 = header.row2_col2
      letter.row3_col1 = header.row3_col1
      letter.row3_col2 = header.row3_col2
      letter.header_id = header.id
      letter.assign_default_letter_recipients!
    end

    def assign_additional_attributes(letter, standard_paragraphs, filing_type, is_echo)
      return if is_echo

      letter.sections_attributes = standard_paragraphs
      letter.filing_type = filing_type if filing_type
    end

    def save_and_update_locator_code(letter, locator_code_prefix)
      letter.save!
      letter_locator_code = "#{locator_code_prefix}#{letter.id}S"
      letter.update!(locator_code: letter_locator_code)
    end
  end
end
