# frozen_string_literal: true

# --------------------------------------------------------------------------
# Letters::Creation::Callbacks::PreProcess
#
# First step in the create-letter workflow. Resolves any “echo_*” external
# identifiers supplied by upstream systems and mutates the request params to
# include the internal UUIDs. Also resolves human-friendly lookup fields
# (sex, country, state) to internal *_id references for all relevant sections.
# If a draft Letter instance already exists, it patches the letter_type_id so
# model validations can run safely.
#
# What it does
# • Validates and translates echo_* external identifiers to internal UUIDs.
# • Resolves and sets *_id fields for sex, country, and state in all sections
#   (petitioner, representative, contacts, applicant_types).
# • Removes original lookup keys after mapping.
# • Collects and attaches errors from both validation and lookup steps.
#
# Reasons to update this file
# • Add, remove, or reorder phases of the creation workflow.
# • Introduce or retire supported lookup fields or sections.
# • Change initialization arguments for helper classes.
#
# When behaviour changes, update
# spec/services/letters/creation/callbacks/pre_process_spec.rb
# with single-expectation examples for both success and every failure case.
# --------------------------------------------------------------------------
module Letters
  module Creation
    module Callbacks
      class PreProcess
        def initialize(letter:, params:)
          @letter = letter
          @params = params
        end

        # -------------------------------------------------
        # Entry point
        # -------------------------------------------------
        def call
          process_echo_ids!
          set_lookup_ids!
        end

        private

        attr_reader :letter, :params

        # -------------------------------------------------
        # Echo ID validation and translation
        # -------------------------------------------------
        def process_echo_ids!
          return unless echo_payload_present?

          if validator.valid?
            set_translated_params!
            patch_draft_letter_type!
          else
            copy_validator_errors!
          end
        end

        # -------------------------------------------------
        # Lookup mapping for sex, country, state
        # -------------------------------------------------
        def set_lookup_ids!
          lookup_service.call
          copy_lookup_errors!
        end

        def lookup_service
          @lookup_service ||= Letters::Creation::ParamLookupService.new(params)
        end

        def copy_lookup_errors!
          lookup_service.errors.each { |msg| letter.errors.add(:base, msg) }
        end

        # -------------------------------------------------
        # Helpers
        # -------------------------------------------------
        def echo_payload_present?
          params['echo_lettertype_id'] && params['echo_formtype_id'] && params['echo_org_id']
        end

        def validator
          @validator ||= Letters::Creation::UpstreamContextValidator.new(params)
        end

        def set_translated_params!
          params['lettertype_uuid'] = validator.lettertype_uuid
          params['formtype_uuid']   = validator.formtype_uuid
          params['organization_id'] = validator.organization_id
        end

        def patch_draft_letter_type!
          return unless letter

          letter.letter_type_id = validator.lettertype_uuid
        end

        def copy_validator_errors!
          validator.errors.each { |msg| letter.errors.add(:base, msg) }
        end
      end
    end
  end
end
