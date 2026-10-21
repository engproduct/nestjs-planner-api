import { randomUUID } from 'node:crypto';
import { DomainError } from '../../common/domain/domain-error.js';

export const MESSAGE_MAX_LENGTH = 5000;

interface RegisterInput {
  appointmentUuid: string;
  message: string;
}

interface RestoreInput extends RegisterInput {
  uuid: string;
  deletedAt: Date | null;
}

// Entidade raiz do agregado Observation. Referencia o Appointment por uuid
// (I5) e nunca Patient ou User (I6); a existência do agendamento é validada
// na aplicação (I4).
export class Observation {
  private constructor(
    readonly uuid: string,
    readonly appointmentUuid: string,
    readonly message: string,
    readonly deletedAt: Date | null,
  ) {}

  static register(input: RegisterInput): Observation {
    return new Observation(
      randomUUID(),
      input.appointmentUuid,
      normalizeMessage(input.message),
      null,
    );
  }

  // Reidrata a partir do banco: os dados já foram validados ao entrar.
  static restore(input: RestoreInput): Observation {
    return new Observation(
      input.uuid,
      input.appointmentUuid,
      input.message,
      input.deletedAt,
    );
  }

  // Imutável: devolve uma nova Observation.
  changeMessage(message: string): Observation {
    return new Observation(
      this.uuid,
      this.appointmentUuid,
      normalizeMessage(message),
      this.deletedAt,
    );
  }

  markDeleted(at: Date): Observation {
    return new Observation(this.uuid, this.appointmentUuid, this.message, at);
  }
}

function normalizeMessage(message: string): string {
  const trimmed = message.trim();
  if (trimmed.length === 0 || trimmed.length > MESSAGE_MAX_LENGTH) {
    throw new DomainError(
      `message must have between 1 and ${MESSAGE_MAX_LENGTH} characters`,
    );
  }
  // O Postgres não aceita NUL em texto (UTF8).
  if (trimmed.includes('\u0000')) {
    throw new DomainError('message must not contain NUL characters');
  }
  return trimmed;
}
