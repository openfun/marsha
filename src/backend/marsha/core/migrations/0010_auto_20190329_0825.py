# Generated by Django 2.0 on 2019-03-29 08:25

import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [("core", "0009_auto_20190305_0819")]

    operations = [
        migrations.CreateModel(
            name="Thumbnail",
            fields=[
                ("deleted", models.DateTimeField(editable=False, null=True)),
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        help_text="primary key for the record as UUID",
                        primary_key=True,
                        serialize=False,
                        verbose_name="id",
                    ),
                ),
                (
                    "created_on",
                    models.DateTimeField(
                        auto_now_add=True,
                        help_text="date and time at which a record was created",
                        verbose_name="created on",
                    ),
                ),
                (
                    "updated_on",
                    models.DateTimeField(
                        auto_now=True,
                        help_text="date and time at which a record was last updated",
                        verbose_name="updated on",
                    ),
                ),
                (
                    "uploaded_on",
                    models.DateTimeField(
                        blank=True,
                        help_text="datetime at which the active version of the resource was uploaded.",
                        null=True,
                        verbose_name="uploaded on",
                    ),
                ),
                (
                    "upload_state",
                    models.CharField(
                        choices=[
                            ("pending", "pending"),
                            ("processing", "processing"),
                            ("error", "error"),
                            ("ready", "ready"),
                        ],
                        default="pending",
                        help_text="state of the upload in AWS.",
                        max_length=20,
                        verbose_name="upload state",
                    ),
                ),
            ],
            options={
                "verbose_name": "thumbnail",
                "db_table": "video_thumbnail",
                "ordering": ["-created_on", "id"],
            },
        ),
        migrations.AddField(
            model_name="Thumbnail",
            name="video",
            field=models.OneToOneField(
                help_text="video for which this thumbnail is",
                on_delete=django.db.models.deletion.CASCADE,
                related_name="thumbnail",
                to="core.Video",
                verbose_name="video",
            ),
        ),
    ]
