# Reference status and provenance record

## Retention decision

**Decision date:** 2026-07-20
**Decision:** retain as a frozen internal reference snapshot.
**Product status:** no supported application, release, service, API, or end-user journey.
**Deployment status:** prohibited until the extraction criteria below are met.

The repository contains a React dashboard, Express/PostgreSQL backend, destructive demo seed, and numerous audit-generated feature/gap scaffolds. That makes the source executable, but it does not establish a maintained product boundary. Safe defaults now fail closed so an ordinary start, development, build, or seed command cannot accidentally present this snapshot as production software.

## Provenance

- Repository origin recorded by Git: `https://github.com/eakarsu/mcpServer`.
- Snapshot baseline inspected: commit `a9e771b24fbc4e00f2e3a73e31818162c2e2f61f`, dated 2026-05-25.
- Local Git history contains seven commits attributed to one author. No separate upstream import declaration, generated-code provenance manifest, release tag, or vendored-source ledger was found.
- `_AUDIT_NOTE.md` identifies several routes and pages as audit-recommended or mechanically generated follow-up scaffolds. Their presence is not acceptance evidence.
- Project license: **none found**. No permission to redistribute, sublicense, or deploy is inferred. Third-party packages retain their own licenses; a future owner must perform a dependency and source-provenance license review.

This record reports what is discoverable; it does not invent missing upstream or copyright facts.

## Ownership and support

| Responsibility | Current assignment |
| --- | --- |
| Product owner | Unassigned |
| Technical maintainer | Unassigned |
| Security patch owner | Unassigned |
| Data/controller owner | Unassigned |
| Release approver | Unassigned |
| Supported version | None |
| Support/SLA | None |

Because these responsibilities are unassigned, the only safe security-patching policy is **no deployment and no real data**. Git authorship and repository ownership are evidence of contribution, not an inferred support commitment.

## Update strategy

The snapshot is frozen. Allowed changes are archival metadata, removal of exposed secrets or unsafe defaults, and policy/test changes that preserve the reference boundary. There is no automatic upstream merge, dependency-update promise, vulnerability-remediation SLA, compatibility policy, or release cadence.

Review the decision at least before any extraction, sharing outside the authorized group, dependency refresh, or use of a live model/provider. Any material source change requires a new provenance/security review and must not silently convert this archive into a product.

## Known reasons it is not deployable

- No assigned owner, license, release artifact, acceptance criteria, migration history, backup/restore contract, test suite, or CI evidence for product behavior.
- A destructive demo seeder creates a known demonstration account and replaces records.
- Broad CORS, browser-local bearer-token handling, generic error disclosure, and many feature scaffolds have not received a production threat-model review.
- External AI routing, tools, webhooks, API-key storage, voice actions, deployment scaffolds, and generated “gap” endpoints are not proven safe or complete.
- Dependency and runtime support windows are not declared. The frontend is based on an old Create React App toolchain.
- Local ignored `.env` files may exist on developer machines; they are not part of the snapshot or CI and must be treated as potentially sensitive.

An exact-lock advisory check on 2026-07-20 confirmed the boundary: the backend install reported 9 findings in total and its production graph reported 7 (4 moderate, 3 high); the frontend production graph reported 55 (10 low, 20 moderate, 23 high, 2 critical). The critical frontend findings were transitive `shell-quote` and `websocket-driver` advisories in the legacy toolchain. These are unresolved blockers, not an accepted risk for deployment. Archive CI surfaces current advisories but does not claim or manufacture a green product dependency gate.

The current tracked tree contains no Gitleaks findings after removing seeded API-key values, seeded webhook secrets, the known demo password, and the obsolete line-number ignore file. Raw Git history retains seven synthetic demo-key findings in the initial snapshot commit `b28292f54e540b673f1352a99f774b7348fce34a`. The configured history gate baselines only that immutable commit; future commits are not exempt. The baseline documents inherited history and is not permission to use any historical value.

## Extraction criteria

If a real product is desired, create a separate repository or top-level product boundary and require all of the following before enabling a default start command:

1. Assign product, technical, security, data, and release owners in writing.
2. Establish source provenance and a compatible project license; inventory generated and third-party code.
3. Define one real user journey, data classification, supported entry point, runtime/version matrix, configuration/secret contract, and deprecation policy.
4. Replace the demo seed and authentication model; add tenant isolation, authorization, rate limits, safe provider/tool boundaries, migrations, backup/restore, observability, and incident response.
5. Add risk-based unit, integration, browser, failure, migration, security, and recovery tests with a release-blocking CI pipeline.
6. Complete dependency, privacy, legal, accessibility, load, and threat-model reviews, then produce a versioned release artifact and rollback plan.

Until all six are satisfied, this directory remains reference material only.
