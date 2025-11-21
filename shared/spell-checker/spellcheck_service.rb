# app/services/spellcheck_service.rb
require 'net/http'
require 'uri'

class SpellcheckService
  def self.check(text:, language:, additional_params: {})
    base_uri = ENV.fetch('LANGUAGETOOL_URL', 'http://localhost:8010')
    uri = URI("#{base_uri}/v2/check")
    params = { text: text, language: language }.merge(additional_params)

    begin
      response = HTTParty.post(uri.to_s, body: params.to_h, timeout: 300)
      { success: true, data: response.parsed_response, status: response.code }
    rescue HTTParty::Error, Timeout::Error => e
      Rails.logger.error("LanguageTool error: #{e.message}")
      { success: false, error: 'Service unavailable', status: :service_unavailable }
    end
  end

  def self.fetch_languages
    base_uri = ENV.fetch('LANGUAGETOOL_URL', 'http://localhost:8010')
    uri = URI("#{base_uri}/v2/languages")

    begin
      response = Net::HTTP.get_response(uri)
      { success: true, data: JSON.parse(response.body), status: response.code.to_i }
    rescue StandardError => e
      Rails.logger.error("LanguageTool error: #{e.message}")
      { success: false, error: 'Could not fetch languages', status: :service_unavailable }
    end
  end

  def self.health_check
    base_uri = ENV.fetch('LANGUAGETOOL_URL', 'http://localhost:8010')
    uri = URI("#{base_uri}/v2/check")

    begin
      http = Net::HTTP.new(uri.host, uri.port)
      http.read_timeout = 5
      request = Net::HTTP::Post.new(uri.path)
      request.set_form_data({ text: 'test', language: 'en-US' })
      response = http.request(request)

      if response.code.to_i == 200
        { success: true, status: 'healthy', languagetool: 'available', timestamp: Time.current }
      else
        { success: false, status: 'degraded', languagetool: 'unhealthy' }
      end
    rescue StandardError => e
      { success: false, status: 'unhealthy', error: e.message }
    end
  end
end
