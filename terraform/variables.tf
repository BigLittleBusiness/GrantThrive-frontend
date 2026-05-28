variable "aws_region" {
  type        = string
  description = "AWS region for S3 and CloudFront support resources."
  default     = "ap-southeast-2"
}

variable "project_name" {
  type        = string
  description = "Project name used in resource names."
  default     = "granthrive"
}

variable "environment" {
  type        = string
  description = "Environment name."
  default     = "prod"
}

variable "domain_name" {
  type        = string
  description = "Primary frontend domain."
  default     = "grantthrive.com"
}

variable "uat_domain_name" {
  type        = string
  description = "UAT frontend domain."
  default     = "app.uat.grantthrive.com"
}

variable "route53_zone_id" {
  type        = string
  description = "Optional Route 53 hosted zone ID for DNS records."
  default     = ""
}

variable "cloudfront_certificate_arn" {
  type        = string
  description = "ACM certificate ARN in us-east-1 for CloudFront."
}

variable "cloudfront_use_custom_domain" {
  type        = bool
  description = "When false, deploy CloudFront with default domain and no Route53 alias records."
  default     = true
}

variable "force_destroy" {
  type        = bool
  description = "Allow Terraform to destroy buckets without manual emptying."
  default     = false
}