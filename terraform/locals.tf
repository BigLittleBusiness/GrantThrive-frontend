locals {
  name_prefix           = "${var.project_name}-${var.environment}"
  create_prod_resources = var.environment == "prod"
  create_uat_resources  = var.environment == "uat"
  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Repository  = "grantthrive-frontend"
  }

  prod_bucket_name = "prod.${var.domain_name}-frontend"
  uat_bucket_name  = "uat.${var.domain_name}-frontend"
  prod_aliases     = ["app.${var.domain_name}"]
  uat_aliases      = [var.uat_domain_name]
}
