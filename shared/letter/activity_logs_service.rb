require 'time'

module Letters
  class ActivityLogsService
    attr_reader :letter

    def initialize(letter)
      @letter = letter
    end

    def call
      return unless letter

      letter_copy_ids = letter.letter_copies.pluck(:id)
      letter_copy_status_logs = LetterCopyStatusLog.where(letter_copy_id: letter_copy_ids)

      hashed_letter_status_logs = Letter::StatusLogSerializer.new(letter.status_logs).serializable_hash
      hashed_letter_copy_status_logs = Letter::CopyStatusLogSerializer.new(letter_copy_status_logs).serializable_hash

      merged_hash = hashed_letter_status_logs[:data].concat(hashed_letter_copy_status_logs[:data])
      merged_hash.sort_by! { |obj| obj[:attributes][:created_at] }.reverse!

      { data: merged_hash }
    end
  end
end
