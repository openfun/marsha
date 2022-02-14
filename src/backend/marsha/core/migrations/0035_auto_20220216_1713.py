# Generated by Django 3.2.11 on 2022-02-16 17:13

import django.contrib.postgres.fields
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone

import marsha.core.models.video


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0034_auto_20220119_0955"),
    ]

    operations = [
        migrations.AddField(
            model_name="liveregistration",
            name="key_access",
            field=models.CharField(
                default=marsha.core.models.video.LiveRegistration.set_random_key_access,
                help_text="Field to build url with encryption to target the record",
                max_length=50,
            ),
        ),
    ]
