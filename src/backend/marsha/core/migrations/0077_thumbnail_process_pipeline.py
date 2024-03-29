# Generated by Django 4.2.7 on 2023-11-28 14:53

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0076_alter_video_transcode_pipeline"),
    ]

    operations = [
        migrations.AddField(
            model_name="thumbnail",
            name="process_pipeline",
            field=models.CharField(
                choices=[("AWS", "AWS"), ("celery", "Celery")],
                default="AWS",
                help_text="Process pipeline used to process the thumbnail",
                max_length=255,
                verbose_name="process pipeline",
            ),
        ),
        migrations.AlterField(
            model_name="thumbnail",
            name="process_pipeline",
            field=models.CharField(
                choices=[("AWS", "AWS"), ("celery", "Celery")],
                default="celery",
                help_text="Process pipeline used to process the thumbnail",
                max_length=255,
                verbose_name="process pipeline",
            ),
        ),
    ]
