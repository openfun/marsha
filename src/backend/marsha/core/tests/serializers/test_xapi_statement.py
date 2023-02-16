"""Tests for the XAPIStatementSerializer serializer of the Marsha project."""
from django.test import TestCase

from marsha.core.serializers import (
    ExtensionSerializer,
    VerbSerializer,
    XAPIStatementSerializer,
)


class VerbSerializerTest(TestCase):
    """Test the serializer validating a xAPI verb."""

    def test_verb_serializer_with_valid_data(self):
        """The VerbSerializer should be valid with valid data."""
        data = {"id": "http://url.tld", "display": {"foo": "bar"}}

        serializer = VerbSerializer(data=data)

        self.assertTrue(serializer.is_valid())

    def test_verb_serializer_with_missing_id_property(self):
        """Property id is mandatory. If missing it should fail."""
        data = {"display": {"foo": "bar"}}

        serializer = VerbSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("id", serializer.errors)
        error = serializer.errors.get("id").pop(0)
        self.assertEqual(error.code, "required")

    def test_verb_serializer_with_invalid_id_property(self):
        """Id property should be a valid URL."""
        data = {"id": "foo", "display": {"foo": "bar"}}

        serializer = VerbSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("id", serializer.errors)
        error = serializer.errors.get("id").pop(0)
        self.assertEqual(error.code, "invalid")

    def test_verb_serializer_with_missing_display_property(self):
        """Property display is mandatory. If missing it should fail."""
        data = {"id": "http://url.tld"}

        serializer = VerbSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("display", serializer.errors)
        error = serializer.errors.get("display").pop(0)
        self.assertEqual(error.code, "required")

    def test_verb_serializer_with_invalid_display_property(self):
        """Display property only accept Dictionnary."""
        data = {"id": "http://url.tld", "display": "foo"}

        serializer = VerbSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("display", serializer.errors)
        error = serializer.errors.get("display").pop(0)
        self.assertEqual(error.code, "not_a_dict")


class ExtensionSerializerTest(TestCase):
    """Test the serializer validating a xAPI context."""

    def test_extension_serializer_with_valid_data(self):
        """The ContextSerializer should be valid with valid data."""
        data = {"extensions": {"foo": "bar"}}

        serializer = ExtensionSerializer(data=data)

        self.assertTrue(serializer.is_valid())

    def test_extension_serializer_with_no_extensions_property(self):
        """Property extensions is missing, the serializer must not be valid."""
        data = {}

        serializer = ExtensionSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("extensions", serializer.errors)
        error = serializer.errors.get("extensions").pop(0)
        self.assertEqual(error.code, "required")

    def test_extension_serializer_with_invalid_extensions_property(self):
        """Property extensions is invalid, the serializer must not be valid."""
        data = {"extensions": "foo"}

        serializer = ExtensionSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("extensions", serializer.errors)
        error = serializer.errors.get("extensions").pop(0)
        self.assertEqual(error.code, "not_a_dict")


class XAPIStatementSerializersTest(TestCase):
    """Test the serializer validating a xAPI statement."""

    def test_xapi_statement_serializer_without_result_and_id(self):
        """The XAPIStatementSerializer should be valid with only required data."""
        data = {
            "verb": {"id": "http://url.tld", "display": {"foo": "bar"}},
            "context": {"extensions": {"foo": "bar"}},
        }

        serializer = XAPIStatementSerializer(data=data)

        self.assertTrue(serializer.is_valid())

        self.assertTrue("id" in serializer.validated_data)
        self.assertFalse("result" in serializer.validated_data)

    def test_xapi_statement_serializer_with_result_and_id(self):
        """The XAPIStatementSerializer should be valid with all possible data."""
        data = {
            "verb": {"id": "http://url.tld", "display": {"foo": "bar"}},
            "context": {"extensions": {"foo": "bar"}},
            "result": {"extensions": {"foo": "bar"}},
            "id": "cc8868ac-d84b-4826-89df-a6171e9e3641",
        }

        serializer = XAPIStatementSerializer(data=data)

        self.assertTrue(serializer.is_valid())

        self.assertTrue("id" in serializer.validated_data)
        self.assertEqual(
            "cc8868ac-d84b-4826-89df-a6171e9e3641", serializer.validated_data["id"]
        )
        self.assertTrue("result" in serializer.validated_data)

    def test_xapi_statement_serializer_with_missing_verb(self):
        """The XAPIStatementSerializer should fail when verb is missing."""
        data = {"context": {"extensions": {"foo": "bar"}}}

        serializer = XAPIStatementSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("verb", serializer.errors)
        error = serializer.errors.get("verb").pop(0)
        self.assertEqual(error.code, "required")

    def test_xapi_statement_serializer_with_missing_context(self):
        """The XAPIStatementSerializer should fail when context is missing."""
        data = {"verb": {"id": "http://url.tld", "display": {"foo": "bar"}}}

        serializer = XAPIStatementSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("context", serializer.errors)
        error = serializer.errors.get("context").pop(0)
        self.assertEqual(error.code, "required")

    def test_xapi_statement_serializer_with_extra_data(self):
        """The XAPIStatementSerializer should not be valid with extra data."""
        data = {
            "verb": {"id": "http://url.tld", "display": {"foo": "bar"}},
            "context": {"extensions": {"foo": "bar"}},
            "foo": "bar",
        }

        serializer = XAPIStatementSerializer(data=data)

        self.assertFalse(serializer.is_valid())
