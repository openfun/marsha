"""Tests for the Schema endpoint on the API of the Marsha project."""
import json

from django.test import TestCase


class SchemaAPITest(TestCase):
    """Test the API route for the schema."""

    def test_api_schema(self):
        """The API has a schema route that answers."""
        response = self.client.get("/api/schema")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content)["info"]["title"], "Marsha API")
