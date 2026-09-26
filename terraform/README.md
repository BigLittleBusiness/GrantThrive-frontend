# GrantThrive Frontend Terraform

Provisions the frontend S3, CloudFront, ACM, and Route 53 resources for UAT and production.

## Current Environments

| Component | UAT | Production |
|-----------|-----|------------|
| Frontend URL | `https://app.uat.grantthrive.com` | `https://app.grantthrive.com` |
| API used by build | `https://api.uat.grantthrive.com/api` | `https://api.grantthrive.com/api` |
| S3 bucket | `uat.grantthrive.com-frontend` | `prod.grantthrive.com-frontend` |
| CloudFront distribution | `E2OQMHSAPRGW8W` | `E3NKMGEC23PONN` |
| Vite mode | `uat` | `production` |

The main domain distribution `E3LRHNA8S8NESA` is for `grantthrive.com` / `www.grantthrive.com` and is not managed by this frontend app stack.

## DNS and Certificates

- UAT frontend DNS: `app.uat.grantthrive.com`
- Production frontend DNS: `app.grantthrive.com`
- CloudFront certificate must be in `us-east-1`.
- The current certificate covers `*.grantthrive.com` and `*.uat.grantthrive.com`.
- This stack must not attach `grantthrive.com` or `www.grantthrive.com` aliases.

## Terraform Workflow

Remote state is required before running this repo. If the state buckets/table do not exist, bootstrap them first:

```bash
cd ../../grantthrive-state-management
AWS_PROFILE=biglittle terraform init
AWS_PROFILE=biglittle terraform apply
```

```bash
cd GrantThrive-frontend/terraform
AWS_PROFILE=biglittle terraform init
```

Apply UAT:

```bash
AWS_PROFILE=biglittle terraform workspace select uat || AWS_PROFILE=biglittle terraform workspace new uat
AWS_PROFILE=biglittle terraform apply -var-file=terraform.uat.tfvars
```

Apply production:

```bash
AWS_PROFILE=biglittle terraform workspace select prod || AWS_PROFILE=biglittle terraform workspace new prod
AWS_PROFILE=biglittle terraform apply -var-file=terraform.prod.tfvars
```

Useful outputs:

```bash
AWS_PROFILE=biglittle terraform output
```

Expected production outputs:

- `prod_bucket_name = "prod.grantthrive.com-frontend"`
- `prod_distribution_id = "E3NKMGEC23PONN"`
- `prod_domain_name = "dzw849nenqbvd.cloudfront.net"`

## Application Deployment

Deploy UAT:

```bash
cd GrantThrive-frontend
AWS_PROFILE=biglittle ./scripts/deploy.sh uat
```

Deploy production:

```bash
cd GrantThrive-frontend
AWS_PROFILE=biglittle ./scripts/deploy.sh prod
```

The deploy script:

1. Builds the React app with the environment mode (`uat` or `production`).
2. Reads the S3 bucket and CloudFront distribution from Terraform outputs.
3. Syncs `dist/` to the environment bucket with `--delete`.
4. Creates a CloudFront invalidation for `/*`.

The script uses `./node_modules/.bin/vite` when available. This avoids `pnpm exec` fetch delays on machines where Corepack/pnpm is slow or trying to fetch metadata.

Manual production deploy steps, useful for debugging:

```bash
cd GrantThrive-frontend
./node_modules/.bin/vite build --mode production
AWS_PROFILE=biglittle aws s3 sync ./dist s3://prod.grantthrive.com-frontend --delete
AWS_PROFILE=biglittle aws cloudfront create-invalidation --distribution-id E3NKMGEC23PONN --paths '/*'
```

## Validation

Check frontend HTTP status:

```bash
curl -I https://app.uat.grantthrive.com
curl -I https://app.grantthrive.com
```

Check bucket contents if CloudFront returns `403`:

```bash
AWS_PROFILE=biglittle aws s3 ls s3://uat.grantthrive.com-frontend/ --recursive --summarize
AWS_PROFILE=biglittle aws s3 ls s3://prod.grantthrive.com-frontend/ --recursive --summarize
```

If `Total Objects: 0`, the issue is missing uploaded assets, not DNS or CloudFront aliases. Build and sync the app, then invalidate CloudFront.

Check CloudFront aliases:

```bash
AWS_PROFILE=biglittle aws cloudfront get-distribution \
  --id E3NKMGEC23PONN \
  --query 'Distribution.{Status:Status,Aliases:DistributionConfig.Aliases.Items,Origins:DistributionConfig.Origins.Items[*].DomainName}'
```

Production should show only `app.grantthrive.com` as an alias for this app distribution.

## State

Remote state:

- Bucket: `grantthrive-terraform-state-frontend-547154049278`
- Lock table: `grantthrive-terraform-locks`
- Region: `ap-southeast-2`
- Backend config file: `backend.tf`

This repo uses Terraform workspaces. State is stored in the frontend state bucket using Terraform's default workspace prefix:

| Workspace | S3 object |
|-----------|-----------|
| `uat` | `env:/uat/terraform.tfstate` |
| `prod` | `env:/prod/terraform.tfstate` |

Do not run this stack from the default workspace. Always select `uat` or `prod` before `plan`, `apply`, `destroy`, or `state` commands.

Useful state commands:

```bash
AWS_PROFILE=biglittle terraform workspace list
AWS_PROFILE=biglittle terraform workspace select prod
AWS_PROFILE=biglittle terraform state list
AWS_PROFILE=biglittle aws s3api list-object-versions \
  --bucket grantthrive-terraform-state-frontend-547154049278 \
  --prefix 'env:/prod/terraform.tfstate'
```

If Terraform reports a stale lock, first verify no apply is running. Then prefer:

```bash
AWS_PROFILE=biglittle terraform force-unlock <LOCK_ID>
```

The state-management repo documents the shared buckets, lock table, and recovery process:

```bash
../../grantthrive-state-management/README.md
```

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `app.grantthrive.com` returns `403` | S3 bucket is empty or `index.html` missing | Run frontend deploy or manual S3 sync |
| CloudFront alias conflict | Apex/www aliases attached to another distribution | Keep this stack limited to `app.grantthrive.com` |
| Certificate error | CloudFront certificate is not in `us-east-1` | Use the us-east-1 ACM certificate ARN |
| Old frontend content | CloudFront cache | Create invalidation for `/*` |
