-- CreateTable
CREATE TABLE "observations" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "observations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "observations_uuid_key" ON "observations"("uuid");

-- CreateIndex
CREATE INDEX "observations_appointmentId_createdAt_idx" ON "observations"("appointmentId", "createdAt");

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
