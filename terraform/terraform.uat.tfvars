aws_region      = "ap-southeast-2"
project_name    = "granthrive"
environment     = "uat"
domain_name     = "grantthrive.com"
uat_domain_name = "app.uat.grantthrive.com"
route53_zone_id = "Z09860173N0NGB56RP1JJ"
# CloudFront requires certificate in us-east-1
cloudfront_certificate_arn   = "arn:aws:acm:us-east-1:547154049278:certificate/70414164-6fb1-4419-a7b7-00b4a31505d2"
cloudfront_use_custom_domain = true
force_destroy                = false
