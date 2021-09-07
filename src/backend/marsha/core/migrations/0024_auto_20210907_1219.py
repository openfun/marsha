# Generated by Django 3.2.6 on 2021-09-07 12:19

import uuid

import django.contrib.postgres.fields
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone

import marsha.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0023_auto_20210601_0923"),
    ]

    operations = [
        migrations.AddField(
            model_name="video",
            name="starting_at",
            field=models.DateTimeField(
                blank=True,
                help_text="date and time at which a video live is scheduled",
                null=True,
                validators=[marsha.core.validators.validate_date_is_future],
                verbose_name="starting at",
            ),
        ),
    ]
