# Generated by Django 3.2.10 on 2021-12-20 12:03
import uuid

import django.contrib.postgres.fields
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


def migrate_anonumous(apps, schema_editor):
    """Update existing records to set anonymous_id to a default UUID."""
    Liveregistrations = apps.get_model("core", "Liveregistration")
    Liveregistrations.objects.filter(
        anonymous_id__isnull=True, consumer_site__isnull=True
    ).update(anonymous_id=uuid.uuid4())


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0030_auto_20211215_1224"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="liveregistration",
            name="liveregistration_lti_or_public",
        ),
        migrations.AddField(
            model_name="liveregistration",
            name="anonymous_id",
            field=models.UUIDField(blank=True, db_index=True, null=True),
        ),
        migrations.AddField(
            model_name="liveregistration",
            name="display_username",
            field=models.CharField(
                blank=True,
                db_index=True,
                max_length=155,
                null=True,
                verbose_name="Display username",
            ),
        ),
        migrations.AddConstraint(
            model_name="liveregistration",
            constraint=models.CheckConstraint(
                check=models.Q(
                    models.Q(
                        ("consumer_site__isnull", False),
                        ("lti_id__isnull", False),
                        ("lti_user_id__isnull", False),
                    ),
                    models.Q(
                        ("anonymous_id__isnull", False),
                        ("consumer_site__isnull", True),
                        ("lti_id__isnull", True),
                        ("lti_user_id__isnull", True),
                        ("username__isnull", True),
                    ),
                    _connector="OR",
                ),
                name="liveregistration_lti_or_public",
            ),
        ),
        migrations.AddConstraint(
            model_name="liveregistration",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted", None)),
                fields=("display_username", "video"),
                name="liveregistration_unique_video_display_username",
            ),
        ),
        migrations.AddConstraint(
            model_name="liveregistration",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted", None)),
                fields=("anonymous_id", "video"),
                name="liveregistration_unique_video_anonymous_id",
            ),
        ),
    ]
