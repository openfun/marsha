# Generated by Django 2.0 on 2019-03-05 08:19

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("core", "0008_auto_20190119_1237")]

    operations = [
        migrations.AddField(
            model_name="video",
            name="show_download",
            field=models.BooleanField(default=True),
        )
    ]
