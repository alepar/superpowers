## Key abstractions

**Backend** — new protocol, one implementation per backend (`dir`, `zip`, `tar`)
- Owns: everything that differs per backend: the snapshot suffix, writing a snapshot, finding
  the stored snapshots, the availability check.
- Hides: how, and in what format, a backend stores a snapshot.
- Must not: produce user-facing text (`report` owns it, spec D1); parse command-line arguments.
- Relationships: the registry holds one backend per name; commands ask the registry and call
  the backend.
- Lifecycle: created once by the registry at startup, lives for the process, holds no mutable
  state.
- Errors: its own error type; callers can tell "backend unavailable" from a failed write.

**BackendRegistry** — new module, the one place a backend is chosen by name
- Owns: the name → backend table and the list of supported names; unknown names are its error.
- Must not: hold per-backend behavior.

Variation: new backends keep coming → one Backend implementation each, chosen only in the
registry.
Walk-through: adding an object-store backend touches one new module and one registry line.
Per spec D1: `report.label` keeps one branch per backend, deliberately.

Digest:
- Backend: owns all per-backend behavior; new per-backend behavior is added here as a method;
  callers never branch on the backend name.
- BackendRegistry: the only place a backend is chosen by name; a new backend adds one entry.
