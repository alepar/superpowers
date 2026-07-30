# Design: Webhook Dispatch Service

## Goal

Deliver outbound webhooks for tenant-configured endpoints with at-least-once semantics, from a single Postgres-backed application, at up to 200 events/sec sustained.

## Architecture

Producers (application services) insert delivery jobs into a `webhook_jobs` table. A pool of worker processes polls the table, renders the payload, and POSTs it to the tenant endpoint. Delivery outcomes are recorded in `webhook_attempts` for the tenant-facing delivery log.

```
app services → webhook_jobs (Postgres) → worker pool → tenant HTTPS endpoint
                                       ↘ webhook_attempts (audit log)
```

## Job intake

- Producers insert jobs in the same transaction as the business change (outbox-style), so a committed business event always has a corresponding job row.
- Each job carries: `tenant_id`, `endpoint_id`, `event_type`, `payload_json`, `not_before` (for scheduled delivery), `attempt_count`.

## Worker scheduling and fairness

To keep one slow tenant from starving the pool, workers do not process jobs strictly FIFO. Each worker claims a batch of up to 50 jobs with `SELECT ... FOR UPDATE SKIP LOCKED`, bounded per tenant. A claim places the batch under a **30-second lease**: the worker stamps `leased_until = now() + 30s` on the claimed rows before releasing the row locks. Workers renew the lease stamp every 10 seconds while still working a batch. The poller's claim query only considers rows where `leased_until IS NULL OR leased_until < now()`, so an expired lease makes the rows eligible for claiming again by any worker on its next poll.

## Delivery

- Worker POSTs with a 10s request timeout, `Idempotency-Key: <job_id>` header.
- 2xx → job row deleted, attempt logged as `delivered`.
- 4xx (except 429) → job row deleted, attempt logged as `rejected`; no retry (the endpoint actively refused).
- 5xx / 429 / timeout → attempt logged as `failed`, `attempt_count` incremented, `not_before` set with exponential backoff + jitter (base 30s, cap 1h, max 10 attempts, then job moved to `webhook_dead_letters`).

## Endpoint management

- Tenants register endpoints with a secret; payloads are signed HMAC-SHA256 with a `X-Signature` header.
- An endpoint failing 100 consecutive deliveries is auto-disabled and the tenant notified by email.

## Observability

- Counter metrics per outcome (`delivered`, `rejected`, `failed`, `dead_lettered`), gauge for oldest unleased ready job age.
- Delivery log queryable by tenants in the dashboard (from `webhook_attempts`).

## Capacity

At 200 events/sec and p50 endpoint latency of 300ms, ~60 concurrent in-flight deliveries; a pool of 4 workers × 25 connections covers this with headroom.
