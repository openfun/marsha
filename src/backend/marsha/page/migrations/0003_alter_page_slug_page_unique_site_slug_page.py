# Generated by Django 4.2.3 on 2023-07-05 14:35

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("page", "0002_page_site"),
    ]

    operations = [
        migrations.AlterField(
            model_name="page",
            name="slug",
            field=models.SlugField(
                help_text="Page slug (/page/{slug})",
                max_length=100,
                verbose_name="slug",
            ),
        ),
        migrations.AddConstraint(
            model_name="page",
            constraint=models.UniqueConstraint(
                fields=("site", "slug"), name="unique_site_slug_page"
            ),
        ),
    ]