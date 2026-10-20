// Datas em UTC (toISOString). Os decorators de Swagger entram no
// Appointment 3/4 (#27), pelo corte de reserva do limite de 500 linhas.
export class AppointmentResponseDto {
  uuid!: string;
  patientUuid!: string;
  doctorUuid!: string;
  startTime!: string;
  endTime!: string;
  description!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
