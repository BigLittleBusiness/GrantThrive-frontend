#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="$ROOT_DIR/terraform"

usage() {
  cat <<EOF
Usage:
  scripts/deploy.sh <prod|uat|staging> [--mode <vite_mode>] [--skip-build]

Examples:
  scripts/deploy.sh prod
  scripts/deploy.sh uat
  scripts/deploy.sh staging
  scripts/deploy.sh uat --mode uat
EOF
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

TARGET_ENV="$1"
shift

VITE_MODE=""
SKIP_BUILD="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      VITE_MODE="$2"
      shift 2
      ;;
    --skip-build)
      SKIP_BUILD="true"
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

case "$TARGET_ENV" in
  prod)
    BUCKET_OUTPUT_KEY="prod_bucket_name"
    DISTRIBUTION_OUTPUT_KEY="prod_distribution_id"
    : "${VITE_MODE:=production}"
    ;;
  uat)
    BUCKET_OUTPUT_KEY="uat_bucket_name"
    DISTRIBUTION_OUTPUT_KEY="uat_distribution_id"
    : "${VITE_MODE:=uat}"
    ;;
  staging)
    BUCKET_OUTPUT_KEY="uat_bucket_name"
    DISTRIBUTION_OUTPUT_KEY="uat_distribution_id"
    : "${VITE_MODE:=staging}"
    TARGET_ENV="uat"
    ;;
  *)
    echo "Environment must be 'prod', 'uat', or 'staging'." >&2
    usage
    exit 1
    ;;
esac

cd "$ROOT_DIR"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required to build the frontend." >&2
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI is required to sync to S3 and invalidate CloudFront." >&2
  exit 1
fi

if [[ "$SKIP_BUILD" != "true" ]]; then
  if [[ ! -d node_modules ]]; then
    pnpm install --frozen-lockfile
  fi

  pnpm exec vite build --mode "$VITE_MODE"
fi

if ! command -v terraform >/dev/null 2>&1; then
  echo "terraform is required to read deployment outputs." >&2
  exit 1
fi

S3_BUCKET_NAME="$(terraform -chdir="$TF_DIR" output -raw "$BUCKET_OUTPUT_KEY")"
CLOUDFRONT_DISTRIBUTION_ID="$(terraform -chdir="$TF_DIR" output -raw "$DISTRIBUTION_OUTPUT_KEY")"

aws s3 sync ./dist "s3://${S3_BUCKET_NAME}" --delete
aws cloudfront create-invalidation \
  --distribution-id "${CLOUDFRONT_DISTRIBUTION_ID}" \
  --paths "/*"

echo "Frontend deployment completed: ${TARGET_ENV}"
echo "Frontend uploaded to s3://${S3_BUCKET_NAME}"
echo "CloudFront invalidated: ${CLOUDFRONT_DISTRIBUTION_ID}"
