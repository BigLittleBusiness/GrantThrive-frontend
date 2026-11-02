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

- [x] Complete the six-cohort Help & Guidance journey and usability audit.
  - Give a professional consultant the Applicant Help & Guidance route without admitting that role to the broader Community workspace or changing any API permission.
  - Keep the Top 10 view as the default and restore it when a user clears a guidance search.
  - Recognise the approved, controlled plain-language search synonyms for reviewer/recusal and vote/voting in the client-side search without collecting search terms.
  - Improve the Help navigation semantics so the page has a single page-level heading and active/mobile navigation is announced to assistive technology.
  - Re-test all six guidance cohorts, every existing contextual topic link, role boundaries, Top 10 behavior, search behavior, and the production build.

- [x] Review help-search measurement without collecting sensitive guidance data.
  - Confirm whether Help & Guidance telemetry currently exists and document a privacy-safe aggregate event design only if measurement is needed.
  - Do not collect typed search text, question/answer content, application data, persistent visitor identifiers, user identifiers, role identifiers, or council identifiers.

Verified 2 November 2026: no Help & Guidance telemetry or analytics SDK/event use exists in the current frontend, so typed search content and identities are not collected. If measurement is later approved, use only aggregate, query-free event buckets. Focused linting, static route/role/topic checks, `git diff --check`, and the production build pass after the Applicant route, Top 10 recovery, controlled synonyms, and accessibility updates.
