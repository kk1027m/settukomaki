export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const daysBetween = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  const diffTime = date2.getTime() - date1.getTime();
  return Math.round(diffTime / oneDay);
};

export const isOverdue = (dueDate: Date): boolean => {
  return new Date() > dueDate;
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
