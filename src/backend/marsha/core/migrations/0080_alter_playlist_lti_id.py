# Generated by Django 4.2.13 on 2024-07-03 14:53

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0079_timedtexttrack_process_pipeline"),
    ]

    operations = [
        migrations.AlterField(
            model_name="playlist",
            name="lti_id",
            field=models.CharField(
                blank=True,
                default=None,
                help_text="ID for synchronization with an external LTI tool",
                max_length=255,
                null=True,
                verbose_name="lti id",
            ),
        ),
    ]
