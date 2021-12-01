# Generated by Django 3.2.9 on 2021-12-02 13:19

import django.contrib.postgres.fields
from django.db import migrations, models
import django.utils.timezone


def migrate_is_registered(apps, schema_editor):
    """Migrate the live type info into the live_type field."""
    Liveregistrations = apps.get_model("core", "Liveregistration")
    liveregistration_to_migrate = Liveregistrations.objects.filter(is_registered=False)
    for liveregistration in liveregistration_to_migrate:
        liveregistration.is_registered = True
        liveregistration.save()


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0027_auto_20211125_1447"),
    ]

    operations = [
        migrations.AddField(
            model_name="liveregistration",
            name="is_registered",
            field=models.BooleanField(
                default=False,
                help_text="Is the user registered?",
                verbose_name="is the user registered",
            ),
        ),
        migrations.AddField(
            model_name="liveregistration",
            name="live_attendance",
            field=models.JSONField(
                blank=True,
                help_text="Live online presence",
                null=True,
                verbose_name="Live attendance",
            ),
        ),
        migrations.AddField(
            model_name="liveregistration",
            name="username",
            field=models.CharField(
                blank=True, max_length=155, null=True, verbose_name="Username"
            ),
        ),
        migrations.RunPython(migrate_is_registered),
    ]
