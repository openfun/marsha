"""Layers used by django channels"""

import json
import random

from django.core.serializers.json import DjangoJSONEncoder

from channels_redis.core import RedisChannelLayer


class JsonRedisChannelLayer(RedisChannelLayer):
    """Use json to serialize and deserialize messages."""

    def serialize(self, message):
        """
        Serializes message in json.
        """
        value = bytes(json.dumps(message, cls=DjangoJSONEncoder), encoding="utf-8")
        if self.crypter:
            value = self.crypter.encrypt(value)

        # As we use an sorted set to expire messages we need to guarantee uniqueness,
        # with 12 bytes.
        random_prefix = random.getrandbits(8 * 12).to_bytes(12, "big")
        return random_prefix + value

    def deserialize(self, message):
        """
        Deserializes from a byte string.
        """
        # Removes the random prefix
        message = message[12:]
        message = message.decode("utf-8")

        if self.crypter:
            message = self.crypter.decrypt(message, self.expiry + 10)
        return json.loads(message)
