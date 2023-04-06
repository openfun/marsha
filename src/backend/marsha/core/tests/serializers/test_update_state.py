"""Tests for the UpdateStateSerializer serializer of the Marsha project."""
from datetime import datetime, timezone
import random
from uuid import uuid4

from django.test import TestCase

from marsha.core.models.video import TimedTextTrack
from marsha.core.serializers import UpdateStateSerializer


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class UpdateStateSerializerTest(TestCase):
    """Test the serializer that receives upload & processing state updates."""

    def test_serializers_update_state_valid_data(self):
        """The serializer should return the validated data."""
        valid_keys = [
            f"{uuid4()}/video/{uuid4()}/0123456789",
            *[
                f"{uuid4()}/timedtexttrack/{uuid4()}/0123456789_{language}_{mode}"
                for language in ["fr", "ast", "zh-hans"]
                for mode, _ in TimedTextTrack.MODE_CHOICES
            ],
        ]
        for key in valid_keys:
            state = random.choice(("ready", "error"))
            valid_data = {"key": key, "state": state, "extraParameters": {"foo": "bar"}}
            serializer = UpdateStateSerializer(data=valid_data)
            self.assertTrue(serializer.is_valid())
            self.assertEqual(
                dict(serializer.validated_data),
                {"key": key, "state": state, "extraParameters": {"foo": "bar"}},
            )

    def test_serializers_update_state_missing_field(self):
        """All fields in the serializer are required."""
        valid_data = {
            "key": f"{uuid4()}/video/{uuid4()}/0123456789",
            "state": random.choice(("ready", "error")),
            "extraParameters": {"foo": "bar"},
        }
        for field in valid_data:
            invalid_data = valid_data.copy()
            invalid_data.pop(field, None)
            serializer = UpdateStateSerializer(data=invalid_data)
            self.assertFalse(serializer.is_valid())
            self.assertEqual(serializer.errors[field][0], "This field is required.")

    def test_serializers_update_state_invalid_key(self):
        """The serializer should not be valid if the key is not of a valid format."""
        invalid_uuids = (
            "a2f27fdz-973a-4e89-8dca-cc59e01d255c",
            "a2f27fde9-73a-4e89-8dca-cc59e01d255c",
            "a2f27fde-973a4-e89-8dca-cc59e01d255c",
            "a2f27fde-973a-4e89-8dc-ccc59e01d255c",
            "a2f27fde-973a-4e89-8dca-cc59e01d255",
            "a2f27fde973a4e898dcacc59e01d255c",
        )
        invalid_keys = (
            [f"{u}/video/{uuid4()}/0123456789" for u in invalid_uuids]
            + [f"{uuid4()}/video/{u}/0123456789" for u in invalid_uuids]
            + [
                f"{uuid4()}/pideos/{uuid4()}/0123456789",
                f"{uuid4()}/video/{uuid4()}/012345678a",
                f"{uuid4()}/timedtexttrack/{uuid4()}/0123456789_f1",
                f"{uuid4()}/timedtexttrack/{uuid4()}/0123456789_fr_cf",
            ]
        )
        for key in invalid_keys:
            invalid_data = {
                "key": key,
                "state": "ready",
                "extraParameters": {"foo": "bar"},
            }
            serializer = UpdateStateSerializer(data=invalid_data)
            self.assertFalse(serializer.is_valid())
            self.assertEqual(
                serializer.errors["key"][0],
                "This value does not match the required pattern.",
            )

    def test_serializers_update_state_invalid_state(self):
        """The serializer should not be valid if the state is not of a valid value."""
        invalid_states = {
            "pending": '"pending" is not a valid choice.',
            "reedy": '"reedy" is not a valid choice.',
        }
        for state, message in invalid_states.items():
            invalid_data = {
                "key": f"{uuid4()}/video/{uuid4()}/0123456789",
                "state": state,
                "extraParameters": {"foo": "bar"},
            }
            serializer = UpdateStateSerializer(data=invalid_data)
            self.assertFalse(serializer.is_valid())
            self.assertEqual(serializer.errors["state"][0], message)

    def test_serializers_update_state_key_elements(self):
        """The serializer has a method that helps to extract key elements."""
        resource_id, object_id = uuid4(), uuid4()
        valid_data = {
            "key": f"{resource_id}/video/{object_id}/1533686400",
            "state": "ready",
            "extraParameters": {"foo": "bar"},
        }
        serializer = UpdateStateSerializer(data=valid_data)

        self.assertTrue(serializer.is_valid())
        self.assertEqual(
            serializer.get_key_elements(),
            {
                "extension": None,
                "model_name": "video",
                "object_id": str(object_id),
                "stamp": "1533686400",
                "uploaded_on": datetime(2018, 8, 8, tzinfo=timezone.utc),
            },
        )

    def test_serializers_update_state_key_elements_with_extension(self):
        """Serializer should extract extension from the key parameter."""
        resource_id, object_id = uuid4(), uuid4()
        valid_data = {
            "key": f"{resource_id}/document/{object_id}/1533686400.pdf",
            "state": "ready",
            "extraParameters": {"foo": "bar"},
        }
        serializer = UpdateStateSerializer(data=valid_data)

        self.assertTrue(serializer.is_valid())
        self.assertEqual(
            serializer.get_key_elements(),
            {
                "extension": "pdf",
                "model_name": "document",
                "object_id": str(object_id),
                "stamp": "1533686400",
                "uploaded_on": datetime(2018, 8, 8, tzinfo=timezone.utc),
            },
        )
