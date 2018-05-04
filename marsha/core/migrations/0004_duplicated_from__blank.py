# Generated by Django 2.0.5 on 2018-05-14 17:20

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [("core", "0003_missing_text_fields")]

    operations = [
        migrations.AlterField(
            model_name="playlist",
            name="duplicated_from",
            field=models.ForeignKey(
                blank=True,
                help_text="original playlist this one was duplicated from",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="duplicates",
                to="core.Playlist",
                verbose_name="duplicate from",
            ),
        ),
        migrations.AlterField(
            model_name="video",
            name="duplicated_from",
            field=models.ForeignKey(
                blank=True,
                help_text="original video this one was duplicated from",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="duplicates",
                to="core.Video",
                verbose_name="duplicate from",
            ),
        ),
    ]
