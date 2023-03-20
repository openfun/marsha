# Generated by Django 4.0.10 on 2023-03-22 08:44

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("markdown", "0005_noop_alter_markdownimage_upload_state"),
    ]

    operations = [
        migrations.AlterField(
            model_name="markdowndocumenttranslation",
            name="title",
            field=models.CharField(
                blank=True,
                help_text="Markdown document's title",
                max_length=255,
                verbose_name="title",
            ),
        ),
    ]