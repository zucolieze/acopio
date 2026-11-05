-- Cada lote tiene un unico cereal, elegido al crearlo. No se puede editar despues:
-- el grant de update sobre lots sigue limitado a (name, deleted_at).
alter table public.lots
  add column cereal text check (cereal is null or char_length(cereal) between 1 and 40);
