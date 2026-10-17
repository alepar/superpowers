# Design distillate

A one-page reference for the Key abstractions designer (`./key-abstractions-prompt.md`), and
only for it. It condenses three research dossiers (Sources, below) in our own words.

## Start from what varies

The Gang of Four authors' own caveat: a pattern buys flexibility by adding indirection, and
indirection makes a design harder to follow. Apply a pattern only when the flexibility it buys
is actually needed. So the first question is not "which pattern?" but "what should be able to
vary?" Design around that answer, and leave fixed what does not vary.

## Two principles

- **Program to an interface, not an implementation.** Callers depend on what an object does,
  not on which concrete type it is.
- **Prefer composition to inheritance.** Build behavior by holding other objects and
  delegating to them. Keep inheritance for true substitution: a subtype that can stand in
  anywhere its parent is used.

## Problem → pattern

| Problem | Pattern |
|---|---|
| Behavior varies by kind, and new kinds keep coming | an interface per kind, chosen in one registry or factory |
| An outside tool or API with its own shape | Adapter |
| A complex subsystem used through a few operations | Facade |
| Behavior added around an object without changing it | Decorator |
| An action to queue, log or undo | Command, often just a closure |
| Behavior driven by a state machine | State, or typestate in Rust |
| Trees of parts handled uniformly | Composite |
| Many listeners to an event | Observer, only when the listeners are genuinely open-ended, with the update order documented |

## Language notes

- A closure instead of a Strategy or Command class, wherever functions are values.
- An enum with `match` instead of Visitor when the set of kinds is fixed.
- In Go, small interfaces defined by the consumer that needs them.
- In Python, protocols for a shared interface.
- Check the target language's version: which of these constructs exist, and which are
  idiomatic, changes between versions.

## When not to

- An interface with one implementation, unless the spec names the next one.
- Layers that only pass calls through.
- Deep hierarchies without real substitution.
- Deduplication that adds mode flags: two plain functions beat one with a `kind` switch.
- Pattern names as a quality signal: naming more patterns does not make a design better.

## Both failure modes

Agent code written without design guidance tends to miss abstractions and blur
responsibilities, so per-kind behavior spreads into branches in every caller. Heavy, specific
design guidance fails the other way, with more classes, layers and coupling than the change
needs. The designer's last two questions balance the two. Walk a likely future change through
the design: it should touch one new type and one registration. And every pattern or layer
names the variation it absorbs.

## Name what you use

Give each new type a responsibility comment that names the pattern or role it plays (an
adapter for an outside tool, the registry that chooses a kind), what it owns, and where new
behavior goes. In controlled maintenance experiments, documenting pattern use was one of the
more consistent positive results.

## Sources

- [D2: type hierarchies and polymorphism](../../docs/superpowers/research/2026-10-07-oop-design/dossiers/D2-hierarchies-polymorphism.md)
- [D3: design patterns](../../docs/superpowers/research/2026-10-07-oop-design/dossiers/D3-design-patterns.md)
- [D9: design guidance for LLM and agent code](../../docs/superpowers/research/2026-10-07-oop-design/dossiers/D9-design-guidance-llm.md)
