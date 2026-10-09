/*
  Warnings:

  - You are about to drop the column `nivel_permissao` on the `Usuario` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('GESTOR', 'PSICOLOGO');

-- AlterEnum
ALTER TYPE "StatusAprovacao" ADD VALUE 'EM_ANALISE';

-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "nivel_permissao",
ADD COLUMN     "roles" "Role"[] DEFAULT ARRAY['PSICOLOGO']::"Role"[];
