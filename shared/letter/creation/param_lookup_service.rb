# frozen_string_literal: true

# --------------------------------------------------------------------------
# Letters::Creation::ParamLookupService
#
# Resolves human-friendly lookup fields (sex, country, state) in letter params
# to internal *_id references. Mutates the params hash in-place, setting the
# resolved *_id fields and removing the original lookup keys. Collects errors
# for any lookup that fails.
#
# What it does
# • For each section (petitioner, representative, contacts, applicant_types),
#   finds and resolves sex, country, and state fields.
# • Sets the corresponding *_id field and removes the original key.
# • Collects errors for any lookup that cannot be resolved.
#
# Reasons to update this file
# • Add or remove supported lookup fields.
# • Change or extend lookup logic for new sections or fields.
# • Update error messaging for API consumers.
#
# When behaviour changes, update
# spec/services/letters/creation/param_lookup_service_spec.rb
# with single-expectation examples for both success and every failure case.
# --------------------------------------------------------------------------
module Letters
  module Creation
    class ParamLookupService
      attr_reader :errors

      def initialize(params)
        @params = params
        @errors = []
      end

      # -------------------------------------------------
      # Entry point
      # -------------------------------------------------
      def call
        map_petitioner_attributes!
        map_representative_attributes!
        map_contacts_attributes!
        map_applicant_types_attributes!
      end

      def valid?
        errors.empty?
      end

      private

      attr_reader :params

      # -------------------------------------------------
      # Section mapping (petitioner, representative, contacts, applicant_types)
      # -------------------------------------------------
      def map_petitioner_attributes!
        map_section!(params['petitioner_type_attributes'], 'PetitionerType')
      end

      def map_representative_attributes!
        map_section!(params['representative_type_attributes'], 'RepresentativeType')
      end

      def map_contacts_attributes!
        Array(params['contacts_attributes']).each do |attrs|
          map_section!(attrs, 'ApplicantType')
        end
      end

      def map_applicant_types_attributes!
        Array(params['applicant_types_attributes']).each do |attrs|
          map_section!(attrs, 'ApplicantType')
        end
      end

      def map_section!(attrs, type)
        return unless attrs

        set_contact_type_default!(attrs, type)
        set_address_type_default!(attrs)
        map_sex!(attrs)
        map_country!(attrs)
        map_state!(attrs)
      end

      # -------------------------------------------------
      # Attribute mapping (sex, country, state)
      # -------------------------------------------------
      def map_sex!(section)
        return unless section

        val = section.delete('sex')
        return if val.blank?

        id = lookup_sex_id(val)
        if id
          section['sex_id'] = id
        else
          errors << "Sex '#{val}' could not be resolved"
        end
      end

      def map_country!(section)
        address = section['address_attributes'] if section
        return unless address

        val = address.delete('country')
        return if val.blank?

        id = lookup_country_id(val)
        if id
          address['country_id'] = id
        else
          errors << "Country '#{val}' could not be resolved"
        end
      end

      def map_state!(section)
        address = section['address_attributes'] if section
        return unless address

        val = address.delete('state')
        return if val.blank?

        id = lookup_state_id(val)
        if id
          address['state_id'] = id
        else
          errors << "State '#{val}' could not be resolved"
        end
      end

      # -------------------------------------------------
      # Default setters for contact and address types
      # -------------------------------------------------
      def set_contact_type_default!(section, default_type)
        return unless section

        section['type'] = default_type unless section.has_key?('type')
      end

      def set_address_type_default!(section)
        return unless section && section['address_attributes']

        addr = section['address_attributes']
        addr['type'] = 'AddressContactType' unless addr.has_key?('type')
      end

      # -------------------------------------------------
      # Lookup helpers
      # -------------------------------------------------
      def lookup_sex_id(val)
        return nil if val.blank?

        if %w[M m Male male].include?(val)
          Sex.find_by(code: 'M')&.id
        elsif %w[F f Female female].include?(val)
          Sex.find_by(code: 'F')&.id
        end
      end

      def lookup_country_id(val)
        return nil if val.blank?

        Country.find_by(description: val)&.id || Country.find_by(code: val)&.id
      end

      def lookup_state_id(val)
        return nil if val.blank?

        StateLookup.find_by(name: val)&.id || StateLookup.find_by(code: val)&.id
      end
    end
  end
end
