# frozen_string_literal: true

# --------------------------------------------------------------------------
# Letters::CreateService
#
# Primary orchestrator for “letter creation via API.”  It owns the sequence of
# steps, each delegated to a purpose-built helper in the Letters::Creation
# namespace.  No business rules live here—every rule belongs in a callback,
# validator, or assigner.
#
# Reasons to update this file
# • Add, remove, or reorder phases of the creation workflow
#   – introduce a new run_* helper that instantiates a new helper class
# • Insert an additional top-level validation step
# • Change initialization arguments for the helper classes
#
# Do NOT add attribute logic, database look-ups, or validations here.  Instead,
# extend the appropriate helper class under letters/creation/ or add a new
# helper in that directory.
# --------------------------------------------------------------------------
module Letters
  class CreateService
    def initialize(letter_params:, standard_paragraph_ids: [])
      @letter_params = letter_params

      run_pre_process

      @standard_paragraph_ids = Array(standard_paragraph_ids)
      @context = Letters::Creation::DraftContext.new(letter_params)
    end

    # -------------------------------------------------
    # Entry point
    # -------------------------------------------------
    def call
      validate_setup
      return letter if letter.errors.any?

      run_before_validate
      run_attribute_assignment
      finalize_letter
      run_after_create_callbacks
      letter
    end

    delegate :errors, to: :letter

    private

    delegate :user,
             :organization,
             :header,
             :source_system,
             :letter_type,
             :draft_status,
             to: :context

    attr_reader :letter_params, :standard_paragraph_ids, :context

    # -------------------------------------------------
    # Orchestration helpers
    # -------------------------------------------------
    def run_pre_process
      Letters::Creation::Callbacks::PreProcess
        .new(letter: letter, params: letter_params)
        .call
    end

    def run_before_validate
      Letters::Creation::Callbacks::BeforeValidate
        .new(
          letter: letter,
          params: letter_params,
          standard_paragraph_ids: standard_paragraph_ids,
          context: context
        ).call
    end

    def run_attribute_assignment
      Letters::Creation::AttributeAssigner
        .new(letter: letter, params: letter_params, context: context)
        .call
    end

    def run_after_create_callbacks
      Letters::Creation::Callbacks::AfterCreate.new(letter).call
    end

    # -------------------------------------------------
    # Validation helpers
    # -------------------------------------------------
    def validate_setup
      validate_registration
      validate_context
    end

    def validate_registration
      validator = Letters::Creation::RegistrationValidator.new(letter_params, letter)
      validator.call
      validator.errors.each { |msg| letter.errors.add(:base, msg) }
    end

    def validate_context
      return if context.valid?

      context.errors.each { |msg| letter.errors.add(:base, msg) }
    end

    # -------------------------------------------------
    # ActiveRecord draft instance
    # -------------------------------------------------
    def letter
      @letter ||= Letter.new(
        'letter_type_id' => letter_params['letter_type_id'] || letter_params['lettertype_uuid']
      )
    end

    def finalize_letter
      letter.validate
      return if letter.errors.any?

      letter.save!
    end
  end
end
