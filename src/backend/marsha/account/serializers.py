"""Account API serializers."""
from django.contrib.auth.models import update_last_login

from rest_framework_simplejwt.serializers import TokenObtainSerializer

from marsha.core.simple_jwt.tokens import ChallengeToken


class ChallengeTokenObtainSerializer(TokenObtainSerializer):
    """
    Custom serializer for the login API endpoint:

    Receives a username and password and return a challenge token.
    """

    token_class = ChallengeToken

    def validate(self, attrs):
        data = super().validate(attrs)
        challenge_token = self.get_token(self.user)
        data["challenge_token"] = str(challenge_token)
        update_last_login(None, self.user)
        return data
