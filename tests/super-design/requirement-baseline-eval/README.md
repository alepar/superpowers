# Requirement-baseline validation batch

Fixtures for one fresh-context validation batch of the requirement-baseline change. Committed before any reviewer runs; the batch is run once and its results are recorded as observed, with no reruns.

- Source head under test: `75dc33b4e70daf33a3f43a666c7cad3355eb1d1c` (skills unchanged in the working tree at render time).
- Cases, expected outcomes and scoring: `key.md`. Reviewers never see `key.md` or the case names.
- Rendering: `python3 render.py <this dir> <scratch dir> <repo root>`. Coverage cases go through `skills/super-design/scripts/coverage-inputs --from tree.json rl spec-after.md` and the coverage-reviewer-prompt template, with the spec diff and both record fields (`unchanged:`, `requirements:`) in the changes slot. Final-review cases go through `skills/super-code/scripts/dispatch-text final-review --mode single` in a scratch git repo (base = spec only, head = landed code, epic description `Spec: docs/spec.md`, ledger with a Launch line only).
- Run order is shuffled under neutral ids (seed 20261103); 3 reps x 6 cases = 18 runs, one fresh opus agent each.
- S1 in case-3 and case-6 is synthetic (no human stated it); it stands in for a human-approved scope change.

## Source hashes (sha256)

```
0e35889c206be736677db60cd9fe50517510156129354959c38243ddc1613d18  skills/super-design/coverage-reviewer-prompt.md
b648149560c4bbe44bfa215c9af6853550b707bdf50f2c38493c725ba2acd0cd  skills/super-design/scripts/coverage-inputs
e1b863794d8f8348f05050106bcf5d0af89d88358ef7ef62ea0ee8aebae658ed  skills/super-code/coordinator.js
adc0fef3bec6f51940865e75e99abc65169637bdf75ca6da899a9235413d4252  skills/super-code/scripts/dispatch-text.mjs
```

## Fixture hashes (sha256)

```
b3fac3110e6e31b584dc101d69e704a1b5fd02d0b28799a1bf645bd25d80c48c  ./case-1/record.md
285d7d91051ad8c3e606d0148ef45dbc5c25a0d600364506ee4e5e6ed36f46a7  ./case-1/repo/bin/relay
e364931a8afff672985ee99f795e6d8b20ff33c55d71d757ec211ec6689b3c19  ./case-1/repo/relay/__init__.py
c1cefa19a22cb57881f13e47035ef15078499d743a6716d5a546344f28283022  ./case-1/repo/relay/cli.py
8d54618afd7202e0f5afcbf73c7497344aebc8efc4bacc51dcc15c9270371060  ./case-1/repo/relay/forms.py
8b0d817778e324e1d2c416d6cad8beb94cbb2e93074bb925dddad67387acc9fa  ./case-1/repo/relay/install.py
c8603bce2c0645edbe5587fd8c4ed53e8e8dede9b6c6274fa43553cf5f77a470  ./case-1/repo/relay/rules.py
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  ./case-1/repo/tests/__init__.py
bd4e1691fe632439ba9269f9b04c964b5b2fde5043df5b4c00194a34b475b09f  ./case-1/repo/tests/test_setup.py
c62354ae1e587bbd77897ec735f18fb71d0fef920f1b126f532a6938664ad7a9  ./case-1/requirements.md
4c4d5eefd11f4de3e2abd60655695da1d4d6df743279f5494de91a19b69da1c6  ./case-1/spec-after.md
f7eae5efc78e3c9011ef4677fc89471dff16777d4d128de101277ad4f103495a  ./case-1/spec-before.md
7b1f3d99d12dac49a19f1670ab4c35c6ec5dcc8409443461e691fd82338a1168  ./case-1/tree.json
285d7d91051ad8c3e606d0148ef45dbc5c25a0d600364506ee4e5e6ed36f46a7  ./case-2/landed/bin/relay
e364931a8afff672985ee99f795e6d8b20ff33c55d71d757ec211ec6689b3c19  ./case-2/landed/relay/__init__.py
c1cefa19a22cb57881f13e47035ef15078499d743a6716d5a546344f28283022  ./case-2/landed/relay/cli.py
8d54618afd7202e0f5afcbf73c7497344aebc8efc4bacc51dcc15c9270371060  ./case-2/landed/relay/forms.py
2f25feadbafbd4ee4388ae6780a045d3520d9a5a0628480466cd485403cd8d38  ./case-2/landed/relay/install.py
886b0ddfa80d6cd62b5d3d5eef767bb50a673d362b97abd934789983b5f7e7c5  ./case-2/landed/relay/qualify.py
85822dfb496efd88d05fc733222bbd74610f19c3473593ef4f6e1b1a8356f66d  ./case-2/landed/relay/rules.py
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  ./case-2/landed/tests/__init__.py
a777fcb80bef1b46175ce2232ceb80c7573047b5d934fa435720426e6113074f  ./case-2/landed/tests/test_rules.py
c98a8e67ba4eda27f15e5486e00e7149da46cffadbad9dbeee2dea832e6ad5af  ./case-2/landed/tests/test_setup.py
d7932bce08fcdacf2dbf9e76f9eb82fa491441f37691a174e7e6b77f7fe913b2  ./case-2/spec.md
243d10eec3d04b4aa5967a91436633c8b8dd4918f2296d34c7bbaa9ff23bf3e7  ./case-3/record.md
285d7d91051ad8c3e606d0148ef45dbc5c25a0d600364506ee4e5e6ed36f46a7  ./case-3/repo/bin/relay
e364931a8afff672985ee99f795e6d8b20ff33c55d71d757ec211ec6689b3c19  ./case-3/repo/relay/__init__.py
c1cefa19a22cb57881f13e47035ef15078499d743a6716d5a546344f28283022  ./case-3/repo/relay/cli.py
8d54618afd7202e0f5afcbf73c7497344aebc8efc4bacc51dcc15c9270371060  ./case-3/repo/relay/forms.py
8b0d817778e324e1d2c416d6cad8beb94cbb2e93074bb925dddad67387acc9fa  ./case-3/repo/relay/install.py
c8603bce2c0645edbe5587fd8c4ed53e8e8dede9b6c6274fa43553cf5f77a470  ./case-3/repo/relay/rules.py
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  ./case-3/repo/tests/__init__.py
bd4e1691fe632439ba9269f9b04c964b5b2fde5043df5b4c00194a34b475b09f  ./case-3/repo/tests/test_setup.py
c62354ae1e587bbd77897ec735f18fb71d0fef920f1b126f532a6938664ad7a9  ./case-3/requirements.md
0a64ffd77be8a91467bc9387c378a12ff737de1fd9ce9a9098b2b47419182563  ./case-3/spec-after.md
7d400b461896492bbc2f3ee78ab59807ff6b923500e6f43e64f07d37f50951fc  ./case-3/spec-before.md
1fe44c8df789e0d4fa63e0dd9f1cf037ca029bbc5829db798046e62f6b5fea3c  ./case-3/tree.json
285d7d91051ad8c3e606d0148ef45dbc5c25a0d600364506ee4e5e6ed36f46a7  ./case-4/landed/bin/relay
e364931a8afff672985ee99f795e6d8b20ff33c55d71d757ec211ec6689b3c19  ./case-4/landed/relay/__init__.py
474802c3061bceecc592587bbe97fd3e1b62165eeb470c43a6b448d7fafaedca  ./case-4/landed/relay/cli.py
8d54618afd7202e0f5afcbf73c7497344aebc8efc4bacc51dcc15c9270371060  ./case-4/landed/relay/forms.py
88dd635872e3226ce396c12429ed7f0cdd71de803ad2603cc7e2d69498203b83  ./case-4/landed/relay/identity.py
5763bfe039e86405c50a2bc5b4704c10026c505aa07807352193e706b1cada56  ./case-4/landed/relay/install.py
08682665c91ce217693cfa437fcd669ae5aed9e1385c56d03872d732a6011a87  ./case-4/landed/relay/rules.py
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  ./case-4/landed/tests/__init__.py
ef6faf69e93a340a394879b406ce12f99cc456c7b88eb2aa546cf22eb79c4a03  ./case-4/landed/tests/test_identity.py
51a9b87048435cabfc730564f2abec5af124e99abfd9b8030d43d36463c9e4f8  ./case-4/landed/tests/test_setup.py
4c4d5eefd11f4de3e2abd60655695da1d4d6df743279f5494de91a19b69da1c6  ./case-4/spec.md
8c7717de44b7938d7dff26461a96457e36b7929ecde44b0563ba46fa9a270492  ./case-5/record.md
285d7d91051ad8c3e606d0148ef45dbc5c25a0d600364506ee4e5e6ed36f46a7  ./case-5/repo/bin/relay
e364931a8afff672985ee99f795e6d8b20ff33c55d71d757ec211ec6689b3c19  ./case-5/repo/relay/__init__.py
c1cefa19a22cb57881f13e47035ef15078499d743a6716d5a546344f28283022  ./case-5/repo/relay/cli.py
8d54618afd7202e0f5afcbf73c7497344aebc8efc4bacc51dcc15c9270371060  ./case-5/repo/relay/forms.py
8b0d817778e324e1d2c416d6cad8beb94cbb2e93074bb925dddad67387acc9fa  ./case-5/repo/relay/install.py
c8603bce2c0645edbe5587fd8c4ed53e8e8dede9b6c6274fa43553cf5f77a470  ./case-5/repo/relay/rules.py
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  ./case-5/repo/tests/__init__.py
bd4e1691fe632439ba9269f9b04c964b5b2fde5043df5b4c00194a34b475b09f  ./case-5/repo/tests/test_setup.py
c62354ae1e587bbd77897ec735f18fb71d0fef920f1b126f532a6938664ad7a9  ./case-5/requirements.md
d7932bce08fcdacf2dbf9e76f9eb82fa491441f37691a174e7e6b77f7fe913b2  ./case-5/spec-after.md
f7eae5efc78e3c9011ef4677fc89471dff16777d4d128de101277ad4f103495a  ./case-5/spec-before.md
1fe44c8df789e0d4fa63e0dd9f1cf037ca029bbc5829db798046e62f6b5fea3c  ./case-5/tree.json
285d7d91051ad8c3e606d0148ef45dbc5c25a0d600364506ee4e5e6ed36f46a7  ./case-6/landed/bin/relay
e364931a8afff672985ee99f795e6d8b20ff33c55d71d757ec211ec6689b3c19  ./case-6/landed/relay/__init__.py
c1cefa19a22cb57881f13e47035ef15078499d743a6716d5a546344f28283022  ./case-6/landed/relay/cli.py
8d54618afd7202e0f5afcbf73c7497344aebc8efc4bacc51dcc15c9270371060  ./case-6/landed/relay/forms.py
2f25feadbafbd4ee4388ae6780a045d3520d9a5a0628480466cd485403cd8d38  ./case-6/landed/relay/install.py
886b0ddfa80d6cd62b5d3d5eef767bb50a673d362b97abd934789983b5f7e7c5  ./case-6/landed/relay/qualify.py
85822dfb496efd88d05fc733222bbd74610f19c3473593ef4f6e1b1a8356f66d  ./case-6/landed/relay/rules.py
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  ./case-6/landed/tests/__init__.py
a777fcb80bef1b46175ce2232ceb80c7573047b5d934fa435720426e6113074f  ./case-6/landed/tests/test_rules.py
c98a8e67ba4eda27f15e5486e00e7149da46cffadbad9dbeee2dea832e6ad5af  ./case-6/landed/tests/test_setup.py
0a64ffd77be8a91467bc9387c378a12ff737de1fd9ce9a9098b2b47419182563  ./case-6/spec.md
2b9c1a7e2a0e1f9c0e6d3b3ab06d886c9ef43224fb5586be0f47e75355522928  ./key.md
9adde78907cef7254cafb8c726336d906c81a7cc7faa9d9db3b1ba78954e7765  ./render.py
```

## Rendered prompt hashes (sha256, run id -> case in run-map below)

```
910d930bdfdaf2a47093086efc5b00835f8a3a4f993a5a0cdd29e91eeb3c4caa  run-01/prompt.md
e409b36ef269a9916ca11ad3ba9893f5c764b8993b5ff6912fa3da911b98462f  run-02/prompt.md
16274bd27f2381e803c98cede91c2a8c09e367293fd97ec03b18dd2fb8c48204  run-03/prompt.md
a7ed37bad2ac600d9ffd4d03639e3d369f36502ade19de3e079904eb6fdbc5f4  run-04/prompt.md
9fff55c686491ec075a8e0d7ee4955e3c8c5603446f6f7ef4156b1ab7b351443  run-05/prompt.md
77c9d3042c83bc15d1f4376b3ac8c4d68be63e6c0b470a830afa586d40a61af3  run-06/prompt.md
8bf2851c40a9437bc8387428be7aa083272831512e0dc5b9b90af8df6b6ea85c  run-07/prompt.md
0e9844953a5c6bd58ed0e0006825822c2ddc87dc95d3f17026bf90f43a00489e  run-08/prompt.md
2b1f50e1f49bd78a5f5200d66d2d5f1309ac6e3132540bd858cd1fa43b0f93db  run-09/prompt.md
272d60a50d74a80cea6d46942855397be72677371f86a3a90be187d25fdb1e68  run-10/prompt.md
9edb0b857fb96792fc49024490e63209919dde447f191b7582ce72a60d01006a  run-11/prompt.md
cd70453ff6e01f2d1a9c3a7e00bba3680082a9f911b9ba00e2c8b8c346a7cc22  run-12/prompt.md
ae4503eb9e49566896d173e4ccfff188e1bda495d40a64386224e64e90704509  run-13/prompt.md
8bc176fdce73696f38fe7eba78aa1b4a64e5aa71876c83b2b2dce81f5a41c640  run-14/prompt.md
31a56d5f21be9c4ea53e0c325477ca17d2af64c294e72a5baa1eea793d8e14b6  run-15/prompt.md
e599258f276efce91a7f6598c39ebe97494114287aca05ffbcc1f801d4264c32  run-16/prompt.md
b6c2b5e430ce2e2084e47ff94f01dbfdd65dc49f7a57cdf41194366c10641cd2  run-17/prompt.md
a22ddf2b98e8cd594533276b72afdf7031c41d91dc0a8f53a788eb68707b0fab  run-18/prompt.md
```

## Run map

```
run-01 case-2 rep 2
run-02 case-1 rep 2
run-03 case-4 rep 2
run-04 case-2 rep 3
run-05 case-5 rep 1
run-06 case-6 rep 1
run-07 case-5 rep 2
run-08 case-6 rep 2
run-09 case-5 rep 3
run-10 case-1 rep 1
run-11 case-4 rep 3
run-12 case-4 rep 1
run-13 case-2 rep 1
run-14 case-3 rep 1
run-15 case-6 rep 3
run-16 case-3 rep 3
run-17 case-3 rep 2
run-18 case-1 rep 3
```

Rendered prompts embed absolute scratch paths, so their hashes are reproducible only at the same scratch location; the fixture and source hashes are the portable record.
