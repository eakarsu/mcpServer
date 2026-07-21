# Security policy for the reference snapshot

## Supported versions

None. This repository is not a supported product and receives no vulnerability-remediation SLA. It must not be network-exposed or used with production/customer data, provider accounts, secrets, or infrastructure.

## Reporting

Report a suspected credential exposure or vulnerability to the repository owner through an approved private channel. Do not open a public issue containing exploit details, personal data, tokens, environment files, or provider responses. Preserve minimal evidence and rotate/revoke exposed credentials outside this repository.

## Local handling

- Keep all environment files ignored. `.env.example` contains placeholders only.
- Use a disposable non-superuser database and research-only provider account if controlled reproduction is explicitly authorized.
- The reference acknowledgement is a tripwire, not an authorization mechanism or security control.
- Do not bypass the fail-closed entry points in shared, automated, or internet-accessible environments.
- Delete temporary databases, build output, logs, and environment files after research. Review ignored files separately because repository secret scans do not establish that a developer's local ignored configuration is safe.

Gitleaks checks the tracked current tree and Git history in archive-policy CI. The initial snapshot commit has an explicit baseline for seven retired synthetic demo-key findings; future commits are not exempt. A clean configured scan does not change the unsupported status or replace dependency, data-flow, and threat-model review.
