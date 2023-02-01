# Generated by Django 3.1.3 on 2020-12-10 13:53

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0020_auto_20201116_1619"),
    ]

    operations = [
        migrations.AddField(
            model_name="video",
            name="is_public",
            field=models.BooleanField(
                default=False,
                help_text="Is the video publicly accessible?",
                verbose_name="is video public",
            ),
        ),
        migrations.AddField(
            model_name="document",
            name="is_public",
            field=models.BooleanField(
                default=False,
                help_text="Is the document publicly accessible?",
                verbose_name="is document public",
            ),
        ),
    ]
