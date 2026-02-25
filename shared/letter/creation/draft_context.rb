# frozen_string_literal: true

# --------------------------------------------------------------------------
# Letters::Creation::DraftContext
#
# Central look-up and validation object for the create-letter workflow.
# It resolves the user, organization, header, source-system, letter-type,
# and draft status, and gathers any related setup errors in one place.
#
# Reasons to update this file
# • Add a new required association or reference lookup needed before building
#   a draft (e.g., a new mandatory model relationship).
# • Change the business rule that determines whether a lookup is considered
#   “valid” and what error message should be surfaced.
# • Expose a new reader method for CreateService or other helpers.
#
# When you add a new lookup or rule here, update the corresponding spec in
# spec/services/letters/creation/draft_context_spec.rb to cover the success
# and failure cases with single-expectation examples.
# --------------------------------------------------------------------------
module Letters
  module Creation
    class DraftContext
      attr_reader :errors

      def initialize(params)
        @params  = params
        @errors  = []
      end

      def valid?
        collect_errors!

        errors.empty?
      end

      # -------------------------------------------------
      # Lookup helpers
      # -------------------------------------------------
      def user
        @user ||= User.find_by(network_id: params['network_id']) ||
                  User.find_by(piv_upn: IcamOidcAuthentication.parsed_jwt.username)
      end

      def organization
        @organization ||= Organization.find_by(id: params['organization_id'])
      end

      def header
        return nil unless header_required?
        return nil unless organization && letter_type

        OrganizationHeaderLetterTypeXref.find_header_by(organization: organization, letter_type: letter_type) ||
          organization.default_header
      end

      def source_system
        @source_system ||= SourceSystem.find_by(source_system_key => source_system_identifier)
      end

      def letter_type
        @letter_type ||= LetterType.find_by(id: params['lettertype_uuid'] || params['letter_type_id'])
      end

      def draft_status
        @draft_status ||= Status.find_by(name: Status::DRAFT)
      end

      def class_preference
        @class_preference ||= ClassPreference.find_by(id: params['class_preference_id'])
      end

      private

      attr_reader :params

      def header_required?
        letter_type&.header_included
      end

      # -------------------------------------------------
      # Validation / error aggregation
      # -------------------------------------------------
      def collect_errors! # rubocop:disable Metrics/CyclomaticComplexity
        errors << 'User not found' unless user
        errors << 'Active organization not found for user' unless organization

        errors << 'Header required but not found for letter' if header_required? && !header

        errors << "Source System with #{source_system_key} '#{source_system_identifier}' not found" unless source_system

        errors << 'Letter type not found' unless letter_type
        errors << 'Draft status not found' unless draft_status
      end

      # -------------------------------------------------
      # Utility helpers
      # -------------------------------------------------
      def source_system_identifier
        params['source_system_id'] || params['source_code']
      end

      def source_system_key
        params['source_system_id'].present? ? :id : :code
      end
    end
  end
end
