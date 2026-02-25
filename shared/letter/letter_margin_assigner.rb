module Letters
  class LetterMarginAssigner
    attr_reader :letter, :letter_type

    def initialize(letter:, letter_type:)
      @letter      = letter
      @letter_type = letter_type
    end

    def call
      return unless letter_type

      letter.assign_attributes(
        margin_top: letter_type.margin_top,
        margin_left: letter_type.margin_left,
        margin_right: letter_type.margin_right,
        margin_bottom: letter_type.margin_bottom
      )
    end
  end
end
