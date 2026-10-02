-- CreateTable
CREATE TABLE "psicologo" (
    "id_psicologo" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "crp" VARCHAR(20) NOT NULL,
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "psicologo_pkey" PRIMARY KEY ("id_psicologo")
);

-- CreateTable
CREATE TABLE "recuperacao_senha" (
    "id" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "expira_em" TIMESTAMP(6) NOT NULL,
    "usado_em" TIMESTAMP(6),
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recuperacao_senha_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "psicologo_id_usuario_key" ON "psicologo"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "psicologo_crp_key" ON "psicologo"("crp");

-- CreateIndex
CREATE UNIQUE INDEX "recuperacao_senha_token_hash_key" ON "recuperacao_senha"("token_hash");

-- CreateIndex
CREATE INDEX "recuperacao_senha_id_usuario_criado_em_idx" ON "recuperacao_senha"("id_usuario", "criado_em");

-- AddForeignKey
ALTER TABLE "psicologo" ADD CONSTRAINT "psicologo_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recuperacao_senha" ADD CONSTRAINT "recuperacao_senha_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
