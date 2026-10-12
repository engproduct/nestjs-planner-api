-- Índice único parcial: email único apenas entre pacientes ativos (soft delete).
-- Prisma 7.10 não modela índices parciais no schema; mantido em SQL manual.
CREATE UNIQUE INDEX "patients_email_active_key" ON "patients"("email") WHERE "deletedAt" IS NULL;
