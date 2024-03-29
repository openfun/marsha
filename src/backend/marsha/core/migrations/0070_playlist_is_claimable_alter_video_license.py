# Generated by Django 4.2.4 on 2023-09-04 09:06

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0069_siteconfig_saml_entity_id_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="playlist",
            name="is_claimable",
            field=models.BooleanField(
                default=True,
                help_text="Allow LTI users to claim this playlist",
                verbose_name="is claimable",
            ),
        ),
        migrations.AlterField(
            model_name="video",
            name="license",
            field=models.CharField(
                blank=True,
                choices=[
                    ("CC_BY", "Creative Common By Attribution"),
                    ("CC_BY-SA", "Creative Common By Attribution Share Alike"),
                    ("CC_BY-NC", "Creative Common By Attribution Non Commercial"),
                    (
                        "CC_BY-NC-SA",
                        "Creative Common By Attribution Non Commercial Share Alike",
                    ),
                    ("CC_BY-ND", "Creative Common By Attribution No Derivatives"),
                    (
                        "CC_BY-NC-ND",
                        "Creative Common By Attribution Non Commercial No Derivatives",
                    ),
                    ("CC0", "Public Domain Dedication "),
                    ("NO_CC", "All rights reserved"),
                ],
                help_text="License for this video",
                max_length=20,
                null=True,
                verbose_name="licenses",
            ),
        ),
    ]
