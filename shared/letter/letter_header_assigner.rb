# frozen_string_literal: true

module Letters
  class LetterHeaderAssigner
    attr_reader :letter, :header

    def initialize(letter:, header:)
      @letter = letter
      @header = header
    end

    def call
      return unless header

      letter.assign_attributes(
        row1_col1: header.row1_col1,
        row1_col2: header.row1_col2,
        row2_col1: header.row2_col1,
        row2_col2: header.row2_col2,
        row3_col1: header.row3_col1,
        row3_col2: header.row3_col2,
        header_id: header.id
      )
    end
  end
end
