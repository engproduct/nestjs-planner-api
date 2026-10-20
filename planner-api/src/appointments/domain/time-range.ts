import { DomainError } from '../../common/domain/domain-error.js';

// VO do intervalo de um agendamento. Garante I1 (start < end) na criação e é
// imutável: guarda os instantes em ms e devolve uma Date nova a cada leitura.
export class TimeRange {
  private constructor(
    private readonly startMs: number,
    private readonly endMs: number,
  ) {}

  static create(start: Date, end: Date): TimeRange {
    const startMs = start.getTime();
    const endMs = end.getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      throw new DomainError('startTime and endTime must be valid dates');
    }
    if (startMs >= endMs) {
      throw new DomainError('startTime must be before endTime');
    }
    return new TimeRange(startMs, endMs);
  }

  get start(): Date {
    return new Date(this.startMs);
  }

  get end(): Date {
    return new Date(this.endMs);
  }
}
