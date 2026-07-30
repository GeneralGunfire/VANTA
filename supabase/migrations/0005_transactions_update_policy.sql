-- Found during the test/verification pass: the transactions table has
-- only ever had a SELECT policy (see 0001_create_transactions.sql) — all
-- writes historically went through parse-transaction's service-role key,
-- which bypasses RLS entirely. Round 2's ledger-correction feature added
-- a client-side .update() call directly against this table
-- (TransactionDetailModal.tsx, after record-correction logs the
-- correction_history row) — that update was silently blocked by RLS the
-- entire time. Live test: editing a transaction's category via the
-- correction flow logged a correction_history row correctly, but the
-- transactions row itself never actually changed; the client-side
-- .select().single() after the blocked update surfaced a "0 rows"
-- PostgREST error, caught and shown as a toast, so the failure was at
-- least visible to the user rather than fully silent — but the
-- correction never actually applied. Run this manually to fix it.
create policy "Allow anon update" on transactions
  for update using (true) with check (true);
