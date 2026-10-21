import { DomainError } from '../../common/domain/domain-error.js';
import { MESSAGE_MAX_LENGTH, Observation } from './observation.js';

describe('Observation', () => {
  const appointmentUuid = '6f1c1f0e-9d6b-4c52-8f7e-2d5f3a1b9c10';

  describe('register', () => {
    it('creates an observation with a generated uuid, the appointment and no deletion', () => {
      const observation = Observation.register({
        appointmentUuid,
        message: 'Paciente relata melhora',
      });

      expect(observation.uuid).toMatch(/^[0-9a-f-]{36}$/);
      expect(observation.appointmentUuid).toBe(appointmentUuid);
      expect(observation.message).toBe('Paciente relata melhora');
      expect(observation.deletedAt).toBeNull();
    });

    it('generates a different uuid for each observation', () => {
      const input = { appointmentUuid, message: 'a' };

      expect(Observation.register(input).uuid).not.toBe(
        Observation.register(input).uuid,
      );
    });

    it('trims the message', () => {
      expect(
        Observation.register({ appointmentUuid, message: '  texto \n' })
          .message,
      ).toBe('texto');
    });

    it.each(['', '   ', '\n\t'])('rejects an empty message (%j)', (message) => {
      expect(() => Observation.register({ appointmentUuid, message })).toThrow(
        DomainError,
      );
    });

    it('accepts a message of exactly the maximum length', () => {
      const message = 'a'.repeat(MESSAGE_MAX_LENGTH);

      expect(Observation.register({ appointmentUuid, message }).message).toBe(
        message,
      );
    });

    it('rejects a message longer than the maximum after trim', () => {
      const message = 'a'.repeat(MESSAGE_MAX_LENGTH + 1);

      expect(() => Observation.register({ appointmentUuid, message })).toThrow(
        DomainError,
      );
    });
  });

  describe('changeMessage', () => {
    const original = Observation.register({ appointmentUuid, message: 'a' });

    it('returns a new observation with the trimmed message, keeping identity', () => {
      const changed = original.changeMessage('  b ');

      expect(changed).not.toBe(original);
      expect(changed.message).toBe('b');
      expect(changed.uuid).toBe(original.uuid);
      expect(changed.appointmentUuid).toBe(appointmentUuid);
      expect(original.message).toBe('a');
    });

    it('rejects an invalid message', () => {
      expect(() => original.changeMessage('  ')).toThrow(DomainError);
    });
  });

  describe('markDeleted', () => {
    it('returns a new observation with deletedAt set', () => {
      const original = Observation.register({ appointmentUuid, message: 'a' });
      const at = new Date('2026-10-21T10:00:00Z');

      const deleted = original.markDeleted(at);

      expect(deleted.deletedAt).toBe(at);
      expect(deleted.uuid).toBe(original.uuid);
      expect(original.deletedAt).toBeNull();
    });
  });

  describe('restore', () => {
    it('rebuilds from stored data without revalidating', () => {
      const observation = Observation.restore({
        uuid: '3f1c5a0e-8b7d-4c52-9a41-6d2e7f9b0a11',
        appointmentUuid,
        message: 'guardada',
        deletedAt: null,
      });

      expect(observation.message).toBe('guardada');
    });
  });
});
