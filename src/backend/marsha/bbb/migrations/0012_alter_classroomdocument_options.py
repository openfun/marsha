# Generated by Django 4.1.7 on 2023-04-06 14:39

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("bbb", "0011_classroomrecording"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="classroomdocument",
            options={
                "ordering": ["-uploaded_on", "-created_on"],
                "verbose_name": "Classroom document",
                "verbose_name_plural": "Classroom documents",
            },
        ),
    ]
