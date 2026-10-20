import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';
import { Paginated, paginated } from '../common/pagination/paginated.js';
import { Role } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  appointmentInclude,
  toAppointmentResponse,
} from './appointment.mapper.js';
import { Appointment } from './domain/appointment.js';
import { TimeRange } from './domain/time-range.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';
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
          role: Role.DOCTOR,
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

  // Agendamento de paciente ou médico excluído depois continua visível
  // (histórico, R10): o filtro de deletedAt vale só para o próprio agendamento.
  async findOne(uuid: string): Promise<AppointmentResponseDto> {
    const appointment = await this.prisma.appointment.findFirst({
      where: { uuid, deletedAt: null },
      include: appointmentInclude,
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return toAppointmentResponse(appointment);
  }

  async list(
    query: PaginationQueryDto,
  ): Promise<Paginated<AppointmentResponseDto>> {
    const where = { deletedAt: null };
    const [appointments, total] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({
        where,
        include: appointmentInclude,
        // Desempate por id: ordem total, sem repetir nem pular entre páginas.
        orderBy: [{ startTime: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.appointment.count({ where }),
    ]);
    return paginated(appointments.map(toAppointmentResponse), total, query);
  }

  async update(
    uuid: string,
    dto: UpdateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    const current = await this.prisma.appointment.findFirst({
      where: { uuid, deletedAt: null },
      include: appointmentInclude,
    });
    if (!current) {
      throw new NotFoundException('Appointment not found');
    }

    let appointment = Appointment.restore({
      uuid: current.uuid,
      patientUuid: current.patient.uuid,
      doctorUuid: current.user.uuid,
      period: TimeRange.create(current.startTime, current.endTime),
      description: current.description,
    }).reschedule({
      startTime: dto.startTime ? new Date(dto.startTime) : undefined,
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
    });
    if (dto.description !== undefined) {
      appointment = appointment.changeDescription(dto.description);
    }

    // Só revalida o médico (I3) quando ele muda.
    let userId: number | undefined;
    if (dto.doctorUuid !== undefined && dto.doctorUuid !== current.user.uuid) {
      const doctor = await this.prisma.user.findFirst({
        where: { uuid: dto.doctorUuid, role: Role.DOCTOR, deletedAt: null },
        select: { id: true },
      });
      if (!doctor) {
        throw new NotFoundException('Doctor not found');
      }
      userId = doctor.id;
    }

    const updated = await this.prisma.appointment.update({
      where: { id: current.id },
      data: {
        userId,
        startTime: appointment.period.start,
        endTime: appointment.period.end,
        description: appointment.description,
      },
      include: appointmentInclude,
    });
    return toAppointmentResponse(updated);
  }

  async remove(uuid: string): Promise<void> {
    // Fora de escopo aqui: com Observation ativa o DELETE deve responder 409
    // (domain.md, Appointment › DELETE); entra na fatia Observation.
    const { count } = await this.prisma.appointment.updateMany({
      where: { uuid, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (count === 0) {
      throw new NotFoundException('Appointment not found');
    }
  }
}
