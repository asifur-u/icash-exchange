-- Factory reset. Every desk row goes. Next /admin visit creates the first owner again.

BEGIN;

TRUNCATE "Issuance", "Order", "Sell", "VoucherCode", "WebhookEvent",
         "Product", "AuditLog", "User", "Counter", "DeskSetting"
  RESTART IDENTITY CASCADE;

INSERT INTO "Counter" ("id", "value") VALUES ('desk', 1042);

COMMIT;
