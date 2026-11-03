# Spec

## Goal

Ship the thing.

## Requirement baseline

Source: the human user in the planning session, 2026-11-03.

### Human request

> retries must survive a flaky network

### Requirements

- B1 · "retries survive a flaky network" · source: approved design

### Human scope changes

- S1 · 2026-11-03 · "three retries are enough on mobile" · source: planning session · affects: B1

## Retry policy

Retry five times.

## Unchanged behavior

- The existing CLI stays.
