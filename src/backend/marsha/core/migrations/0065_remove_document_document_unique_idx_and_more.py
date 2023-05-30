# Generated by Django 4.1.9 on 2023-05-30 11:29

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0064_migrate_playlist_20230530_1122"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="document",
            name="document_unique_idx",
        ),
        migrations.RemoveField(
            model_name="document",
            name="playlist",
        ),
        migrations.RemoveField(
            model_name="video",
            name="playlist",
        ),
        migrations.AlterField(
            model_name="document",
            name="playlists",
            field=models.ManyToManyField(
                help_text="playlists to which this document belongs",
                related_name="documents",
                through="core.PlaylistDocument",
                to="core.playlist",
                verbose_name="playlists",
            ),
        ),
        migrations.AlterField(
            model_name="video",
            name="playlists",
            field=models.ManyToManyField(
                help_text="The playlists this video belongs to.",
                related_name="videos",
                through="core.PlaylistVideo",
                to="core.playlist",
                verbose_name="playlists",
            ),
        ),
    ]
