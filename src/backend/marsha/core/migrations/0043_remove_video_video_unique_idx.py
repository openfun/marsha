# Generated by Django 4.0.3 on 2022-04-11 15:38

from django.conf import settings
import django.contrib.postgres.fields
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0042_remove_video_resource_id_livesession_must_notify_and_more"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="video",
            name="video_unique_idx",
        ),
    ]
