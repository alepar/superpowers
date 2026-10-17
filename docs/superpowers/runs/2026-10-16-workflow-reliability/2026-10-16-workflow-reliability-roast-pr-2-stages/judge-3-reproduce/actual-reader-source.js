const recoveryObligations = new Map()
const verificationCompletions = new Map() // independently reviewed no-change basis, not a Git landing
const verificationCandidates = new Set() // a tracker close cannot supply missing acceptance review
const fixHistory = []
const recoveryGaps = []
let recoveryTransportHeld = false // unresolved retained pointers cannot supply a safe admission scope
function recoveryProblem(r) {
  const text = v => typeof v === 'string' && v.trim().length > 0
  if (!r || r.version !== 1) return 'unsupported recovery version'
  if (!text(r.id) || !['hold', 'pending-closure', 'deferred', 'fix'].includes(r.kind)
      || !['record', 'clear'].includes(r.operation) || !text(r.reason)
      || !Array.isArray(r.evidence) || !r.evidence.length || !r.evidence.every(text)
      || !r.data || typeof r.data !== 'object' || Array.isArray(r.data)) return 'invalid recovery fields or missing evidence'
  if (r.data.runFailure !== undefined && !validRunFailure(r.data.runFailure)) return 'invalid run failure history'
  if (r.kind === 'fix' && r.operation !== 'record') return 'fix history is append-only'
  if (r.kind === 'pending-closure' && r.data.verification) {
    const v = r.data.verification
    if (v.reviewStatus !== 'CLEAN' || !text(v.reportPath) || !text(v.reviewPath) || verificationProblem(v, v)) return 'invalid verification completion basis'
  }
  return null
}
function readRecovery(line, digestLine = null) {
  const gap = reason => recoveryGap(line, reason, digestLine)
  let r
  try { r = JSON.parse(line.slice('Recovery:'.length).trim()) } catch { return gap('invalid JSON') }
  const problem = recoveryProblem(r)
  if (problem) return gap(problem)
  if (r.kind === 'pending-closure' && r.data.verification) {
    const text = v => typeof v === 'string' && v.trim().length > 0
    const v = r.data.verification
    verificationCompletions.set(r.id, v)
    if (text(v.reviewBead)) reviewBeadOf.set(r.id, v.reviewBead)
    if (text(v.blockerBead)) blockerBeadOf.set(r.id, v.blockerBead)
  }
  if (r.kind === 'fix') {
    fixHistory.push(r)
  } else if (r.operation === 'clear') recoveryObligations.delete(r.kind + ':' + r.id)
  else recoveryObligations.set(r.kind + ':' + r.id, r)
  return r
}
