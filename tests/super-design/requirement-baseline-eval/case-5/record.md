unchanged:
- Rules owned by other tools in the permissions file are never changed.
- The harness checks prompt rules before allow rules, so a `human` prompt rule always takes precedence over an allow rule for the same form.
- Running `relay setup` twice gives the same file.
requirements:
- B1: preserved — `relay setup` (rl.4) writes an allow rule and a `human` prompt rule for bare `relay` and for the installed absolute path once each form's qualification record is `qualified`; rl.3 builds those rules from the records and rl.5 shows both forms allowed with `human` prompted. The qualification step only adds a check that the form runs the intended binary.
