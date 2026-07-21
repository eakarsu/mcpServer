# mcpServer reference snapshot

> **Unsupported internal reference — do not deploy, expose to a network, or use with real credentials or data.**

This repository is retained as source material for evaluating an MCP/tool-use dashboard prototype. It is not a supported application or release. The safe default entry points, development commands, build command, and database seed command intentionally exit with status 78.

The controlling decision, provenance record, ownership state, update policy, and extraction criteria are in [REFERENCE_STATUS.md](REFERENCE_STATUS.md). Security handling is in [SECURITY.md](SECURITY.md).

The source can be inspected statically. Controlled reproduction requires an isolated workstation, a disposable PostgreSQL database and tenant, dedicated research-only credentials, explicit acknowledgement via `MCP_REFERENCE_ACKNOWLEDGEMENT=unsupported-reference-only`, and the deliberately named `reference:*` package scripts. The seeder is destructive and the snapshot has no production migration or recovery contract.

Do not interpret a successful frontend build or local launch as a release qualification.
