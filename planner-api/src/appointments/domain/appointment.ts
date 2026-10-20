import { randomUUID } from 'node:crypto';
import { DomainError } from '../../common/domain/domain-error.js';
import { TimeRange } from './time-range.js';

export const DESCRIPTION_MAX_LENGTH = 1000;

interface ScheduleInput {
  patientUuid: string;
  doctorUuid: string;
  period: TimeRange;
  description: string;
}

// Entidade raiz do agregado Appointment. Referencia Patient e o médico (User)
// por uuid; a existência e o estado deles são validados na aplicação (I2, I3).
export class Appointment {
  private constructor(
    readonly uuid: string,
    readonly patientUuid: string,
    readonly doctorUuid: string,
    readonly period: TimeRange,
    readonly description: string,
  ) {}

  static schedule(input: ScheduleInput): Appointment {
    return new Appointment(
      randomUUID(),
      input.patientUuid,
      input.doctorUuid,
      input.period,
      normalizeDescription(input.description),
    );
  }
}

function normalizeDescription(description: string): string {
  const trimmed = description.trim();
  if (trimmed.length === 0 || trimmed.length > DESCRIPTION_MAX_LENGTH) {
    throw new DomainError(
      `description must have between 1 and ${DESCRIPTION_MAX_LENGTH} characters`,
    );
  }
  return trimmed;
}
