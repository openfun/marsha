"""Test for live_session api when a user leave a discussion."""
import random
from unittest import mock
import uuid

from django.test import TestCase

from rest_framework_simplejwt.tokens import AccessToken

from ..factories import LiveSessionFactory, VideoFactory
from ..models.account import NONE
