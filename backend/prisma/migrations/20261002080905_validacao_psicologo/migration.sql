-- CreateEnum
CREATE TYPE "StatusAprovacao" AS ENUM ('PENDENTE', 'APROVADO');

-- AlterTable
ALTER TABLE "psicologo" ADD COLUMN     "validado" "StatusAprovacao" NOT NULL DEFAULT 'PENDENTE',
ADD COLUMN     "validado_em" TIMESTAMP(6);
