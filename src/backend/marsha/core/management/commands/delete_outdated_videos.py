"""Delete outdated videos that have reached their retention date."""

from django.core.management.base import BaseCommand
from django.utils import timezone

from marsha.core.models import Video


def delete_outdated_models(stdout, model):
    """
    Deletes outdated model objects once they reached their retention date.
    Object with a retention date have their save method overridden to
    update their related s3 lifecycle policy.

    Parameters:
    ----------
    stdout (file): The output stream to write log messages.
    model (Model): The model class whose outdated objects need to be deleted.
    """

    now = timezone.now()

    # Find outdated model objects
    outdated_objects = model.objects.filter(retention_date__lt=now)

    stdout.write(
        f"Deleting outdated {outdated_objects.count()} {model.__name__} objects..."
    )

    outdated_objects.delete()

    stdout.write(f"Successfully deleted outdated {model.__name__} objects.")


class Command(BaseCommand):
    """Delete outdated videos that have reached their retention date."""

    help = "Deletes outdated videos once they reached their retention date."

    def handle(self, *args, **options):
        """
        call delete_outdated_models to delete Video object.
        """
        delete_outdated_models(self.stdout, Video)
