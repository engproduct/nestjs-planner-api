import { ValidateBy, ValidationOptions } from 'class-validator';

// Data e hora ISO 8601 com offset obrigatório (Z ou ±hh:mm); segundos e
// até 3 casas de fração são opcionais. O @IsISO8601 aceita valores sem offset.
const PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:Z|[+-](\d{2}):(\d{2}))$/;

export function isIsoDateTimeWithOffset(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  const match = PATTERN.exec(value);
  if (!match) {
    return false;
  }
  const [year, month, day, hour, minute, second, offsetH, offsetM] = match
    .slice(1)
    .map((part) => Number(part ?? 0));
  // A Date "corrige" 30/02 para 02/03; a volta precisa dar a mesma data.
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    hour <= 23 &&
    minute <= 59 &&
    second <= 59 &&
    offsetH <= 23 &&
    offsetM <= 59
  );
}

export function IsIsoDateTimeWithOffset(
  options?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isIsoDateTimeWithOffset',
      validator: {
        validate: isIsoDateTimeWithOffset,
        defaultMessage: (args) =>
          `${args?.property} must be an ISO 8601 date-time with offset (Z or ±hh:mm)`,
      },
    },
    options,
  );
}
