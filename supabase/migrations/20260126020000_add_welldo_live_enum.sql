-- =======================================================
-- EVENTS GÜNCELLEMESİ - PART 1: ENUM TİPİ
-- =======================================================
-- Bu migration sadece ENUM'a yeni değer ekler.
-- Ayrı bir transaction'da çalışması gerekiyor.

ALTER TYPE "public"."event_type" ADD VALUE IF NOT EXISTS 'welldo_live';
