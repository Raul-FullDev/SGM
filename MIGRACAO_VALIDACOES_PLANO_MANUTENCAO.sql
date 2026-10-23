-- Execute este arquivo no SQL Editor do Supabase para aplicar a validação
-- no banco existente. Não é necessário recriar as tabelas.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_plano_manutencao_periodo_positivo'
      AND conrelid = 'public.plano_manutencao'::regclass
  ) THEN
    ALTER TABLE public.plano_manutencao
      ADD CONSTRAINT ck_plano_manutencao_periodo_positivo
      CHECK (periodo > 0) NOT VALID;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.validar_datas_plano_manutencao()
RETURNS TRIGGER AS $$
DECLARE
  data_atual DATE := (CURRENT_TIMESTAMP AT TIME ZONE 'America/Manaus')::date;
BEGIN
  IF NEW.periodo IS NULL OR NEW.periodo < 1 THEN
    RAISE EXCEPTION 'O período deve ser um número inteiro maior que zero.';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.data_inicio::date < data_atual THEN
      RAISE EXCEPTION 'A data de início não pode ser anterior à data atual.';
    END IF;
    IF NEW.data_proxima_execucao < data_atual THEN
      RAISE EXCEPTION 'A próxima execução não pode ser anterior à data atual.';
    END IF;
    IF NEW.data_proxima_execucao < NEW.data_inicio::date THEN
      RAISE EXCEPTION 'A próxima execução não pode ser anterior ao início do plano.';
    END IF;
  ELSE
    IF NEW.data_inicio IS DISTINCT FROM OLD.data_inicio
       AND NEW.data_inicio::date < data_atual THEN
      RAISE EXCEPTION 'A data de início não pode ser anterior à data atual.';
    END IF;

    IF NEW.data_proxima_execucao IS DISTINCT FROM OLD.data_proxima_execucao
       AND NEW.data_proxima_execucao < data_atual THEN
      RAISE EXCEPTION 'A próxima execução não pode ser anterior à data atual.';
    END IF;

    IF (NEW.data_inicio IS DISTINCT FROM OLD.data_inicio
        OR NEW.data_proxima_execucao IS DISTINCT FROM OLD.data_proxima_execucao)
       AND NEW.data_proxima_execucao < NEW.data_inicio::date THEN
      RAISE EXCEPTION 'A próxima execução não pode ser anterior ao início do plano.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_datas_plano_manutencao ON public.plano_manutencao;
CREATE TRIGGER trg_validar_datas_plano_manutencao
BEFORE INSERT OR UPDATE OF data_inicio, data_proxima_execucao, periodo, id_periocidade
ON public.plano_manutencao
FOR EACH ROW
EXECUTE FUNCTION public.validar_datas_plano_manutencao();
