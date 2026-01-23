export const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const differenceInDays = (d1: Date, d2: Date) => {
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

export const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
};

// Calculate grid position (column start and span) for a date range relative to project start
export const getGridPosition = (start: string, end: string, projectStart: string) => {
  const pStart = new Date(projectStart);
  const tStart = new Date(start);
  const tEnd = new Date(end);

  // Offset in days from project start
  const offsetDays = Math.ceil((tStart.getTime() - pStart.getTime()) / (1000 * 60 * 60 * 24));
  // Duration in days
  const durationDays = Math.ceil((tEnd.getTime() - tStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return { offsetDays, durationDays };
};

export const getDelayStatus = (planEnd: string, actualEnd: string | null | undefined) => {
  if (!actualEnd) return 'normal';
  const pEnd = new Date(planEnd);
  const aEnd = new Date(actualEnd);
  return aEnd > pEnd ? 'delayed' : 'ontime';
};