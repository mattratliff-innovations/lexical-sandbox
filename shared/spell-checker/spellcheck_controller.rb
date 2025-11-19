require 'net/http'
require 'uri'

module Api
  module V1
    class SpellcheckController < ApplicationController
       include HTTParty
      
      before_action :authenticate_user!
      before_action :check_spellcheck_permission
      
      # POST /api/v1/spellcheck
      def check
        base_uri = ENV.fetch('LANGUAGETOOL_URL', 'http://localhost:8081')
        
        response = self.class.post(
          "#{base_uri}/v2/check",
          body: spellcheck_params.to_h,
          timeout: 300
        )
        
        render json: response.parsed_response, status: response.code
        
      rescue HTTParty::Error, Timeout::Error => e
        Rails.logger.error("LanguageTool error: #{e.message}")
        render json: { error: 'Service unavailable' }, status: :service_unavailable
      end
      
      # GET /api/v1/spellcheck/languages
      def languages
        # Get supported languages from LanguageTool
        languagetool_url = ENV.fetch('LANGUAGETOOL_URL', 'http://localhost:8081')
        uri = URI.parse("#{languagetool_url}/v2/languages")
        
        begin
          response = Net::HTTP.get_response(uri)
          render json: JSON.parse(response.body), status: response.code.to_i
        rescue StandardError => e
          Rails.logger.error("LanguageTool error: #{e.message}")
          render json: { error: 'Could not fetch languages' }, status: :service_unavailable
        end
      end
      
      # GET /api/v1/spellcheck/health
      def health
        languagetool_url = ENV.fetch('LANGUAGETOOL_URL', 'http://localhost:8081')
        uri = URI.parse("#{languagetool_url}/v2/check")
        
        begin
          http = Net::HTTP.new(uri.host, uri.port)
          http.read_timeout = 5
          
          # Simple health check
          request = Net::HTTP::Post.new(uri.path)
          request.set_form_data({ text: 'test', language: 'en-US' })
          response = http.request(request)
          
          if response.code.to_i == 200
            render json: { 
              status: 'healthy', 
              languagetool: 'available',
              timestamp: Time.current 
            }, status: :ok
          else
            render json: { 
              status: 'degraded', 
              languagetool: 'unhealthy' 
            }, status: :service_unavailable
          end
          
        rescue StandardError => e
          render json: { 
            status: 'unhealthy', 
            error: e.message 
          }, status: :service_unavailable
        end
      end

      private

      def check_spellcheck_permission
        # Adjust based on your permission model
        unless current_user.has_permission?('spellcheck')
          render json: { 
            error: 'Insufficient permissions',
            message: 'You do not have access to the spellcheck service'
          }, status: :forbidden
        end
      end

      def spellcheck_params
        # LanguageTool expects these parameters
        params.permit(
          :text,           # Required: the text to check
          :language,       # Required: language code (e.g., 'en-US')
          :data,           # Optional: JSON with additional data
          :enabledOnly,    # Optional: if true, only enabled rules are used
          :disabledRules,  # Optional: comma-separated list of rule IDs to disable
          :enabledRules,   # Optional: comma-separated list of rule IDs to enable
          :level,          # Optional: 'default' or 'picky'
          :preferredVariants # Optional: comma-separated list of preferred language variants
        )
      end
    end
  end
end