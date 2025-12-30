ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_entity_type_check;
ALTER TABLE attachments ADD CONSTRAINT attachments_entity_type_check
  CHECK (entity_type IN ('lubrication_point', 'replacement_schedule', 'part', 'maintenance_procedure', 'topic'));
