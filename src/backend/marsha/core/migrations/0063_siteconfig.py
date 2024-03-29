# Generated by Django 4.1.9 on 2023-06-06 07:48

import uuid

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone

import marsha.core.fields


class Migration(migrations.Migration):
    dependencies = [
        ("sites", "0002_alter_domain_unique"),
        ("core", "0062_alter_video_active_shared_live_media"),
    ]

    operations = [
        migrations.CreateModel(
            name="SiteConfig",
            fields=[
                (
                    "deleted",
                    models.DateTimeField(db_index=True, editable=False, null=True),
                ),
                (
                    "deleted_by_cascade",
                    models.BooleanField(default=False, editable=False),
                ),
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
                        default=django.utils.timezone.now,
                        editable=False,
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
                    "inactive_resources",
                    marsha.core.fields.InvertedArrayField(
                        base_field=models.CharField(
                            blank=True,
                            choices=[
                                ("video", "video"),
                                ("webinar", "webinar"),
                                ("document", "document"),
                                ("classroom", "classroom"),
                                ("markdown", "markdown"),
                                ("deposit", "deposit file"),
                            ],
                            max_length=100,
                            null=True,
                        ),
                        blank=True,
                        default=list,
                        help_text="list of active resources for this site.",
                        size=None,
                        verbose_name="active resources",
                    ),
                ),
                (
                    "site",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="site_config",
                        to="sites.site",
                        verbose_name="site",
                    ),
                ),
            ],
            options={
                "verbose_name": "site configuration",
                "verbose_name_plural": "sites configuration",
                "db_table": "site_config",
            },
        ),
    ]
