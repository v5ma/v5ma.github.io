"""Exact/synthetic analysis safeguards, not biological measurements."""

from itertools import product
import json
from math import exp, isclose
from pathlib import Path


def mean(xs):
    return sum(xs) / len(xs)


def covariance(xs, ys):
    mx, my = mean(xs), mean(ys)
    return mean([(x - mx) * (y - my) for x, y in zip(xs, ys)])


def eligibility_at(t, start, end, rate, tau):
    if t <= start:
        return 0.0
    clipped_end = min(t, end)
    return rate * tau * (1 - exp(-(clipped_end - start) / tau)) * exp(-(t - clipped_end) / tau)


def run():
    cases = list(product((-1.0, 1.0), repeat=4))
    baseline = [u + e0 for u, e0, _, _ in cases]
    post = [u + e1 for u, _, e1, _ in cases]
    change = [p - b for p, b in zip(post, baseline)]
    baseline_variance = covariance(baseline, baseline)
    slope = covariance(baseline, change) / baseline_variance
    independent_baseline = [u + e2 for u, _, _, e2 in cases]
    independent_slope = covariance(independent_baseline, change) / covariance(independent_baseline, independent_baseline)

    area = 1.0
    duration = 2.0
    tau = 1.0
    early_t = duration / 4
    late_t = duration
    long_early = eligibility_at(early_t, 0.0, duration, area / duration, tau)
    short_early = eligibility_at(early_t, duration / 2, duration, 2 * area / duration, tau)
    long_late = eligibility_at(late_t, 0.0, duration, area / duration, tau)
    short_late = eligibility_at(late_t, duration / 2, duration, 2 * area / duration, tau)

    checks = {
        "all_cases_no_true_learning": all(p - b == e1 - e0 for (u, e0, e1, e2), p, b in zip(cases, post, baseline)),
        "shared_baseline_covariance_negative_one": covariance(baseline, change) == -1.0,
        "baseline_variance_two": baseline_variance == 2.0,
        "spurious_slope_negative_half": slope == -0.5,
        "independent_baseline_slope_zero": independent_slope == 0.0,
        "equal_long_short_total_area": isclose((area / duration) * duration, (2 * area / duration) * (duration / 2)),
        "early_instruction_long_positive": long_early > 0,
        "early_instruction_short_zero": short_early == 0,
        "late_instruction_short_greater": short_late > long_late,
        "long_analytic_formula": isclose(long_late, (area * tau / duration) * (1 - exp(-duration / tau))),
        "short_analytic_formula": isclose(short_late, (2 * area * tau / duration) * (1 - exp(-duration / (2 * tau)))),
        "equal_area_not_equal_eligibility": not isclose(short_late, long_late),
    }
    result = {"scope": "Exact finite change-score and analytic eligibility counterexamples; no biological data",
              "shared_baseline": {"covariance": covariance(baseline, change), "slope": slope,
                                  "independent_baseline_slope": independent_slope},
              "eligibility": {"early_long": long_early, "early_short": short_early,
                              "late_long": long_late, "late_short": short_late},
              "checks": checks, "passed": sum(checks.values()), "total": len(checks),
              "all_pass": all(checks.values())}
    output = Path(__file__).resolve().parent / "results" / "RESULT.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(f"{result['passed']}/{result['total']} checks; all_pass={result['all_pass']}")
    if not result["all_pass"]:
        raise SystemExit(1)


if __name__ == "__main__":
    run()
