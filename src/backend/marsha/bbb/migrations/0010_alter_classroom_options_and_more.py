# Generated by Django 4.0.8 on 2023-01-04 11:34

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("bbb", "0009_classroomdocument"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="classroom",
            options={
                "ordering": ["-created_on", "id"],
                "verbose_name": "classroom",
                "verbose_name_plural": "classrooms",
            },
        ),
        migrations.RemoveField(
            model_name="classroom",
            name="attendee_password",
        ),
        migrations.RemoveField(
            model_name="classroom",
            name="moderator_password",
        ),
    ]
