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

interface RestoreInput extends Omit<ScheduleInput, 'description'> {
  uuid: string;
  description: string;
}

interface RescheduleInput {
  startTime?: Date;
  endTime?: Date;
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

  // Reidrata a partir do banco: os dados já foram validados ao entrar.
  static restore(input: RestoreInput): Appointment {
    return new Appointment(
      input.uuid,
      input.patientUuid,
      input.doctorUuid,
      input.period,
      input.description,
    );
  }

  // Imutável: devolve um novo Appointment. O intervalo é revalidado (I1) com os
  // valores combinados, atuais + novos.
  reschedule({ startTime, endTime }: RescheduleInput): Appointment {
    return new Appointment(
      this.uuid,
      this.patientUuid,
      this.doctorUuid,
      TimeRange.create(
        startTime ?? this.period.start,
        endTime ?? this.period.end,
      ),
      this.description,
    );
  }

  changeDescription(description: string): Appointment {
    return new Appointment(
      this.uuid,
      this.patientUuid,
      this.doctorUuid,
      this.period,
      normalizeDescription(description),
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
