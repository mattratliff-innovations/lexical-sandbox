module Api
  module V1
    class SpellcheckController < ApplicationController
      include HTTParty
      
      before_action :authenticate_user!
      before_action :check_spellcheck_permission
      
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
      
      # ... rest of the methods
    end
  end
end