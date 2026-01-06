import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableItemProps {
  id: string | number;
  children: React.ReactNode;
  disabled?: boolean;
}

export function SortableItem({ id, children, disabled = false }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {!disabled && (
        <div
          {...attributes}
          {...listeners}
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <GripVertical size={20} />
        </div>
      )}
      {children}
    </div>
  );
}
