# Generated by Django 4.0.4 on 2022-05-25 13:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0046_add_deleted_by_cascade"),
    ]

    operations = [
        migrations.AddField(
            model_name="video",
            name="join_mode",
            field=models.CharField(
                choices=[("approval", "approval"), ("denied", "denied")],
                default="approval",
                help_text="Join the discussion mode.",
                max_length=20,
                verbose_name="Join the discussion mode",
            ),
        ),
    ]
