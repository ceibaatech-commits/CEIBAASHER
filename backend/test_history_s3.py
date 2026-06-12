"""
Test History — S3 archival.

Every completed attempt is uploaded as its own JSON file so each test is a
separate retrievable object:

    s3://{TEST_HISTORY_S3_BUCKET}/{user_id}/{test_id}_{completed_at}.json

Each user gets their own "folder" (key prefix) named by user_id.

Config comes from backend/.env:
    AWS_REGION, AWS_ACCOUNT_ID, AWS_DEFAULT_VPC_ID, TEST_HISTORY_S3_BUCKET
Credentials use the standard boto3 chain (AWS_ACCESS_KEY_ID /
AWS_SECRET_ACCESS_KEY env vars, instance role, etc.). Until credentials are
provided, uploads fail gracefully — MongoDB remains the source of truth.

boto3 is blocking: callers must run these helpers in a threadpool
(see test_history_routes.py — fastapi.concurrency.run_in_threadpool).
"""
import json
import logging
import os
from datetime import datetime

import boto3
from botocore.exceptions import BotoCoreError, ClientError

logger = logging.getLogger(__name__)

AWS_REGION = os.environ.get("AWS_REGION")
S3_BUCKET = os.environ.get("TEST_HISTORY_S3_BUCKET")

_s3_client = None


def _get_client():
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client("s3", region_name=AWS_REGION)
    return _s3_client


def build_s3_key(user_id: str, test_id: str, completed_at: datetime) -> str:
    """{user_id}/{test_id}_{completed_at}.json — filename-safe timestamp."""
    stamp = completed_at.strftime("%Y-%m-%dT%H-%M-%S")
    return f"{user_id}/{test_id}_{stamp}.json"


def upload_test_attempt(doc: dict, key: str) -> bool:
    """Upload one attempt document as an individual JSON object. Best-effort:
    returns False (and logs) on any failure instead of raising."""
    if not S3_BUCKET:
        logger.warning("[test-history] TEST_HISTORY_S3_BUCKET not set — skipping S3 upload")
        return False
    try:
        payload = {k: v for k, v in doc.items() if k != "_id"}
        _get_client().put_object(
            Bucket=S3_BUCKET,
            Key=key,
            Body=json.dumps(payload, default=str).encode("utf-8"),
            ContentType="application/json",
        )
        return True
    except (BotoCoreError, ClientError, Exception) as exc:
        logger.warning("[test-history] S3 upload failed for %s: %s", key, exc)
        return False


def delete_test_attempt(key: str) -> bool:
    """Best-effort removal of the archived JSON when an entry is deleted."""
    if not (S3_BUCKET and key):
        return False
    try:
        _get_client().delete_object(Bucket=S3_BUCKET, Key=key)
        return True
    except (BotoCoreError, ClientError, Exception) as exc:
        logger.warning("[test-history] S3 delete failed for %s: %s", key, exc)
        return False
