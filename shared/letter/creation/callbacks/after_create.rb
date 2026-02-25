# frozen_string_literal: true

# --------------------------------------------------------------------------
# Letters::Creation::Callbacks::AfterCreate
#
# Executes side-effects that must happen immediately after a draft letter is
# successfully saved.  These actions are isolated here to keep CreateService
# free of post-persistence details.
#
# What it currently does
# • Generates and saves a locator_code on the letter.
# • Emits a fire-hose record to Kafka for downstream consumers.
#
# Reasons to update this file
# • Add another post-create side-effect (e.g., analytics event, audit log).
# • Change the locator code algorithm (will require updating the
#   LocatorCodeBuilder dependency).
# • Modify or remove the Kafka fire-hose call if delivery requirements change.
#
# Remember to add or adjust tests in
# spec/services/letters/creation/callbacks/after_create_spec.rb
# whenever behaviour here changes.
# --------------------------------------------------------------------------
module Letters
  module Creation
    module Callbacks
      class AfterCreate
        def initialize(letter)
          @letter = letter
        end

        # -------------------------------------------------
        # Entry point
        # -------------------------------------------------
        def call
          update_locator_code!
          log_firehose!
        end

        private

        attr_reader :letter

        # -------------------------------------------------
        # Side-effect helpers
        # -------------------------------------------------
        def update_locator_code!
          prefix = LocatorCodeBuilder.new(
            org_code: letter.organization&.code,
            form_type_name: letter.registration.form_type_name,
            letter_type_name: letter.letter_type&.name
          ).call

          letter.update!(locator_code: "#{prefix}#{letter.id}S")
        end

        def log_firehose!
          letter.log_kafka_queue_firehose_record
        end
      end
    end
  end
end
