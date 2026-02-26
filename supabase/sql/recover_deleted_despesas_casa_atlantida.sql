-- Recuperação de lançamentos deletados para a unidade "Casa Atlântida Lt 12"
-- Execute no SQL editor do Supabase com atenção antes de confirmar.

-- 1) Validar registros deletados disponíveis na auditoria
select
  da.id as audit_id,
  da.changed_at,
  da.old_data->>'descricao_original' as descricao,
  da.old_data->>'valor' as valor,
  da.old_data->>'casa_id' as casa_id
from public.despesas_audit da
where da.action = 'DELETE'
  and da.old_data->>'casa_id' in (
    select id::text from public.casas where nome_casa = 'Casa Atlântida Lt 12'
  )
order by da.changed_at desc;

-- 2) Recriar os lançamentos deletados da auditoria
insert into public.despesas (
  user_id,
  casa_id,
  categoria_id,
  descricao_normalizada,
  descricao_original,
  quantidade,
  valor_unitario,
  valor,
  observacao,
  nota_fiscal_url,
  data_lancamento,
  responsavel_id,
  data_da_compra
)
select
  coalesce((da.old_data->>'user_id')::uuid, auth.uid()),
  (da.old_data->>'casa_id')::uuid,
  (da.old_data->>'categoria_id')::uuid,
  coalesce(da.old_data->>'descricao_normalizada', ''),
  coalesce(da.old_data->>'descricao_original', ''),
  coalesce((da.old_data->>'quantidade')::numeric, 1),
  coalesce((da.old_data->>'valor_unitario')::numeric, 0),
  coalesce((da.old_data->>'valor')::numeric, 0),
  da.old_data->>'observacao',
  da.old_data->>'nota_fiscal_url',
  coalesce((da.old_data->>'data_lancamento')::timestamptz, now()),
  coalesce((da.old_data->>'responsavel_id')::uuid, (da.old_data->>'user_id')::uuid, auth.uid()),
  (da.old_data->>'data_da_compra')::date
from public.despesas_audit da
where da.action = 'DELETE'
  and da.old_data->>'casa_id' in (
    select id::text from public.casas where nome_casa = 'Casa Atlântida Lt 12'
  );

-- 3) Conferência final
select id, descricao_original, valor, data_lancamento, responsavel_id
from public.despesas
where casa_id in (
  select id from public.casas where nome_casa = 'Casa Atlântida Lt 12'
)
order by data_lancamento;
