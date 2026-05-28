output "prod_bucket_name" {
  value       = try(aws_s3_bucket.prod[0].bucket, null)
  description = "Production S3 bucket name."
}

output "uat_bucket_name" {
  value       = try(aws_s3_bucket.uat[0].bucket, null)
  description = "UAT S3 bucket name."
}

output "prod_distribution_id" {
  value       = try(aws_cloudfront_distribution.prod[0].id, null)
  description = "Production CloudFront distribution ID."
}

output "uat_distribution_id" {
  value       = try(aws_cloudfront_distribution.uat[0].id, null)
  description = "UAT CloudFront distribution ID."
}

output "prod_domain_name" {
  value       = try(aws_cloudfront_distribution.prod[0].domain_name, null)
  description = "Production CloudFront domain name."
}

output "uat_domain_name" {
  value       = try(aws_cloudfront_distribution.uat[0].domain_name, null)
  description = "UAT CloudFront domain name."
}