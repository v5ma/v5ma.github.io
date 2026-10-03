# Theology Wiki: Publication History and Verifiable Versions

This guide explains how an external reader can inspect a Theology Wiki article's text, revision history, and recorded dates without relying only on a date printed inside the article. It also records concrete examples already present in the public repository. The guide was added on October 3, 2026; older dates below belong to the older records, not to this guide.

## Open the new discussion

[A Computational View of God, Consciousness, and Theodicy](research-notes/computational-god-consciousness-and-theodicy.md) develops Micah Blumberg's supplied discussion about divine creation, logical possibility, cognitive performance, conscious experience, and alternative implementations of minds.

[The exact first saved text](https://github.com/v5ma/v5ma.github.io/blob/0b136a42c13f06741c5bdc6d65a7ed64f2b364db/theology-wiki/research-notes/computational-god-consciousness-and-theodicy.md) is pinned to commit 0b136a42c13f06741c5bdc6d65a7ed64f2b364db. [The commit record](https://github.com/v5ma/v5ma.github.io/commit/0b136a42c13f06741c5bdc6d65a7ed64f2b364db) records October 3, 2026 at 22:03:29 UTC, or 3:03:29 p.m. Pacific Daylight Time. This initial contents-API commit is unsigned. Its date is correctly described as a Git commit date, not as a verified signature timestamp.

[The article's continuing file history](https://github.com/v5ma/v5ma.github.io/commits/master/theology-wiki/research-notes/computational-god-consciousness-and-theodicy.md) and the linked pull-request records show later publication or revision activity. A subsequent verified merge can attest to the tree containing the article without changing this initial commit's unsigned status. A merge date is not automatically the first date a draft appeared on a public branch.

This addition is a GitHub-readable research page. It does not modify the existing interactive reader's route catalogue, full-text search, narration, article counts, or archival-source files. Do not describe it as a completed main-reader integration merely because its source is in the repository.

## Inspect any existing article

Open the article's source file on GitHub and select History. Each entry opens a commit with its changes and recorded date. Inspect the actual version of the article at the relevant commit, not just the commit message. When a file is generated from editorial source, inspect the canonical editorial file as well as the generated reading copy; rebuilding a file can give it a later revision date without making all of its ideas new.

For example, [Computational Divine Immanence's canonical-source history](https://github.com/v5ma/v5ma.github.io/commits/master/theology-wiki/editorial/authorial-articles/computational-divine-immanence.md) is separate from [the generated article's history](https://github.com/v5ma/v5ma.github.io/commits/master/theology-wiki/content/developed/computational-divine-immanence.md). Both are publicly inspectable.

To preserve a citation to an exact version, open the file and press Y on GitHub, or replace the branch name in its URL with the full commit identifier. A link containing master follows later revisions. A link containing a particular commit identifies that version. Such a permalink fixes which content is being referenced; it does not guarantee that the hosting service will retain the repository forever.

If the commit has a Verified badge, inspect it for GitHub's verification timestamp. The REST API exposes this separately as verified_at. GitHub documents this as a persistent, non-editable verification record within the repository network. A self-selected commit date and the time GitHub verified the signature are different fields.

## Existing verified example: Computational Divine Immanence

The article's canonical source was introduced into the inspected master history by commit c8f33566003263120fe9fe7954d328bf60fdeab1. The inspected record lists GitHub as committer, a valid signature, and verified_at equal to 2026-09-06T21:44:55Z. That is September 6, 2026 at 2:44:55 p.m. Pacific Daylight Time.

[Open the recorded commit](https://github.com/v5ma/v5ma.github.io/commit/c8f33566003263120fe9fe7954d328bf60fdeab1). [Read the canonical source at that commit](https://github.com/v5ma/v5ma.github.io/blob/c8f33566003263120fe9fe7954d328bf60fdeab1/theology-wiki/editorial/authorial-articles/computational-divine-immanence.md). [Read the public article at the same commit](https://github.com/v5ma/v5ma.github.io/blob/c8f33566003263120fe9fe7954d328bf60fdeab1/theology-wiki/content/developed/computational-divine-immanence.md). [Inspect GitHub's machine-readable commit record](https://api.github.com/repos/v5ma/v5ma.github.io/git/commits/c8f33566003263120fe9fe7954d328bf60fdeab1).

The record is useful evidence that GitHub had verified that commit by the recorded time. It is not a claim that the new consciousness-and-theodicy discussion was part of that earlier text, nor does this inspection establish the earliest appearance of every underlying idea anywhere else.

## Existing verified example: Hexagram history

The current master history includes the merge publishing the hexagram article in commit 5ce9d124fa6e2b290dd312604ae641ff022459a2. GitHub lists a valid signature and verified_at equal to 2026-10-02T00:30:17Z, or October 1, 2026 at 5:30:17 p.m. Pacific Daylight Time. The commit date is one second earlier. These two fields should not be silently conflated.

[Open the merge commit](https://github.com/v5ma/v5ma.github.io/commit/5ce9d124fa6e2b290dd312604ae641ff022459a2). [Read the article at that exact commit](https://github.com/v5ma/v5ma.github.io/blob/5ce9d124fa6e2b290dd312604ae641ff022459a2/theology-wiki/comparative-religion/hexagram-star-of-david/READING.md). [Inspect pull request 226](https://github.com/v5ma/v5ma.github.io/pull/226). [Inspect the machine-readable commit record](https://api.github.com/repos/v5ma/v5ma.github.io/git/commits/5ce9d124fa6e2b290dd312604ae641ff022459a2).

## What the different records establish

A date written in an article is editorial metadata. Git's author and committer dates are part of commit data and can be specified when commits are created. They are useful history, but they are not by themselves independent certification of a first-publication time.

A commit identifier connects a record to a specific tree and its files. GitHub's persistent verification record supplies a separately recorded verification time for a signed commit. Public pull-request creation and merge records provide additional platform-recorded events. Each record should be described as the event it actually records, rather than relabeled as an original-composition date.

Verification of a signature concerns the recorded origin and integrity of a commit; it is not verification of the scientific or historical claims within the article. A timestamp also does not, on its own, prove that nobody expressed a similar idea earlier. Repository privacy may change, so a verification time is not automatically evidence of public accessibility at that time. Independent public captures can address that separate question.

For preservation beyond this repository, an independently dated archive or institutional deposit of an exact version can add another record. No external archival capture, DOI deposit, trusted-timestamp service, or legal certification was created by this change. Existing earlier publications should retain their own records rather than receiving a newly invented date.

The two older examples above were inspected individually. They are not a claim that every commit in the entire wiki is signed or that every article's earliest appearance has been audited. This guide makes the verification method and these records accessible without rewriting existing article dates.

## Documentation

GitHub, [Getting permanent links to files](https://docs.github.com/en/repositories/working-with-files/using-files/getting-permanent-links-to-files), explains commit-specific file URLs and the Y keyboard shortcut.

GitHub, [About commit signature verification](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification), explains persistent verification records, verified_at, repository-network scope, and the distinction between signing and other commit metadata.

Git, [git-commit documentation](https://git-scm.com/docs/git-commit), documents the date option and author/committer environment variables. These support the distinction between a Git date and an independently recorded service event.
