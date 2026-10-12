// Violação de regra de domínio. Não conhece HTTP: o DomainErrorFilter a
// traduz para 400 na borda.
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
