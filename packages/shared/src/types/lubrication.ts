export interface LubricationPoint {
  id: number;
  machine_name: string;
  location: string;
  cycle_days: number;
  description: string | null;
  is_active: boolean;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface LubricationRecord {
  id: number;
  point_id: number;
  performed_at: Date;
  performed_by: number | null;
  next_due_date: Date;
  notes: string | null;
  created_at: Date;
}

export interface CreateLubricationPointDto {
  machine_name: string;
  location: string;
  cycle_days: number;
  description?: string;
}

export interface UpdateLubricationPointDto {
  machine_name?: string;
  location?: string;
  cycle_days?: number;
  description?: string;
  is_active?: boolean;
}

export interface PerformLubricationDto {
  performed_at?: string; // ISO date string
  notes?: string;
}

export interface LubricationAlert {
  id: number;
  point_id: number;
  machine_name: string;
  location: string;
  last_performed: Date | null;
  due_date: Date;
  days_overdue: number;
  status: 'overdue' | 'due_soon' | 'upcoming' | 'ok';
}

export interface LubricationPointWithStatus extends LubricationPoint {
  last_performed: Date | null;
  next_due_date: Date | null;
  status: 'overdue' | 'due_soon' | 'upcoming' | 'ok';
  days_until_due: number;
}
