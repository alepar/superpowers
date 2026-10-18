# Captured collection-history mirrors

`dispatch-text review-inputs` normally treats every captured `run.md` as an independent archive owner. A proposal or example containing a copied collection history can explicitly declare that history as a mirror with a sibling `run.md.collection-origin.json`:

```json
{
  "version": 1,
  "kind": "collection-history-mirror",
  "copySha256": "<64 lowercase hex characters: SHA-256 of exact copied run.md bytes>",
  "origin": {
    "commit": "<full ancestor commit of each captured endpoint>",
    "run": "docs/canonical/run.md",
    "sha256": "<64 lowercase hex characters: SHA-256 of source run.md bytes at that commit>"
  }
}
```

The declaration supplies the meaning of the copy. Hashes and captured Git history authenticate its correspondence; they do not establish author intent. There is no automatic inference for undeclared legacy copies. The whole copy and declaration remain ordinary review inputs, including proposal text outside the collection history.

Selection parses every copied collection record normally. Authentication requires valid UTF-8 in copied and source run files, regular captured Git files, safe canonical repository-relative source paths, full source and copy hashes, and an ancestor source commit. The complete, nonempty, ordered raw `- review-collection` line sequence must match the historical source exactly. The endpoint source must retain that sequence as an exact prefix. Additional source history is allowed. Subsets, reordered or reformatted records, self-origins, mirror chains, and ambiguous authoritative histories are refused.

Historical source collections and their claimed files validate at the source commit; historical saved claims must remain in the endpoint source and archive. Endpoint source archives also validate normally. The caller's current pending-intent exception cannot authenticate historical source collections. A mirror cannot be the caller's current run and cannot own a sibling `reviews` file, Git link, or subtree. A captured sibling `reviews` symlink is preserved as ordinary bytes and never followed.

Both captured endpoints authenticate independently. A declaration captured only at head may classify an identical copy already present at base, provided the historical source, ancestry, history, and archives independently validate at base. A missing base copy needs no classification. Different declarations across endpoints, stale hashes, malformed declarations, and orphan declarations produce explicit evidence gaps and grant no omission authority. Uncommitted checkout declarations supply no authority.

Successful authentication records `collectionOrigins` entries in `review-inputs.json` and `generated-input-provenance.md`, including the endpoint revision, copied run path, declaration revision, origin commit/path/hash, copy hash, and collection-record count. Mirrors gain no archive claims. Canonical archives retain their existing validation and omission rules. This recovery mechanism never makes `wholeRangeReady` true and does not dispose of review findings or certify a whole range as accepted.

## Recovery procedure

Preserve the original failed selection directory and its captured base/head revisions. Obtain the exact copy and historical source blobs from Git, compute SHA-256 over their bytes, and check the complete raw collection history and canonical archives before choosing a source commit. Do not derive declaration hashes from an edited checkout.

Add the declaration in a fresh commit, preserving the captured copy and source history. Re-run selection into a new output directory with newly captured revisions; retain both the original failure and the new provenance. A head-only declaration can recover an identical base copy only when all independent base checks pass. Any consumer review or assembly must then recapture its inputs through its caller-owned workflow; a successful selector result does not update or certify an earlier consumer result.
