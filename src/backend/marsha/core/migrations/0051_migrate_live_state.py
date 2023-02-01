from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0050_alter_video_join_mode"),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                "UPDATE video "
                "SET live_state=upload_state, upload_state='pending' "
                "WHERE upload_state='harvesting' OR upload_state='harvested';"
            ),
            reverse_sql=(
                "UPDATE video "
                "SET upload_state=live_state, live_state='stopped' "
                "WHERE live_state='harvesting' OR live_state='harvested';"
            ),
        ),
    ]
