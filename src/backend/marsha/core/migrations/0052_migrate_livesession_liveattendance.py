from datetime import datetime

from django.db import migrations


def migrate_live_attendance(apps, schema_editor):
    """Update existing records to set live_attendance with timestamps
    keys."""
    try:
        livesessions = apps.get_model("core", "LiveSession")
    except LookupError:
        return
    livesessions_to_migrate = livesessions.objects.filter(live_attendance__isnull=False)
    for livesession in livesessions_to_migrate.iterator():
        for key in list(livesession.live_attendance):
            try:
                datetime.fromtimestamp(int(key))
            except ValueError as error:
                try:
                    new_key = int(key) // 1000
                    datetime.fromtimestamp(new_key)
                    livesession.live_attendance[str(new_key)] = (
                        livesession.live_attendance.pop(key)
                    )
                except ValueError as error:  # shouldn't happen
                    livesession.live_attendance.pop(key)

        livesession.save()


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0051_migrate_live_state"),
    ]

    operations = [migrations.RunPython(migrate_live_attendance)]
