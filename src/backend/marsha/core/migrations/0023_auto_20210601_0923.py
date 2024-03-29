# Generated by Django 3.2 on 2021-06-01 09:23

import django.contrib.postgres.fields
from django.db import migrations, models
import django.utils.timezone

from ..defaults import RAW


def migrate_live_type(apps, schema_editor):
    """Migrate the live type info into the live_type field."""
    Video = apps.get_model("core", "Video")
    videos_to_migrate = Video.objects.filter(live_state__isnull=False)
    for video in videos_to_migrate:
        video.live_type = video.live_info.get("type", RAW)
        video.save()


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0022_make_lti_id_optional"),
    ]

    operations = [
        migrations.AddField(
            model_name="video",
            name="live_type",
            field=models.CharField(
                blank=True,
                choices=[("raw", "raw"), ("jitsi", "jitsi")],
                help_text="live type.",
                max_length=20,
                null=True,
                verbose_name="live type",
            ),
        ),
        migrations.RunPython(migrate_live_type),
        migrations.AddConstraint(
            model_name="video",
            constraint=models.CheckConstraint(
                check=django.db.models.expressions.RawSQL(
                    "(live_state IS NULL) = (live_type IS NULL)",
                    {},
                    models.BooleanField(),
                ),
                name="live_type_check",
            ),
        ),
    ]
