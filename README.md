# GrantThrive Frontend

Unified React and Vite frontend for the GrantThrive platform.

The repository contains one build output that serves multiple app surfaces from route-based entry points:

- Portal (admin, council, community)
- Public marketing pages
- Public map and ROI pages

## Local development

Prerequisites:

- Node.js 22+
- pnpm 10+

Setup:

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Local defaults:

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api (`VITE_API_URL`; the backend must allow the
  frontend origin via `CORS_ORIGINS`)

## API access

All HTTP calls go through the shared client in `src/shared/api/client.js`.
`VITE_API_URL` is the full API base **including** `/api`, and endpoints are passed
relative to it (`api.get('/grants')`). Portal endpoint functions live in
`src/admin-apps/portal/utils/api.js`; login/logout/session verification in
`src/shared/api/session.js`.

## Billing

Council subscriptions use Stripe-hosted Checkout and Customer Portal pages, so the
frontend needs no Stripe keys. Plan selection (`PlanPicker`) and the subscription
card live in `src/admin-apps/portal/components/billing/`. Setup, GST handling and
webhook events are documented in the backend README (section 5).

## Environment files

The build mode controls which env file Vite loads.

- .env.uat
  - VITE_API_URL=https://api.uat.grantthrive.com/api
- .env.production
  - VITE_API_URL=/api (frontend and backend share one domain; the proxy routes `/api/*` to the backend)

## UAT deployment

Infrastructure (CloudFront and S3):

```bash
cd terraform
terraform init
terraform plan -var-file=terraform.uat.tfvars
terraform apply -var-file=terraform.uat.tfvars
```

Application deploy:

```bash
cd ..
AWS_PROFILE=biglittle ./scripts/deploy.sh uat
```

What deploy.sh does:

1. Builds with Vite mode uat.
2. Uploads dist assets to UAT S3 bucket.
3. Invalidates UAT CloudFront distribution.

Verification:

```bash
curl -I https://app.uat.grantthrive.com/
```

## Production deployment

Infrastructure:

```bash
cd terraform
terraform plan -var-file=terraform.prod.tfvars
terraform apply -var-file=terraform.prod.tfvars
```

Application:

```bash
cd ..
AWS_PROFILE=biglittle ./scripts/deploy.sh prod
```

Production serves only `https://app.grantthrive.com` from the dedicated bucket
`prod.grantthrive.com-frontend`. The main `grantthrive.com` / `www.grantthrive.com`
CloudFront distribution is separate and should not be changed by this app stack.

If production returns `403`, first check that the bucket contains assets:

```bash
AWS_PROFILE=biglittle aws s3 ls s3://prod.grantthrive.com-frontend/ --recursive --summarize
```

## Useful commands

```bash
# UAT deploy without rebuilding
AWS_PROFILE=biglittle ./scripts/deploy.sh uat --skip-build

# Production deploy without rebuilding
AWS_PROFILE=biglittle ./scripts/deploy.sh prod --skip-build
```

## GitHub CI/CD

The active GitHub Actions workflow is:

- `.github/workflows/deploy-aws.yml`

The previous EC2 deployment workflow is retained for reference but disabled:

- `.github/workflows/deploy.legacy.disabled`

Branch triggers:

| Branch | Target environment | What runs |
|--------|--------------------|-----------|
| `staging` | UAT | Terraform apply, frontend build, S3 sync, CloudFront invalidation, frontend health check |
| `prod` | Production | Terraform apply, frontend build, S3 sync, CloudFront invalidation, frontend health check |

Manual deployment is also available from GitHub Actions using `workflow_dispatch` with `target_env` set to `uat` or `prod`.

Required GitHub Actions secrets:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

The workflow expects these files to be present in the repository:

```text
terraform/terraform.uat.tfvars
terraform/terraform.prod.tfvars
```

If either tfvars file is intentionally not committed, add a workflow step to generate it from GitHub secrets before `Terraform apply`.

## References

Terraform remote state is managed outside this repo by `../grantthrive-state-management`.

New developers should bootstrap or verify state access before running frontend Terraform:

```bash
cd ../grantthrive-state-management
AWS_PROFILE=biglittle terraform init
AWS_PROFILE=biglittle terraform apply
```

Then initialize this repo's frontend Terraform and select a workspace:

```bash
cd ../GrantThrive-frontend/terraform
AWS_PROFILE=biglittle terraform init
AWS_PROFILE=biglittle terraform workspace select uat || AWS_PROFILE=biglittle terraform workspace new uat
```

- Terraform details: ./terraform/README.md
- Backend repo and deploy flow: ../grantthrive-platform/README.md
- Shared state management: ../grantthrive-state-management/README.md
