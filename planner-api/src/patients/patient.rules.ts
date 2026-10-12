// Regras puras de Patient (sem dependência de framework ou banco).

// birthDate no formato YYYY-MM-DD; comparação lexicográfica com a data de
// hoje (UTC) é suficiente nesse formato. Hoje ainda é uma data válida.
export function isBirthDateInFuture(birthDate: string, today: Date): boolean {
  return birthDate > today.toISOString().slice(0, 10);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
