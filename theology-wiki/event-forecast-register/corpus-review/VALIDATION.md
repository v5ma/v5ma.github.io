The September 17, 2026 one-shot collection completed successfully in GitHub Actions run 35269662454. The coverage receipt and index hashes were read from the committed branch output, not inferred from workflow status alone.

The local combined contract run passed 45 tests, failed none, and skipped two large-snapshot checks because the downloaded indexes were held on the GitHub review branch rather than in the local editing environment. Seven collector self-test assertions passed. These local results do not certify the missing local indexes.

An actual local HTTP browser test was attempted. Chromium blocked navigation before page load with ERR_BLOCKED_BY_ADMINISTRATOR. No local browser success is claimed. The committed browser_checks.py runs the same reader against actual HTTP files and explicitly loads both large metadata indexes; it does not use fetch stubs on the normal path.

The read-only Validate Theology corpus review workflow sets REQUIRE_CORPUS=1, so the two snapshot checks must run against the actual committed data. It also runs the real HTTP browser test and retains its report and mobile screenshot. Its actual result, all other repository gates, merge identity and any hosted verification are recorded in the associated pull request after execution.

The original 22-event file, author forecast file, 22-post statement selection and report catalogue remain separate and unchanged. The retired one-shot collection workflow is disabled and has only read permission. No recurring monitoring or master-writing collector remains enabled.
