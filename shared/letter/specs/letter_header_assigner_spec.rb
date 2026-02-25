require 'rails_helper'

RSpec.describe Letters::LetterHeaderAssigner do
  let(:header) do
    build(
      :header,
      row1_col1: 'A1', row1_col2: 'A2',
      row2_col1: 'B1', row2_col2: 'B2',
      row3_col1: 'C1', row3_col2: 'C2'
    )
  end

  let(:letter) { build(:letter) }

  describe '#call' do
    it 'copies header fields to the letter' do
      described_class.new(letter: letter, header: header).call

      expect(letter.row1_col1).to eq 'A1'
      expect(letter.row1_col2).to eq 'A2'
      expect(letter.row2_col1).to eq 'B1'
      expect(letter.row2_col2).to eq 'B2'
      expect(letter.row3_col1).to eq 'C1'
      expect(letter.row3_col2).to eq 'C2'
      expect(letter.header_id).to eq header.id
    end

    it 'leaves fields unchanged when header is nil' do
      described_class.new(letter: letter, header: nil).call
      expect(letter.row1_col1).to be_nil
      expect(letter.header_id).to be_nil
    end
  end
end
