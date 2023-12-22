# Generated by Django 4.2.7 on 2023-12-04 18:10

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0077_thumbnail_process_pipeline"),
    ]

    operations = [
        migrations.AddField(
            model_name="sharedlivemedia",
            name="process_pipeline",
            field=models.CharField(
                choices=[("AWS", "AWS"), ("celery", "Celery")],
                default="AWS",
                help_text="Pipeline used to process the shared live media",
                max_length=255,
                verbose_name="process pipeline",
            ),
        ),
        migrations.AlterField(
            model_name="sharedlivemedia",
            name="process_pipeline",
            field=models.CharField(
                choices=[("AWS", "AWS"), ("celery", "Celery")],
                default="celery",
                help_text="Pipeline used to process the shared live media",
                max_length=255,
                verbose_name="process pipeline",
            ),
        ),
    ]