# Generated by Django 2.0 on 2018-09-26 12:17

import uuid

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("core", "0004_auto_20180919_2104")]

    operations = [
        migrations.AddField(
            model_name="video",
            name="resource_id",
            field=models.UUIDField(
                default=uuid.uuid4,
                editable=False,
                help_text="UUID to identify the resource in the backend",
                verbose_name="Resource UUID",
            ),
        )
    ]
