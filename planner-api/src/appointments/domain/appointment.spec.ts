import { DomainError } from '../../common/domain/domain-error.js';
import { Appointment } from './appointment.js';
import { TimeRange } from './time-range.js';

describe('Appointment', () => {
  const input = {
    patientUuid: '6f1c1f0e-9d6b-4c52-8f7e-2d5f3a1b9c10',
    doctorUuid: '3f1c5a0e-8b7d-4c52-9a41-6d2e7f9b0a11',
    period: TimeRange.create(
      new Date('2026-10-20T13:00:00Z'),
      new Date('2026-10-20T14:00:00Z'),
    ),
    description: 'Consulta de rotina',
  };

  describe('schedule', () => {
    it('creates an appointment with a generated uuid and the given references', () => {
      const appointment = Appointment.schedule(input);

      expect(appointment.uuid).toMatch(/^[0-9a-f-]{36}$/);
      expect(appointment.patientUuid).toBe(input.patientUuid);
      expect(appointment.doctorUuid).toBe(input.doctorUuid);
      expect(appointment.period).toBe(input.period);
      expect(appointment.description).toBe(input.description);
    });

    it('generates a different uuid for each appointment', () => {
      expect(Appointment.schedule(input).uuid).not.toBe(
        Appointment.schedule(input).uuid,
      );
    });

    it('trims the description', () => {
      const appointment = Appointment.schedule({
        ...input,
        description: '  Retorno  ',
      });

      expect(appointment.description).toBe('Retorno');
    });

    it('accepts a description with 1000 characters', () => {
      const description = 'a'.repeat(1000);

      expect(Appointment.schedule({ ...input, description }).description).toBe(
        description,
      );
    });

    it.each([
      ['empty', ''],
      ['only spaces', '   '],
      ['over 1000 characters', 'a'.repeat(1001)],
    ])('throws a DomainError for a %s description', (_, description) => {
      expect(() => Appointment.schedule({ ...input, description })).toThrow(
        DomainError,
      );
    });
  });

  describe('restore', () => {
    it('rehydrates an appointment keeping its uuid and fields as stored', () => {
      const uuid = '9a1c1f0e-9d6b-4c52-8f7e-2d5f3a1b9c10';

      const appointment = Appointment.restore({ uuid, ...input });

      expect(appointment.uuid).toBe(uuid);
      expect(appointment.patientUuid).toBe(input.patientUuid);
      expect(appointment.doctorUuid).toBe(input.doctorUuid);
      expect(appointment.period).toBe(input.period);
      expect(appointment.description).toBe(input.description);
    });
  });

  describe('reschedule', () => {
    const appointment = Appointment.schedule(input);

    it('changes only startTime, keeping the current endTime', () => {
      const result = appointment.reschedule({
        startTime: new Date('2026-10-20T13:30:00Z'),
      });

      expect(result.period.start).toEqual(new Date('2026-10-20T13:30:00Z'));
      expect(result.period.end).toEqual(new Date('2026-10-20T14:00:00Z'));
    });

    it('changes only endTime, keeping the current startTime', () => {
      const result = appointment.reschedule({
        endTime: new Date('2026-10-20T15:00:00Z'),
      });

      expect(result.period.start).toEqual(new Date('2026-10-20T13:00:00Z'));
      expect(result.period.end).toEqual(new Date('2026-10-20T15:00:00Z'));
    });

    it('keeps the uuid and does not mutate the original', () => {
      const result = appointment.reschedule({
        endTime: new Date('2026-10-20T15:00:00Z'),
      });

      expect(result.uuid).toBe(appointment.uuid);
      expect(appointment.period).toBe(input.period);
    });

    it('returns the same period when nothing is given', () => {
      expect(appointment.reschedule({}).period).toBe(input.period);
    });

    it.each([
      [
        'endTime before the current startTime',
        { endTime: '2026-10-20T12:00:00Z' },
      ],
      [
        'endTime equal to the current startTime',
        { endTime: '2026-10-20T13:00:00Z' },
      ],
      [
        'startTime after the current endTime',
        { startTime: '2026-10-20T15:00:00Z' },
      ],
    ])('throws a DomainError for %s', (_, change) => {
      const typed = {
        startTime:
          'startTime' in change ? new Date(change.startTime) : undefined,
        endTime: 'endTime' in change ? new Date(change.endTime) : undefined,
      };

      expect(() => appointment.reschedule(typed)).toThrow(DomainError);
    });
  });

  describe('changeDescription', () => {
    const appointment = Appointment.schedule(input);

    it('trims and replaces the description, without mutating the original', () => {
      const result = appointment.changeDescription('  Retorno  ');

      expect(result.description).toBe('Retorno');
      expect(result.uuid).toBe(appointment.uuid);
      expect(appointment.description).toBe(input.description);
    });

    it.each([
      ['empty', ''],
      ['only spaces', '   '],
      ['over 1000 characters', 'a'.repeat(1001)],
    ])('throws a DomainError for a %s description', (_, description) => {
      expect(() => appointment.changeDescription(description)).toThrow(
        DomainError,
      );
    });
  });
});
