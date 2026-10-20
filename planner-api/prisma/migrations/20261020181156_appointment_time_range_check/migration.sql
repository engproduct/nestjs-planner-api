-- I1 também no banco (defesa em profundidade além do VO TimeRange).
-- Prisma 7.10 não modela CHECK no schema; mantido em SQL manual.
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_time_range_check" CHECK ("startTime" < "endTime");
