"""Test marsha layers use by django channels."""

from django.test import TestCase

from marsha.websocket.layers import JsonRedisChannelLayer


class JsonRedisChannelLayerTest(TestCase):
    """Test serialize and deserialize."""

    def test_serialize_message(self):
        """
        Test default serialization method
        """
        message = {"a": True, "b": None, "c": {"d": []}}
        channel_layer = JsonRedisChannelLayer()
        serialized = channel_layer.serialize(message)
        self.assertIsInstance(serialized, bytes)
        self.assertEqual(serialized[12:], b'{"a": true, "b": null, "c": {"d": []}}')

    def test_deserialize_message(self):
        """
        Test default deserialization method
        """
        message = (
            b'[\x85\xf8\xdeY\xe5\xa3}is\x0f3{"a": true, "b": null, "c": {"d": []}}'
        )
        channel_layer = JsonRedisChannelLayer()
        deserialized = channel_layer.deserialize(message)

        self.assertIsInstance(deserialized, dict)
        self.assertEqual(deserialized, {"a": True, "b": None, "c": {"d": []}})
