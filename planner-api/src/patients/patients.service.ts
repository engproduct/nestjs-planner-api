import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';
import { Paginated, paginated } from '../common/pagination/paginated.js';
import { isUniqueViolation } from '../prisma/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePatientDto } from './dto/create-patient.dto.js';
import { PatientResponseDto } from './dto/patient-response.dto.js';
import { toPatientResponse } from './patient.mapper.js';
import { isBirthDateInFuture } from './patient.rules.js';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePatientDto): Promise<PatientResponseDto> {
    if (isBirthDateInFuture(dto.birthDate, new Date())) {
      throw new BadRequestException('birthDate must not be in the future');
    }
    try {
      const patient = await this.prisma.patient.create({
        data: {
          name: dto.name,
          phone: dto.phone,
          email: dto.email,
          birthDate: new Date(dto.birthDate),
          gender: dto.gender,
          height: dto.height,
          weight: dto.weight,
        },
      });
      return toPatientResponse(patient);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }
  }

  async findOne(uuid: string): Promise<PatientResponseDto> {
    const patient = await this.prisma.patient.findFirst({
      where: { uuid, deletedAt: null },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    return toPatientResponse(patient);
  }

  async list(
    query: PaginationQueryDto,
  ): Promise<Paginated<PatientResponseDto>> {
    const where = { deletedAt: null };
    const [patients, total] = await this.prisma.$transaction([
      this.prisma.patient.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.patient.count({ where }),
    ]);
    return paginated(patients.map(toPatientResponse), total, query);
  }
}
