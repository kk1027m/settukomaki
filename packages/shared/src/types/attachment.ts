export interface Attachment {
  id: number;
  entity_type: 'lubrication_point' | 'part';
  entity_id: number;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: number | null;
  created_at: Date;
}

export interface CreateAttachmentDto {
  entity_type: 'lubrication_point' | 'part';
  entity_id: number;
  file: File;
  description?: string;
}

export interface AttachmentResponse extends Attachment {
  url: string;
}
