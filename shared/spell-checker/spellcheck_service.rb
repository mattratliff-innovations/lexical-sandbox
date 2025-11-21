# app/services/spellcheck_service.rb
class SpellcheckService
  include HTTParty
  
  # Use the container name for Docker networking
  base_uri ENV.fetch('LANGUAGETOOL_URL', 'http://languagetool-server:8010')
  
  # Set reasonable timeouts
  default_timeout 30
  
  class ServiceError < StandardError; end
  class TimeoutError < ServiceError; end
  class ConnectionError < ServiceError; end
  
  def self.check(text:, language:, additional_params: {})
    return { success: false, error: 'Text is required', status: :bad_request } if text.blank?
    
    params = { text: text, language: language || 'en-US' }.merge(additional_params)
    
    begin
      response = post('/v2/check', body: params, timeout: 30)
      
      if response.success?
        { success: true, data: response.parsed_response, status: response.code }
      else
        Rails.logger.error("LanguageTool returned error: #{response.code} - #{response.body}")
        { success: false, error: "Service error: #{response.code}", status: response.code }
      end
      
    rescue Net::OpenTimeout, Net::ReadTimeout => e
      Rails.logger.error("LanguageTool timeout: #{e.message}")
      { success: false, error: 'Request timed out', status: :gateway_timeout }
      
    rescue SocketError, Errno::ECONNREFUSED, Errno::EHOSTUNREACH => e
      Rails.logger.error("LanguageTool connection error: #{e.class} - #{e.message}")
      { success: false, error: 'Could not connect to spell check service', status: :service_unavailable }
      
    rescue HTTParty::Error, StandardError => e
      Rails.logger.error("LanguageTool unexpected error: #{e.class} - #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))
      { success: false, error: 'Service unavailable', status: :service_unavailable }
    end
  end

  def self.fetch_languages
    begin
      response = get('/v2/languages', timeout: 10)
      
      if response.success?
        { success: true, data: response.parsed_response, status: response.code }
      else
        Rails.logger.error("LanguageTool languages error: #{response.code}")
        { success: false, error: 'Could not fetch languages', status: response.code }
      end
      
    rescue Net::OpenTimeout, Net::ReadTimeout => e
      Rails.logger.error("LanguageTool timeout: #{e.message}")
      { success: false, error: 'Request timed out', status: :gateway_timeout }
      
    rescue SocketError, Errno::ECONNREFUSED, Errno::EHOSTUNREACH => e
      Rails.logger.error("LanguageTool connection error: #{e.class} - #{e.message}")
      { success: false, error: 'Could not connect to spell check service', status: :service_unavailable }
      
    rescue StandardError => e
      Rails.logger.error("LanguageTool error: #{e.class} - #{e.message}")
      { success: false, error: 'Could not fetch languages', status: :service_unavailable }
    end
  end

  def self.health_check
    begin
      response = post('/v2/check', 
        body: { text: 'test', language: 'en-US' },
        timeout: 5
      )
      
      if response.success?
        { 
          success: true, 
          status: 'healthy', 
          languagetool: 'available', 
          response_time_ms: (response.headers['x-response-time'] rescue nil),
          timestamp: Time.current 
        }
      else
        { 
          success: false, 
          status: 'degraded', 
          languagetool: 'unhealthy',
          error: "HTTP #{response.code}"
        }
      end
      
    rescue Net::OpenTimeout, Net::ReadTimeout => e
      { 
        success: false, 
        status: 'unhealthy', 
        error: 'Timeout',
        details: e.message 
      }
      
    rescue SocketError, Errno::ECONNREFUSED, Errno::EHOSTUNREACH => e
      { 
        success: false, 
        status: 'unhealthy', 
        error: 'Connection refused',
        details: e.message 
      }
      
    rescue StandardError => e
      { 
        success: false, 
        status: 'unhealthy', 
        error: e.class.name,
        details: e.message 
      }
    end
  end
  
  # Helper method to check if service is reachable
  def self.available?
    result = health_check
    result[:success]
  end
end