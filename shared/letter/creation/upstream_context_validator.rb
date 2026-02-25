# frozen_string_literal: true

# --------------------------------------------------------------------------
# Letters::Creation::UpstreamContextValidator
#
# Validates incoming “echo_*” identifiers from an upstream system before a
# letter draft is created.  It resolves those external IDs to internal UUIDs
# and surfaces every applicable error, allowing the caller to display a
# complete list of synchronization issues.
#
# What it does
# • Confirms the user exists and belongs to an active, rolled-over organization.
# • Confirms the referenced form type has rolled over.
# • Confirms the referenced letter type exists.
# • Exposes the resolved UUIDs via reader methods.
#
# Reasons to update this file
# • Add or remove validation rules related to upstream data.
# • Change wording of error messages shown to API consumers.
# • Include additional data points that need to be resolved (and expose
#   matching *_uuid readers).
#
# When behaviour changes, update
# spec/services/letters/creation/upstream_context_validator_spec.rb
# with single-expectation examples for both success and every failure case.
# --------------------------------------------------------------------------
module Letters
  module Creation
    class UpstreamContextValidator
      attr_reader :errors

      def initialize(params)
        @params  = params
        @errors  = []
      end

      delegate :id, to: :organization, prefix: true, allow_nil: true

      def valid?
        return true unless external_check_required?

        collect_errors!
        errors.empty?
      end

      def lettertype_uuid
        letter_type&.id
      end

      def formtype_uuid
        form_type&.id
      end

      private

      attr_reader :params

      # -------------------------------------------------
      # Lookup helpers
      # -------------------------------------------------
      def user
        @user ||= User.find_by(network_id: params['network_id'])
      end

      def organization
        @organization ||= Organization.find_by(echo_org_id: params['echo_org_id'])
      end

      def form_type
        @form_type ||= FormType.find_by(echo_formtype_id: params['echo_formtype_id'])
      end

      def letter_type
        @letter_type ||= LetterType.find_by(echo_lettertype_id: params['echo_lettertype_id'])
      end

      # -------------------------------------------------
      # Validation predicates
      # -------------------------------------------------
      def organization_rolled_over?
        organization&.org_rolledover
      end

      def form_type_rolled_over?
        form_type&.ft_rolledover
      end

      def external_check_required?
        params['echo_lettertype_id'] || params['echo_formtype_id'] || params['echo_org_id'].present?
      end

      # -------------------------------------------------
      # Error aggregation
      # -------------------------------------------------
      def collect_errors!
        errors << 'User does not have access to Scribe' unless user

        if organization
          errors << 'Organization has not rolled over to Scribe' unless organization_rolled_over?
        else
          errors << 'Organization not found for the given external identifier'
        end

        errors << 'Form type has not rolled over to Scribe' unless form_type_rolled_over?
        errors << 'Letter type not found for the given external identifier' unless letter_type
      end
    end
  end
end
