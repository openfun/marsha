"""Check video in harvested state management command."""
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db.models import Q
from django.utils import timezone

import boto3

from marsha.core.defaults import DELETED, HARVESTED, PENDING
from marsha.core.models import Video


aws_credentials = {
    "aws_access_key_id": settings.AWS_ACCESS_KEY_ID,
    "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY,
    "region_name": settings.AWS_S3_REGION_NAME,
}

# Configure medialive client
s3_client = boto3.client("s3", **aws_credentials)


def generate_expired_date():
    """Generate a datetime object NB_DAYS_BEFORE_DELETING_LIVE_RECORDINGS days in the past."""
    return timezone.now() - timedelta(
        days=settings.NB_DAYS_BEFORE_DELETING_LIVE_RECORDINGS
    )


class Command(BaseCommand):
    """Check every video in ready and remove them if they are too old."""

    help = (
        "Check every video having ready upload state and remove them if "
        "they are too old."
    )

    def handle(self, *args, **options):
        """Execute management command."""
        expired_date = generate_expired_date()
        videos = Video.objects.filter(
            Q(live_state=HARVESTED, upload_state=PENDING, starting_at__lte=expired_date)
            | Q(
                live_state=HARVESTED,
                upload_state=PENDING,
                starting_at__isnull=True,
                uploaded_on__lte=expired_date,
            ),
        )
        for video in videos:
            # For each video ready we check the updated_at value and if it's
            # setting.NB_DAYS_BEFORE_DELETING_LIVE_RECORDINGS old, the video must be put
            # offline and all related objects on aws removed.
            self.stdout.write(f"Processing video {video.id}")
            self._delete_video_objects(video)
            video.upload_state = DELETED
            video.save()

    def _delete_video_objects(self, video, continuation_token=None):
        """Fetch all existing objects for a given video."""
        params = {
            "Bucket": settings.AWS_DESTINATION_BUCKET_NAME,
            "Prefix": str(video.pk),
        }
        if continuation_token:
            params["ContinuationToken"] = continuation_token

        data = s3_client.list_objects_v2(**params)

        if data.get("KeyCount") == 0:
            return

        s3_objects = []
        for s3_object in data.get("Contents"):
            s3_objects.append({"Key": s3_object.get("Key")})

        s3_client.delete_objects(
            Bucket=settings.AWS_DESTINATION_BUCKET_NAME,
            Delete={"Objects": s3_objects},
        )

        if data.get("IsTruncated"):
            self._delete_video_objects(video, data.get("NextContinuationToken"))
