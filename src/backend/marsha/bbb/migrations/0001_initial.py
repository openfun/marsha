# Generated by Django 3.2.7 on 2021-09-22 14:16

import uuid

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("core", "0023_auto_20210601_0923"),
    ]

    operations = [
        migrations.CreateModel(
            name="Meeting",
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
                    "lti_id",
                    models.CharField(
                        blank=True,
                        help_text="ID for synchronization with an external LTI tool",
                        max_length=255,
                        null=True,
                        verbose_name="lti id",
                    ),
                ),
                (
                    "title",
                    models.CharField(
                        help_text="title of the meeting",
                        max_length=255,
                        verbose_name="title",
                    ),
                ),
                (
                    "description",
                    models.TextField(
                        blank=True,
                        help_text="description of the meeting",
                        null=True,
                        verbose_name="description",
                    ),
                ),
                (
                    "position",
                    models.PositiveIntegerField(
                        default=0,
                        help_text="position of this meeting in the playlist",
                        verbose_name="position",
                    ),
                ),
                (
                    "meeting_id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        help_text="BBB id for the meeting as UUID",
                        verbose_name="meeting id",
                    ),
                ),
                (
                    "attendee_password",
                    models.CharField(
                        blank=True,
                        help_text="The password that the join URL can later provide as its password parameter to indicate the user will join as a viewer.",
                        max_length=50,
                        null=True,
                        verbose_name="Attendee Password",
                    ),
                ),
                (
                    "moderator_password",
                    models.CharField(
                        blank=True,
                        help_text="The password that will join URL can later provide as its password parameter to indicate the user will as a moderator.",
                        max_length=50,
                        null=True,
                        verbose_name="Moderator Password",
                    ),
                ),
                (
                    "welcome_text",
                    models.TextField(
                        blank=True,
                        default="Welcome!",
                        null=True,
                        verbose_name="A welcome message that gets displayed on the chat window when the participant joins.",
                    ),
                ),
                ("started", models.BooleanField(default=False)),
                (
                    "started_on",
                    models.DateTimeField(
                        blank=True,
                        help_text="datetime at which the meeting was started.",
                        null=True,
                        verbose_name="started on",
                    ),
                ),
                (
                    "playlist",
                    models.ForeignKey(
                        help_text="playlist to which this meeting belongs",
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="meetings",
                        to="core.playlist",
                        verbose_name="playlist",
                    ),
                ),
            ],
            options={
                "verbose_name": "meeting",
                "verbose_name_plural": "meetings",
                "db_table": "meeting",
            },
        ),
        migrations.AddConstraint(
            model_name="meeting",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted", None)),
                fields=("lti_id", "playlist"),
                name="meeting_unique_idx",
            ),
        ),
    ]
