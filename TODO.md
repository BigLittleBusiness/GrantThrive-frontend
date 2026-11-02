# Current delivery work

- [x] Deliver a Help & Guidance area inside every logged-in GrantThrive workspace.
  - Provide a Top 10 default view for the current user’s role and a full, searchable library of plain-language support guidance.
  - Ensure the interface does not offer a role selector or reveal guidance outside the current user’s permitted cohort.
  - Surface the existing approved support content for System Administrator, Council Administrator, Council Staff / Assessor, Applicant, Community Member, and Public Visitor cohorts according to the platform’s actual account model.

- [x] Add contextual Help links only where the corresponding live function exists.
  - Place links beside staff invitations, reviewer assignment and recusal, analytics export/reporting, subscription changes, application document uploads, and other existing complex controls.
  - Do not imply that imports, quarterly reports, or collaboration controls exist when they are not implemented in the current workspace.

- [x] Preserve GrantThrive platform guardrails in all in-app guidance.
  - Community voting is advisory and non-binding; it cannot decide funding outcomes.
  - AI is advisory only and must never approve, reject, rank, allocate, or otherwise decide funding.
  - Public map locations must be safe, council-approved public locations and must never reveal a private applicant location.
  - Guidance must not bypass tenant scope, approval workflows, access control, or council authority.

Verified 2 November 2026: focused Help component linting, static route/context-link checks, `git diff --check`, and the production frontend build all pass. The knowledge base is requested from the role-filtered API rather than embedded in the frontend bundle.
