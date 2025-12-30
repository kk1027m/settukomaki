export interface Part {
  id: number;
  part_number: string | null;
  part_name: string;
  current_stock: number;
  min_stock: number;
  unit: string;
  location: string | null;
  description: string | null;
  is_active: boolean;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface PartHistory {
  id: number;
  part_id: number;
  action_type: '入庫' | '出庫' | '調整' | '発注';
  quantity: number;
  stock_before: number;
  stock_after: number;
  performed_by: number | null;
  notes: string | null;
  created_at: Date;
}

export interface CreatePartDto {
  part_number?: string;
  part_name: string;
  current_stock: number;
  min_stock: number;
  unit: string;
  location?: string;
  description?: string;
}

export interface UpdatePartDto {
  part_number?: string;
  part_name?: string;
  current_stock?: number;
  min_stock?: number;
  unit?: string;
  location?: string;
  description?: string;
  is_active?: boolean;
}

export interface AdjustStockDto {
  action_type: '入庫' | '出庫' | '調整';
  quantity: number;
  notes?: string;
}

export interface OrderRequestDto {
  quantity: number;
  urgency: 'normal' | 'urgent';
  notes?: string;
}

export interface PartWithStatus extends Part {
  stock_status: 'sufficient' | 'low' | 'out';
  needs_order: boolean;
}
