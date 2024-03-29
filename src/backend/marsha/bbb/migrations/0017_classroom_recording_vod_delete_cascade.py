# Generated by Django 4.1.9 on 2023-05-29 15:13

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0062_alter_video_active_shared_live_media"),
        ("bbb", "0016_classroom_recording_purpose"),
    ]

    operations = [
        migrations.AlterField(
            model_name="classroomrecording",
            name="vod",
            field=models.ForeignKey(
                blank=True,
                help_text="vod made from the recording",
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="classroom_recordings",
                to="core.video",
                verbose_name="vod",
            ),
        ),
    ]
