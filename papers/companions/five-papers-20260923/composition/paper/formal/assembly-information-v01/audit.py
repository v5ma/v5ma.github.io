"""Audit exact proof inputs/outputs and independently enumerate the toy bound.

No regex, directory enumeration, network, compilation, or external writes.
"""
from hashlib import sha256
from itertools import product
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def sha(path):
    return sha256(path.read_bytes()).hexdigest()


def main():
    checks = {}

    def ck(name, value):
        checks[name] = bool(value)
        if not value:
            raise AssertionError(name)

    source = (ROOT / 'AssemblyInformation.lean').read_text('utf-8')
    receipt = json.loads((ROOT / 'check-04/CHECK.json').read_text('utf-8'))
    output = (ROOT / 'check-04/stdout.txt').read_text('utf-8')
    signature = json.loads((ROOT / 'claim-signature.json').read_text('utf-8'))
    ck('compiler_exit_zero', receipt['exit_code'] == 0 and not receipt['timed_out'])
    ck('unchanged_checked_source', receipt['source_unchanged'] and sha(ROOT/'AssemblyInformation.lean') == receipt['source_sha256'])
    ck('exact_successful_source_copy', sha(ROOT/'check-04/AssemblyInformation.lean') == receipt['source_sha256'])
    ck('exact_runner_copy', sha(ROOT/'check-04/run_check.py') == receipt['runner_sha256'])
    ck('compiler_log_hash', sha(ROOT/'check-04/stdout.txt') == receipt['stdout_sha256'])
    ck('compiler_stderr_hash', sha(ROOT/'check-04/stderr.txt') == receipt['stderr_sha256'])
    ck('pinned_toolchain', receipt['toolchain'] == 'leanprover/lean4:v4.30.0')
    ck('no_compiler_errors', ': error:' not in output and 'sorryAx' not in output)
    names = ['NRCT.'+line.split()[1] for line in source.splitlines() if line.startswith('theorem ')]
    ck('twenty_named_theorems', len(names) == len(set(names)) == 20)
    ck('signature_exact_inventory', names == signature['provides'])
    audit_names = ['NRCT.'+line.removeprefix('#print axioms ').strip()
                   for line in source.splitlines() if line.startswith('#print axioms ')]
    ck('every_theorem_requests_axiom_audit', set(audit_names) == set(names) and len(audit_names) == 20)
    dependencies = {}
    for line in output.splitlines():
        if not line.startswith("'NRCT."):
            continue
        name, remainder = line[1:].split("'", 1)
        if 'does not depend on any axioms' in remainder:
            dependencies[name] = []
        elif 'depends on axioms: [' in remainder:
            body = remainder.split('depends on axioms: [',1)[1].split(']',1)[0]
            dependencies[name] = [a.strip() for a in body.split(',') if a.strip()]
        else:
            raise AssertionError('Unrecognized axiom report: '+line)
    ck('twenty_kernel_dependency_reports', set(dependencies) == set(names))
    permitted = {'Classical.choice', 'propext', 'Quot.sound'}
    ck('only_standard_foundations', all(set(values) <= permitted for values in dependencies.values()))
    # Literal tokenization, not a regex and not a codebase/source search.
    tokens = ''.join(c if c.isalnum() or c == '_' else ' ' for c in source).split()
    banned = {'sorry', 'admit', 'sorryAx', 'axiom', 'unsafe', 'native_decide'}
    ck('no_unchecked_proof_commands', not (set(tokens) & banned))
    imports = [line for line in source.splitlines() if line.startswith('import ')]
    ck('standard_library_only', imports == ['import Std'])
    ck('independent_review_not_claimed', not receipt['independent_review'] and signature['status'] == 'yellow')
    ck('biological_verification_not_claimed', not receipt['biological_verification'])
    # Separate direct arithmetic implementation. No application/Lean evaluator import.
    states = list(product(range(4), repeat=2))
    scores = []
    for table in product(range(3), repeat=4):
        good = 0
        for old, new in states:
            label = 0 if new < old else (1 if new == old else 2)
            index = 2*(old//2) + new//2
            good += table[index] == label
        scores.append(good)
    ck('independent_eighty_one_tables', len(scores) == 81)
    ck('independent_sixteen_states', len(states) == 16)
    ck('independent_optimum_twelve', max(scores) == 12)
    # Canonical equal-bin prediction 1; different bins determine direction.
    candidate = (1, 2, 0, 1)
    count = sum(candidate[2*(old//2)+new//2] == (0 if new < old else (1 if new == old else 2))
                for old, new in states)
    ck('independent_optimal_candidate', count == 12)
    points = [(line_no,line) for line_no,line in enumerate(source.splitlines(),1) if line.startswith('theorem ')]
    report = {
        'status':'PASS_BOUNDED_FORMAL_EVIDENCE_AUDIT', 'passed':sum(checks.values()), 'total':len(checks),
        'checks':checks, 'theorem_dependencies':dependencies,
        'source_sha256':sha(ROOT/'AssemblyInformation.lean'),
        'source_anchors':[{'line':n,'declaration':line} for n,line in points],
        'compiler_receipt_sha256':sha(ROOT/'check-04/CHECK.json'),
        'claim_signature_sha256':sha(ROOT/'claim-signature.json'),
        'audit_source_sha256':sha(Path(__file__)),
        'independent_enumeration':{'state_count':16,'decoder_tables':81,'optimal_correct_count':12,
                                   'correct_count_histogram':{str(k):scores.count(k) for k in sorted(set(scores))}},
        'non_failing_compiler_warnings':output.count(': warning:'),
        'limits':'Same-assistant evidence audit, not independent expert review or proof of Python/biology.'
    }
    (ROOT/'AUDIT.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'passed':report['passed'],'total':report['total'],
                      'theorem_count':len(names),'source_sha256':report['source_sha256'],
                      'exact_optimum':count},indent=2))


if __name__ == '__main__':
    main()
