import tempfile

from django.core.files.storage import FileSystemStorage


class TestStorage(FileSystemStorage):
    temp_dir = tempfile.TemporaryDirectory()
    location = temp_dir.name
