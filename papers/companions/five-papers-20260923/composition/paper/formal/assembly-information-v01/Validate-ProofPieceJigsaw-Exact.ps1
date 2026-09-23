[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$LeafRoot
)

$ErrorActionPreference = 'Stop'

$claimRequired = @(
  'claimId',
  'stage',
  'status',
  'pieceType',
  'scope',
  'provides',
  'requires',
  'objects',
  'constants',
  'quantifiers',
  'equivalenceRelation',
  'projectionInterface',
  'sourceAnchors',
  'forbiddenOverclaims',
  'blockers',
  'downstreamCandidates'
)

$edgeRequired = @(
  'fromClaimId',
  'toClaimId',
  'edgeType',
  'fit',
  'score',
  'matchedRequirements',
  'missingRequirements',
  'scopeConflicts',
  'sourceContinuity',
  'overclaimRisk',
  'reviewRequired',
  'decision'
)

function Test-ObjectFields {
  param(
    [Parameter(Mandatory = $true)]$Object,
    [Parameter(Mandatory = $true)][string[]]$Required
  )
  $names = @($Object.PSObject.Properties.Name)
  @($Required | Where-Object { $names -notcontains $_ })
}

$root = Resolve-Path -LiteralPath $LeafRoot
# Paper-local adapter: same field checks, two exact possible inputs, no search.
$claimFiles = @(Get-Item -LiteralPath (Join-Path $root 'claim-signature.json') -ErrorAction Stop)
$edgePath = Join-Path $root 'compatibility-edges.jsonl'
$edgeFiles = @(if (Test-Path -LiteralPath $edgePath) { Get-Item -LiteralPath $edgePath })

$results = [ordered]@{
  schema = 'dsr.sitProofJigsawValidation.v1'
  generatedAt = (Get-Date).ToString('o')
  leafRoot = $root.Path
  claimFiles = $claimFiles.Count
  edgeFiles = $edgeFiles.Count
  errors = @()
  warnings = @()
}

foreach ($file in $claimFiles) {
  try {
    $json = Get-Content -LiteralPath $file.FullName -Raw | ConvertFrom-Json
    $missing = Test-ObjectFields -Object $json -Required $claimRequired
    if ($missing.Count -gt 0) {
      $results.errors += [ordered]@{
        file = $file.FullName
        kind = 'claim-signature-missing-fields'
        missing = $missing
      }
    }
  } catch {
    $results.errors += [ordered]@{
      file = $file.FullName
      kind = 'claim-signature-invalid-json'
      message = $_.Exception.Message
    }
  }
}

foreach ($file in $edgeFiles) {
  $lineNumber = 0
  foreach ($line in Get-Content -LiteralPath $file.FullName) {
    $lineNumber++
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    try {
      $json = $line | ConvertFrom-Json
      $missing = Test-ObjectFields -Object $json -Required $edgeRequired
      if ($missing.Count -gt 0) {
        $results.errors += [ordered]@{
          file = $file.FullName
          line = $lineNumber
          kind = 'compatibility-edge-missing-fields'
          missing = $missing
        }
      }
      if ($json.PSObject.Properties.Name -contains 'score') {
        $score = [double]$json.score
        if ($score -lt 0 -or $score -gt 1) {
          $results.errors += [ordered]@{
            file = $file.FullName
            line = $lineNumber
            kind = 'compatibility-edge-score-out-of-range'
            score = $json.score
          }
        }
      }
    } catch {
      $results.errors += [ordered]@{
        file = $file.FullName
        line = $lineNumber
        kind = 'compatibility-edge-invalid-json'
        message = $_.Exception.Message
      }
    }
  }
}

if ($claimFiles.Count -eq 0) {
  $results.warnings += [ordered]@{
    kind = 'no-claim-signatures-found'
    message = 'No claim-signature.json files were found under the provided leaf root.'
  }
}

$results.ok = ($results.errors.Count -eq 0)
$results | ConvertTo-Json -Depth 8

if (-not $results.ok) {
  exit 1
}
