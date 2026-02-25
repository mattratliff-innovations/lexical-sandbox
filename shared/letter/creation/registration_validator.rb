# frozen_string_literal: true

# --------------------------------------------------------------------------
# Letters::Creation::RegistrationValidator
#
# Handles all registration-related checks for the create-letter workflow.
# • Fills in a missing form_type_name on incoming registration_attributes
#   when the formtype UUID is already available.
# • Ensures that registration data is present in the request payload or
#   already attached to the draft; otherwise records a friendly error.
#
# Reasons to update this file
# • Add new fields that must be auto-populated on registration_attributes.
# • Tighten or relax the rule that decides when a registration is considered
#   “provided.”
# • Change the user-facing error message for missing registration.
#
# When you change behaviour here, update
# spec/services/letters/creation/registration_validator_spec.rb accordingly
# with single-expectation examples for both the success and failure paths.
# --------------------------------------------------------------------------
module Letters
  module Creation
    class RegistrationValidator
      attr_reader :errors

      def initialize(params, draft)
        @params = params
        @draft  = draft
        @errors = []
      end

      # -------------------------------------------------
      # Entry point
      # -------------------------------------------------
      def call
        populate_form_type_name
        ensure_registration
        errors.empty?
      end

      private

      attr_reader :params, :draft

      # -------------------------------------------------
      # Attribute population
      # -------------------------------------------------
      def populate_form_type_name
        return if params['formtype_uuid'].blank?

        reg_attrs = params['registration_attributes']
        return unless reg_attrs.is_a?(Hash)

        ft = FormType.find_by(id: params['formtype_uuid'])
        reg_attrs['form_type_name'] ||= ft&.name
      end

      # -------------------------------------------------
      # Presence validation
      # -------------------------------------------------
      def ensure_registration
        return if params['registration_attributes'].present?
        return if draft.registration.present?

        errors << 'Registration not provided'
      end
    end
  end
end
