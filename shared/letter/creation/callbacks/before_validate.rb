# frozen_string_literal: true

# --------------------------------------------------------------------------
# Letters::Creation::Callbacks::BeforeValidate
#
# Runs immediately before the draft letter is validated.  Its job is to ensure
# the letter object is fully populated with any data that should exist as a
# result of the incoming request but is not part of the core-attribute set
# (those are handled by AttributeAssigner).
#
# What it does
# • Copies any nested attributes from the request into the draft.
# • Applies header fields and margin settings from organization / letter type.
# • Builds standard-paragraph sections based on provided IDs.
# • Ensures default letter recipients are present.
#
# Reasons to update this file
# • Add or remove nested attribute keys (edit NESTED_KEYS).
# • Change how headers, margins, or standard paragraphs are applied.
# • Introduce additional pre-validation enrichment steps.
#
# Whenever behaviour changes, update
# spec/services/letters/creation/callbacks/before_validate_spec.rb
# with single-expectation examples for each effect.
# --------------------------------------------------------------------------
module Letters
  module Creation
    module Callbacks
      class BeforeValidate
        NESTED_KEYS = %w[
          contacts_attributes
          applicant_types_attributes
          petitioner_type_attributes
          representative_type_attributes
          letter_type_attributes
          organization_attributes
          registration_attributes
          filing_type_attributes
          enclosures_attributes
        ].freeze

        def initialize(letter:, params:, standard_paragraph_ids:, context:)
          @letter                 = letter
          @params                 = params
          @standard_paragraph_ids = standard_paragraph_ids
          @context                = context
        end

        # -------------------------------------------------
        # Entry point
        # -------------------------------------------------
        def call
          prune_null_nested_attributes!
          assign_nested_attributes!
          apply_letter_header!
          apply_letter_margins!
          apply_standard_paragraphs!
          assign_default_letter_recipients!
        end

        private

        attr_reader :letter, :params, :standard_paragraph_ids, :context

        # -------------------------------------------------
        # Prunes all-nil nested attribute hashes/arrays from params
        # -------------------------------------------------
        def prune_null_nested_attributes!
          params.deep_compact!
        end

        # -------------------------------------------------
        # Nested attributes
        # -------------------------------------------------
        def assign_nested_attributes!
          attrs = params.slice(*NESTED_KEYS)
          letter.assign_attributes(attrs) if attrs.any?
        end

        # -------------------------------------------------
        # Header / margin helpers
        # -------------------------------------------------
        def apply_letter_header!
          Letters::LetterHeaderAssigner.new(
            letter: letter,
            header: context.header
          ).call
        end

        def apply_letter_margins!
          Letters::LetterMarginAssigner.new(
            letter: letter,
            letter_type: context.letter_type
          ).call
        end

        # -------------------------------------------------
        # Standard paragraph builder
        # -------------------------------------------------
        def apply_standard_paragraphs!
          sections = Letters::StandardParagraphBuilder.new(
            ids: standard_paragraph_ids
          ).call
          letter.sections_attributes = sections if sections.any?
        end

        # -------------------------------------------------
        # Recipient defaults
        # -------------------------------------------------
        def assign_default_letter_recipients!
          letter.assign_default_letter_recipients!
        end
      end
    end
  end
end
