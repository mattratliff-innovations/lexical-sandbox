module Letters
  class StandardParagraphBuilder
    attr_reader :ids

    def initialize(ids:)
      @ids = Array(ids)
    end

    def call
      return [] if ids.empty?

      paragraphs = StandardParagraph.where(id: ids)
      ids.map.with_index(0) do |id, idx|
        pg = paragraphs.find { |p| p.id == id }
        next unless pg

        { order: idx, text: pg.content, locked: pg.locked, _destroy: false }
      end.compact
    end
  end
end
