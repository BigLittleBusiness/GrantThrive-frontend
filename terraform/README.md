# GrantThrive Frontend Terraform

Provisions AWS frontend infrastructure: S3 buckets, CloudFront CDN, Route 53 DNS, and ACM certificates.

## Quick Overview

**Infrastructure per environment:**

| Component | Production | UAT |
|-----------|-----------|-----|
| **Domain** | `https://app.grantthrive.com` | `https://app.uat.grantthrive.com` |
| **S3 Bucket** | `grantthrive.com-frontend` | `uat.grantthrive.com-frontend` |
| **CloudFront** | E1SHZ1V8U9Z9M1 | (UAT distribution ID) |
| **Build Mode** | `production` | `uat` |

**Key Architecture**:
- Separate S3 buckets per environment (prevents cross-deployment)
- CloudFront with Origin Access Identity (OAI restricts direct S3 access)
- Route 53 aliases pointing custom domains to CloudFront
- ACM certificates in us-east-1 (CloudFront requirement)
- Unified React build supporting multiple environment modes

## Prerequisites

1. **AWS Configuration**:
   - Account ID: `547154049278`
   - Region: `ap-southeast-2`
   - Configure: `aws configure --profile biglittle`

2. **Tools**:
   - Terraform >= 1.6.0
   - AWS CLI >= 2.0

3. **ACM Certificate** (for HTTPS):
   - Must exist in `us-east-1` (CloudFront requirement)
   - Supports domains: `*.grantthrive.com`
   - Update `cloudfront_certificate_arn` in tfvars with ARN

4. **Remote State Setup** (recommended):
   ```bash
   cd ../grantthrive-state-management
   terraform apply
   ```

## Deployment

### Step 1: Initialize

```bash
cd GrantThrive-frontend/terraform
terraform init
```

### Step 2: Plan

```bash
terraform plan -var-file=terraform.uat.tfvars
```

### Step 3: Apply

```bash
terraform apply -var-file=terraform.uat.tfvars
```

**Outputs** (used by deployment script):
- `uat_bucket_name`: S3 bucket name
- `uat_distribution_id`: CloudFront distribution ID for invalidation

## Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `environment` | Environment name | `uat` or `prod` |
| `cloudfront_certificate_arn` | ACM cert in us-east-1 | `arn:aws:acm:us-east-1:...` |
| `route53_zone_id` | Route 53 hosted zone | `Z09860173N0NGB56RP1JJ` |
| `force_destroy` | Allow bucket deletion if not empty | `false` |

## State Management

Remote state in S3 with DynamoDB locking:
- Bucket: `grantthrive-terraform-state-frontend-547154049278`
- Lock table: `grantthrive-terraform-locks`
- Region: `ap-southeast-2`

## Application Deployment

After infrastructure is created, deploy the React application:

```bash
cd ../../  # Go to GrantThrive-frontend root
./scripts/deploy.sh uat
```

Script performs:
1. Reads S3 bucket and CloudFront IDs from terraform outputs
2. Builds React with `pnpm build --mode uat`
3. Syncs `dist/` to S3 with `--delete`
4. Invalidates CloudFront cache with `/*`

## Cleanup

To destroy infrastructure:

```bash
# 1. Empty S3 bucket (CloudFront requirement)
BUCKET_NAME=$(terraform output -raw uat_bucket_name)
aws s3 rm "s3://${BUCKET_NAME}" --recursive

# 2. Destroy infrastructure
terraform destroy -var-file=terraform.uat.tfvars
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Certificate not in us-east-1 | CloudFront requires us-east-1. Create/request cert there |
| Custom domain not resolving | Route 53 propagation takes 5-60 minutes (normal) |
| Old content still being served | CloudFront cache. Run deploy.sh to invalidate |
| 403 Forbidden from CloudFront | Check OAI bucket policy allows CloudFront access |

## Documentation

- **Application**: See [../README.md](../README.md)
- **Backend Terraform**: See [../grantthrive-platform/terraform/README.md](../grantthrive-platform/terraform/README.md)
