class Api::Scribe::V1::ContactsController < ApplicationController
  before_action :authenticate_up_to_iso_permission!
  def index
    render json: Contact.includes(contact_address_xref: :address)
      .all.to_json(methods: :type, include: { contact_address_xref: { include: :address } })
  end

  def show
    @contact = Contact.find(params[:id])
    render json: @contact
  end

  def create
    created_contact = ContactService.create_contact(contact_params: contact_params)
    if created_contact.errors.empty?
      render json: created_contact.to_json(methods: :type, include: { contact_address_xref: { include: :address } })
    else
      errors = created_contact.errors.map(&:full_message).join(', ')
      render json: { error: "Unable to create Contact: #{errors}" }, status: :unprocessable_content
    end
  end

  def contacts_for_letter
    contacts = Contact.includes(contact_address_xref: :address).where(letter_id: contact_params[:letter_id])
    contacts.each { |contact| contact.validate_for_printing if contact.letter_recipient? }

    render json: contacts.to_json(methods: :type, include: [:sex, { contact_address_xref: { include: :address } }])
  end

  def update
    contact = Contact.includes(:address).find(params[:id])
    updated_contact = ContactService.update_contact(contact: contact, contact_params: contact_params)
    if updated_contact.errors.empty?
      render json: updated_contact.to_json(methods: :type, include: { contact_address_xref: { include: :address } })
    else
      errors = updated_contact.errors.map(&:full_message).join(', ')
      render json: { error: "Unable to edit Contact: #{errors}" }, status: :unprocessable_content
    end
  end

  def destroy
    contact = Contact.destroy(params[:id])
    render json: contact.attributes
  end

  private

  def contact_params
    params.expect(contact: [:id, :letter_id, :type, :last_name, :first_name, :middle_name, :firm_name, :in_care_of, :email, :a_number, :sex_id, :ssn,
     :date_of_birth,
     :letter_recipient, :primary_applicant, :main_copy, :courtesy_copy, { contact_address_xref_attributes: [:id, { address_attributes: [
       :id, :foreign_address, :street, :apt_suite_floor, :city, :state_id, :zip_code, :province, :postal_code, :country_id, :type
     ] }] }])
  end
end
