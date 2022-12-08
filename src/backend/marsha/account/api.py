"""Declare API endpoints with Django RestFramework viewsets."""
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView

from marsha.account.serializers import ChallengeTokenObtainSerializer


class LoginView(TokenObtainPairView):
    """
    Login API view which expects payload with `username` and `password`
    and returns a `challenge_token`.
    """

    serializer_class = ChallengeTokenObtainSerializer
    permission_classes = (AllowAny,)
    http_method_names = ["post"]
