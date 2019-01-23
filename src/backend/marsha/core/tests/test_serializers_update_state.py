"""Tests for the UpdateStateSerializer serializer of the Marsha project."""
from datetime import datetime
import random
from uuid import uuid4

from django.test import TestCase

import pytz

from ..models.video import TimedTextTrack
from ..serializers import UpdateStateSerializer


# We don't enforce arguments documentation in tests
# pylint: disable=missing-param-doc,missing-type-doc,unused-argument


class UpdateStateSerializerTest(TestCase):
    """Test the serializer that receives upload & processing state updates."""

    def test_serializers_update_state_valid_data(self):
        """The serializer should return the validated data."""
        valid_keys = [
            "{!s}/video/{!s}/0123456789".format(uuid4(), uuid4()),
            *[
                "{!s}/timedtexttrack/{!s}/0123456789_{:s}_{:s}".format(
                    uuid4(), uuid4(), language, mode
                )
                for language in ["fr", "ast", "zh-hans"]
                for mode, _ in TimedTextTrack.MODE_CHOICES
            ],
        ]
        for key in valid_keys:
            state = random.choice(("ready", "error"))
            valid_data = {"key": key, "state": state, "signature": "123abc"}
            serializer = UpdateStateSerializer(data=valid_data)
            self.assertTrue(serializer.is_valid())
            self.assertEqual(
                dict(serializer.validated_data),
                {"key": key, "state": state, "signature": "123abc"},
            )

    def test_serializers_update_state_missing_field(self):
        """All fields in the serializer are required."""
        valid_data = {
            "key": "{!s}/video/{!s}/0123456789".format(uuid4(), uuid4()),
            "state": random.choice(("ready", "error")),
            "signature": "123abc",
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
            ["{!s}/video/{!s}/0123456789".format(u, uuid4()) for u in invalid_uuids]
            + ["{!s}/video/{!s}/0123456789".format(uuid4(), u) for u in invalid_uuids]
            + [
                "{!s}/pideos/{!s}/0123456789".format(uuid4(), uuid4()),
                "{!s}/video/{!s}/012345678a".format(uuid4(), uuid4()),
                "{!s}/timedtexttrack/{!s}/0123456789_f1".format(uuid4(), uuid4()),
                "{!s}/timedtexttrack/{!s}/0123456789_fr_cf".format(uuid4(), uuid4()),
            ]
        )
        for key in invalid_keys:
            invalid_data = {"key": key, "state": "ready", "signature": "123abc"}
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
                "key": "{!s}/video/{!s}/0123456789".format(uuid4(), uuid4()),
                "state": state,
                "signature": "123abc",
            }
            serializer = UpdateStateSerializer(data=invalid_data)
            self.assertFalse(serializer.is_valid())
            self.assertEqual(serializer.errors["state"][0], message)

    def test_serializers_update_state_key_elements(self):
        """The serializer has a method that helps to extract key elements."""
        resource_id, object_id = uuid4(), uuid4()
        valid_data = {
            "key": "{!s}/video/{!s}/1533686400".format(resource_id, object_id),
            "state": "ready",
            "signature": "123abc",
        }
        serializer = UpdateStateSerializer(data=valid_data)

        self.assertTrue(serializer.is_valid())
        self.assertEqual(
            serializer.get_key_elements(),
            {
                "model_name": "video",
                "object_id": str(object_id),
                "stamp": "1533686400",
                "uploaded_on": datetime(2018, 8, 8, tzinfo=pytz.utc),
            },
        )
