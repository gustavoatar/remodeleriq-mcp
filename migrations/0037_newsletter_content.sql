-- Store the structured issue content (subject, sections, links) so the admin
-- edit form can load and re-render it. html_body/text_body remain the rendered
-- output the send path uses.
ALTER TABLE newsletter_issues ADD COLUMN content_json TEXT;
