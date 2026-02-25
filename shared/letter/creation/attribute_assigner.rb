# frozen_string_literal: true

# --------------------------------------------------------------------------
# Letters::Creation::AttributeAssigner
#
# Builds the complete attribute hash for a draft letter and assigns it in one
# shot.  Combines data from:
#   • DraftContext look-ups (organization, letter_type, etc.)
#   • Request payload (pass-thru keys)
#   • Simple derived rules (created_by, days_forward, locked flags, filing_type)
#
# Reasons to update this file
# • Add a new pass-thru key—append it to PASS_THRU_KEYS.
# • Introduce or change a derived rule (e.g., a different days_forward rule).
# • Support a new attribute coming from DraftContext or another helper.
#
# When you change behaviour here, update
# spec/services/letters/creation/attribute_assigner_spec.rb
# to cover the new success and edge cases with single-expectation examples.
# --------------------------------------------------------------------------
module Letters
  module Creation
    class AttributeAssigner
      PASS_THRU_KEYS = %w[
        manual_creation
        vawa
        deleted
        letter_category_hac_id
        assigned_to_id
        letter_date_override
        return_address_override
        end_notes
        enclosure_ids
        last_decision_date
      ].freeze

      def initialize(letter:, params:, context:)
        @letter  = letter
        @params  = params
        @context = context
      end

      # -------------------------------------------------
      # Entry point
      # -------------------------------------------------
      def call
        letter.assign_attributes(core_attributes)
      end

      private

      attr_reader :letter, :params, :context

      # -------------------------------------------------
      # Core attribute hash
      # -------------------------------------------------
      def core_attributes
        {
          organization: context.organization,
          registration: letter.registration,
          status: context.draft_status,
          created_by: created_by,
          assigned: assigned_user,
          days_forward: days_forward,
          starts_with: context.letter_type&.starts_with,
          starts_with_locked: starts_with_locked,
          ends_with: context.letter_type&.ends_with,
          ends_with_locked: ends_with_locked,
          source_system: context.source_system,
          filing_type: filing_type,
          class_preference: context.class_preference
        }.merge(params.slice(*PASS_THRU_KEYS))
      end

      # -------------------------------------------------
      # Predicate / derived helpers
      # -------------------------------------------------
      def external?
        params['network_id'].present?
      end

      def assigned_user
        return User.find_by(id: params['assigned_to_id']) if params['assigned_to_id'].present?

        context.user
      end

      def created_by
        external? ? context.user&.piv_upn : IcamOidcAuthentication.parsed_jwt.username
      end

      def days_forward
        external? ? 0 : context.organization&.days_forward.to_i
      end

      def starts_with_locked
        external? ? false : context.letter_type&.starts_with_locked
      end

      def ends_with_locked
        external? ? false : context.letter_type&.ends_with_locked
      end

      # -------------------------------------------------
      # Filing-type resolution
      # -------------------------------------------------
      def filing_type
        return FilingType.find_by(id: params['filing_type_id']) if params['filing_type_id'].present?

        name = params.dig('filing_type_attributes', 'name') || 'PAPER'
        FilingType.find_by(name: name)
      end
    end
  end
end
