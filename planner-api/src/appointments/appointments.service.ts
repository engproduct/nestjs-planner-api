import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  appointmentInclude,
  toAppointmentResponse,
} from './appointment.mapper.js';
import { Appointment } from './domain/appointment.js';
import { TimeRange } from './domain/time-range.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { AppointmentResponseDto } from './dto/appointment-response.dto.js';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAppointmentDto): Promise<AppointmentResponseDto> {
    // Regras do próprio agregado (I1, description) antes das referências.
    const appointment = Appointment.schedule({
      patientUuid: dto.patientUuid,
      doctorUuid: dto.doctorUuid,
      period: TimeRange.create(new Date(dto.startTime), new Date(dto.endTime)),
      description: dto.description,
    });

    const [patient, doctor] = await Promise.all([
      this.prisma.patient.findFirst({
        where: { uuid: appointment.patientUuid, deletedAt: null },
        select: { id: true },
      }),
      this.prisma.user.findFirst({
        where: {
          uuid: appointment.doctorUuid,
          role: 'DOCTOR',
          deletedAt: null,
        },
        select: { id: true },
      }),
    ]);
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const created = await this.prisma.appointment.create({
      data: {
        uuid: appointment.uuid,
        patientId: patient.id,
        userId: doctor.id,
        startTime: appointment.period.start,
        endTime: appointment.period.end,
        description: appointment.description,
      },
      include: appointmentInclude,
    });
    return toAppointmentResponse(created);
  }
}
