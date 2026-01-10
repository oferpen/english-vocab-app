export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('he-IL');
}
