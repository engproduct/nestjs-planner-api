import { Module } from '@nestjs/common';
import { AppointmentsModule } from './appointments/appointments.module.js';
import { AppConfigModule } from './config/app-config.module.js';
import { HealthModule } from './health/health.module.js';
import { ObservationsModule } from './observations/observations.module.js';
import { PatientsModule } from './patients/patients.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    HealthModule,
    PatientsModule,
    AppointmentsModule,
    ObservationsModule,
  ],
})
export class AppModule {}
