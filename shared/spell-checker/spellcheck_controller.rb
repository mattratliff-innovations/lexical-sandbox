# app/controllers/api/scribe/v1/spellcheck_controller.rb
class Api::Scribe::V1::SpellcheckController < ApplicationController
  include HTTParty
    before_action :authenticate_up_to_viewonly_permission!

  # POST /api/v1/spellcheck
  def check
    result = SpellcheckService.check(
      text: spellcheck_params[:text],
      language: spellcheck_params[:language],
      additional_params: spellcheck_params.except(:text, :language)
    )

    if result[:success]
      render json: result[:data], status: result[:status]
    else
      render json: { error: result[:error] }, status: result[:status]
    end
  end

  # GET /api/v1/spellcheck/languages
  def languages
    result = SpellcheckService.fetch_languages

    if result[:success]
      render json: result[:data], status: result[:status]
    else
      render json: { error: result[:error] }, status: result[:status]
    end
  end

  # GET /api/v1/spellcheck/health
  def health
    result = SpellcheckService.health_check

    if result[:success]
      render json: result, status: :ok
    else
      render json: { status: result[:status], error: result[:error] }, status: :service_unavailable
    end
  end

  private

  def check_spellcheck_permission
    unless current_user.has_permission?('spellcheck')
      render json: { error: 'Insufficient permissions', message: 'You do not have access to the spellcheck service' }, status: :forbidden
    end
  end

  def spellcheck_params
    params.permit(
      :text,
      :language,
      :data,
      :enabledOnly,
      :disabledRules,
      :enabledRules,
      :level,
      :preferredVariants
    )
  end
end
