// Violação de unicidade do Prisma (P2002).
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

// Registro exigido pela operação não encontrado (P2025): ex.: `update` cujo
// `where` deixou de casar porque a linha foi excluída depois da leitura.
export function isNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2025'
  );
}
