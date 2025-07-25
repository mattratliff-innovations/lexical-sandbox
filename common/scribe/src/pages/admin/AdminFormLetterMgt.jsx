import React from 'react';
import {
  FilePost,
  FileEarmarkFont,
  Paperclip,
  Person,
  Diagram3Fill,
  Paragraph,
  BoxArrowInDown,
  Toggles,
  FileEarmarkText,
  EnvelopePaper,
  Sliders,
} from 'react-bootstrap-icons';
import { DrCard } from '@druid/druid';
import { useNavigate } from 'react-router-dom';
import { H3 } from '../../components/typography';

export default function AdminFormLetterMgt() {
  const navigate = useNavigate();

  return (
    <div className="row m-0 py-0 align-items-top" data-testid="card-div">
      <div className="col-sm-11 m-0 pt-4 align-top">
        <div className="row pb-4">
          <div className="col-md-6">
            <DrCard
              orientation="horizontal"
              content={`Create and deactivate form types
              (e.g., I-601s and I-212s) and update
              related information including associated letter types.`}
              interactive
              className="admin-card"
              onClick={() => navigate('/admin/formtypes')}>
              <H3 slot="heading">Form Types</H3>
              <FilePost className="bi" size="3.7vw" slot="media" />
            </DrCard>
          </div>

          <div className="col-md-6">
            <DrCard
              orientation="horizontal"
              content={`Create and deactivate letter types, such as NOIDS and RFEs. Update related information,
              including standard lead-in text and associated letter types.`}
              interactive
              className="admin-card"
              onClick={() => navigate('/admin/lettertypes')}>
              <H3 slot="heading">Letter Types</H3>
              <FileEarmarkFont className="bi" size="3.7vw" slot="media" />
            </DrCard>
          </div>
        </div>

        <div className="row pb-4">
          <div className="col-md-6">
            <DrCard
              orientation="horizontal"
              content="All headers within Scribe."
              interactive
              className="admin-card"
              onClick={() => navigate('/admin/headers')}>
              <H3 slot="heading">Letter Headers</H3>
              <EnvelopePaper className="bi" size="3.7vw" slot="media" />
            </DrCard>
          </div>

          <div className="col-md-6">
            <DrCard
              orientation="horizontal"
              content="User and organization mappings."
              interactive
              className="admin-card"
              onClick={() => navigate('/admin/users')}>
              <H3 slot="heading">Users</H3>
              <Person className="bi" size="3.7vw" slot="media" />
            </DrCard>
          </div>
        </div>

        <div className="row pb-4">
          <div className="col-md-6">
            <DrCard
              orientation="horizontal"
              content={`Create and deactivate staff organizations (e.g., NSC and VSC) and update related information
              including the Director's name and signature image for inclusion in related correspondence.`}
              interactive
              className="admin-card"
              onClick={() => navigate('/admin/organizations')}>
              <H3 slot="heading">Organizations</H3>
              <Diagram3Fill className="bi" size="3.7vw" slot="media" />
            </DrCard>
          </div>

          <div className="col-md-6">
            <DrCard
              orientation="horizontal"
              content="Create and deactivate standard paragraphs and updated related information including paragraph code,
              description, content, and associated form and letter types."
              interactive
              className="admin-card"
              onClick={() => navigate('/admin/standardparagraphs')}>
              <H3 slot="heading">Standard Paragraphs</H3>
              <Paragraph className="bi" size="3.7vw" slot="media" />
            </DrCard>
          </div>
        </div>

        <div className="row pb-4">
          <div className="col-md-6">
            <DrCard
              orientation="horizontal"
              content="Create and deactivate standard placeholder snippets (e.g., denial attachments) and updated related
              information including snippet code, content, and associated form and letter types."
              interactive
              className="admin-card"
              onClick={() => navigate('/admin/snippets')}>
              <H3 slot="heading">Manage Standard Placeholder Snippets</H3>
              <BoxArrowInDown className="bi" size="3.7vw" slot="media" />
            </DrCard>
          </div>

          <div className="col-md-6">
            <DrCard
              orientation="horizontal"
              content="Create and deactivate letter-supporting documents (e.g., Call-Up and Routing Sheets) and update related
              information including standard text and associated form and letter types."
              interactive
              className="admin-card"
              onClick={() => navigate('/admin/supportingdocuments')}>
              <H3 slot="heading">Supporting Documents</H3>
              <FileEarmarkText className="bi" size="3.7vw" slot="media" />
            </DrCard>
          </div>
        </div>

        <div className="row pb-4">
          <div className="col-md-6">
            <DrCard
              orientation="horizontal"
              content="Create and deactivate enclosures and update related information including associated form and letter types."
              interactive
              className="admin-card"
              onClick={() => navigate('/admin/enclosures')}>
              <H3 slot="heading">Manage Enclosures</H3>
              <Paperclip className="bi" size="3.7vw" slot="media" />
            </DrCard>
          </div>

          <div className="col-md-6">
            <DrCard
              orientation="horizontal"
              content="Create and deactivate class preferences and update class code and form associations."
              interactive
              className="admin-card"
              onClick={() => navigate('/admin/classPreferences')}>
              <H3 slot="heading">Manage Class Preferences</H3>
              <Sliders className="bi" size="3.7vw" slot="media" />
            </DrCard>
          </div>
        </div>

        <div className="row pb-4">
          <div className="col-md-6">
            <DrCard
              orientation="horizontal"
              content="Enable and disable feature flag/toggles to control application behavior"
              interactive
              className="admin-card"
              onClick={() => navigate('/admin/flags')}>
              <H3 slot="heading">Manage Feature Flags</H3>
              <Toggles className="bi" size="3.7vw" slot="media" />
            </DrCard>
          </div>
        </div>
      </div>
    </div>
  );
}
