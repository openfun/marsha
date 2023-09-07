import tempfile

from django.core.files.storage import FileSystemStorage


class TestStorage(FileSystemStorage):
    """A test storage class that uses a temporary directory for storing files"""
    temp_dir = tempfile.TemporaryDirectory()
    location = temp_dir.name
