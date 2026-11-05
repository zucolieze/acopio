-- El cereal del lote se puede corregir desde el historial. Los cambios quedan
-- registrados por el trigger generico de auditoria de lots.
grant update (name, deleted_at, cereal) on public.lots to authenticated;
