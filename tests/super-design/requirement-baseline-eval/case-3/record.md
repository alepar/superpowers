unchanged:
- Rules owned by other tools in the permissions file are never changed.
- The harness checks prompt rules before allow rules, so a `human` prompt rule always takes precedence over an allow rule for the same form.
- Running `relay setup` twice gives the same file.
requirements:
- B1: changed — `relay setup` (rl.4) now publishes no allow rule and no `human` prompt rule for a form until that form's qualification record is `qualified`, as S1 directs; until then every relay command in that form prompts. Once a record is `qualified`, rl.3 builds an allow rule and a `human` prompt rule for that form and rl.4 writes them.
