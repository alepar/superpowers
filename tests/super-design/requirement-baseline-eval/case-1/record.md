unchanged:
- Rules owned by other tools in the permissions file are never changed.
- After a default `relay setup` on an ordinary install, the absolute-path form runs every non-`human` relay command without a prompt, as the bare form does.
- `relay human ...` prompts in every form, whether or not that form is allowed.
- Running `relay setup` twice gives the same file.
requirements:
- B1: preserved — a default `relay setup` (rl.4) computes the running relay's digest (`running_relay`, `binary_digest` from rl.2) and each form's digest (`resolve_form` from rl.2) in the same run, and rl.3 writes an allow rule for every form that runs the running relay plus a `human` prompt rule for every form. On an ordinary install bare `relay`, the installed absolute path and the running relay are one file, so both forms are allowed and `human` prompts in both, with no other step; rl.5 checks this. Only a form that runs a different binary loses its allow rule.
