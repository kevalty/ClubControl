-- =========================================
-- Fase 6 (módulo 8.11): el comprobante de pago de la SUSCRIPCIÓN SAAS de
-- un club se sube al mismo bucket payment-proofs (path {organization_id}/
-- {archivo}, sin segmento de member_id — las policies existentes solo
-- validan el primer segmento contra el rol del usuario en ese club, así
-- que ya funcionan para esto sin cambios). Lo que faltaba: el
-- platform_admin (dueño de la plataforma SaaS) tiene que poder VER esos
-- comprobantes para aprobar/rechazar el pago desde /admin, sin importar de
-- qué club sean — y la policy de SELECT actual solo cubre staff/member del
-- MISMO club.
-- =========================================

create policy "payment_proofs_select_platform_admin"
on storage.objects for select
using (bucket_id = 'payment-proofs' and private.is_platform_admin());
