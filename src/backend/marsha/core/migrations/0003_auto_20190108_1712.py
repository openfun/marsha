# Generated by Django 2.0 on 2019-01-08 17:12

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [("core", "0002_auto_20181221_0847")]

    operations = [
        migrations.RenameField(
            model_name="audiotrack", old_name="state", new_name="upload_state"
        ),
        migrations.RenameField(
            model_name="signtrack", old_name="state", new_name="upload_state"
        ),
        migrations.RenameField(
            model_name="timedtexttrack", old_name="state", new_name="upload_state"
        ),
        migrations.RenameField(
            model_name="video", old_name="state", new_name="upload_state"
        ),
    ]
