resource "aws_s3_bucket" "prod" {
  count         = local.create_prod_resources ? 1 : 0
  bucket        = local.prod_bucket_name
  force_destroy = var.force_destroy
}

resource "aws_s3_bucket_versioning" "prod" {
  count  = local.create_prod_resources ? 1 : 0
  bucket = aws_s3_bucket.prod[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "prod" {
  count                   = local.create_prod_resources ? 1 : 0
  bucket                  = aws_s3_bucket.prod[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "prod" {
  count  = local.create_prod_resources ? 1 : 0
  bucket = aws_s3_bucket.prod[0].id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket" "uat" {
  count         = local.create_uat_resources ? 1 : 0
  bucket        = local.uat_bucket_name
  force_destroy = var.force_destroy
}

resource "aws_s3_bucket_versioning" "uat" {
  count  = local.create_uat_resources ? 1 : 0
  bucket = aws_s3_bucket.uat[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "uat" {
  count                   = local.create_uat_resources ? 1 : 0
  bucket                  = aws_s3_bucket.uat[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "uat" {
  count  = local.create_uat_resources ? 1 : 0
  bucket = aws_s3_bucket.uat[0].id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_cloudfront_origin_access_identity" "prod" {
  count   = local.create_prod_resources ? 1 : 0
  comment = "${local.name_prefix} prod"
}

resource "aws_cloudfront_origin_access_identity" "uat" {
  count   = local.create_uat_resources ? 1 : 0
  comment = "${local.name_prefix} UAT"
}

resource "aws_s3_bucket_policy" "prod" {
  count  = local.create_prod_resources ? 1 : 0
  bucket = aws_s3_bucket.prod[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowCloudFrontRead"
      Effect = "Allow"
      Principal = {
        AWS = aws_cloudfront_origin_access_identity.prod[0].iam_arn
      }
      Action   = ["s3:GetObject"]
      Resource = "${aws_s3_bucket.prod[0].arn}/*"
    }]
  })
}

resource "aws_s3_bucket_policy" "uat" {
  count  = local.create_uat_resources ? 1 : 0
  bucket = aws_s3_bucket.uat[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowCloudFrontRead"
      Effect = "Allow"
      Principal = {
        AWS = aws_cloudfront_origin_access_identity.uat[0].iam_arn
      }
      Action   = ["s3:GetObject"]
      Resource = "${aws_s3_bucket.uat[0].arn}/*"
    }]
  })
}

resource "aws_cloudfront_distribution" "prod" {
  count               = local.create_prod_resources ? 1 : 0
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "GrantThrive frontend production"
  aliases             = local.prod_aliases
  default_root_object = "index.html"

  origin {
    domain_name = aws_s3_bucket.prod[0].bucket_regional_domain_name
    origin_id   = "prod-s3"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.prod[0].cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "prod-s3"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }
  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = var.cloudfront_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

resource "aws_cloudfront_distribution" "uat" {
  count               = local.create_uat_resources ? 1 : 0
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "GrantThrive frontend UAT"
  aliases             = var.cloudfront_use_custom_domain ? local.uat_aliases : []
  default_root_object = "index.html"

  origin {
    domain_name = aws_s3_bucket.uat[0].bucket_regional_domain_name
    origin_id   = "uat-s3"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.uat[0].cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "uat-s3"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }
  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn            = var.cloudfront_use_custom_domain ? var.cloudfront_certificate_arn : null
    ssl_support_method             = var.cloudfront_use_custom_domain ? "sni-only" : null
    minimum_protocol_version       = var.cloudfront_use_custom_domain ? "TLSv1.2_2021" : "TLSv1"
    cloudfront_default_certificate = var.cloudfront_use_custom_domain ? false : true
  }
}

resource "aws_route53_record" "prod_alias" {
  count   = var.route53_zone_id == "" ? 0 : (local.create_prod_resources ? 1 : 0)
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.prod[0].domain_name
    zone_id                = aws_cloudfront_distribution.prod[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www_alias" {
  count   = var.route53_zone_id == "" ? 0 : (local.create_prod_resources ? 1 : 0)
  zone_id = var.route53_zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.prod[0].domain_name
    zone_id                = aws_cloudfront_distribution.prod[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "app_alias" {
  count   = var.route53_zone_id == "" ? 0 : (local.create_prod_resources ? 1 : 0)
  zone_id = var.route53_zone_id
  name    = "app.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.prod[0].domain_name
    zone_id                = aws_cloudfront_distribution.prod[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "uat_alias" {
  count   = var.route53_zone_id == "" ? 0 : (local.create_uat_resources && var.cloudfront_use_custom_domain ? 1 : 0)
  zone_id = var.route53_zone_id
  name    = var.uat_domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.uat[0].domain_name
    zone_id                = aws_cloudfront_distribution.uat[0].hosted_zone_id
    evaluate_target_health = false
  }
}