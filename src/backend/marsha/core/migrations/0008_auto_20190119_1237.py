# Generated by Django 2.0 on 2019-01-19 07:57

from django.db import migrations, models


def resource_id_to_id(apps, schema_editor):
    """
    Copy the `resource_id` field to the `id` field on all videos.
    """
    Video = apps.get_model("core", "Video")
    Video.objects.update(id=models.F("resource_id"))


def id_to_resource_id(apps, schema_editor):
    """
    Copy the `id` field to the `resource_id` field on all videos when reversing the migration.
    """
    Video = apps.get_model("core", "Video")
    Video.objects.update(resource_id=models.F("id"))


class Migration(migrations.Migration):
    dependencies = [("core", "0007_auto_20190122_1135")]

    operations = [migrations.RunPython(resource_id_to_id, id_to_resource_id)]
