"""Test LTI xml configuration views in the ``bbb`` app of the Marsha project."""
from django.test import TestCase, override_settings

import xmltodict

from marsha.core.tests.testing_utils import reload_urlconf


@override_settings(BBB_ENABLED=True)
class ClassroomLTIConfigViewTestCase(TestCase):
    """Test LTI configuration view."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

    @override_settings(LTI_CONFIG_TITLE="Marsha")
    @override_settings(LTI_CONFIG_DESCRIPTION="Open source LTI resource provider")
    @override_settings(
        LTI_CONFIG_ICONS={
            "classrooms": "marsha_classroom.png",
        },
        LTI_CONFIG_TITLES={
            "classrooms": "Marsha Classrooms",
        },
    )
    @override_settings(LTI_CONFIG_CONTACT_EMAIL="contact@example.com")
    @override_settings(LTI_CONFIG_URL="https://example.com")
    def test_views_lti_config_classroom(self):
        """Validate that xml is correctly rendered."""
        response = self.client.get("/lti/classrooms/config.xml")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.context_data,
            {
                "code": "marsha",
                "contact_email": "contact@example.com",
                "description": "Open source LTI resource provider",
                "launch_url": "testserver/lti/classrooms/",
                "icon_url": "//testserver/static/marsha_classroom.png",
                "title": "Marsha Classrooms",
                "url": "https://example.com",
            },
        )
        self.assertEqual(response["Content-Type"], "text/xml; charset=utf-8")
        self.assertEqual(
            xmltodict.parse(response.content),
            xmltodict.parse(
                """<?xml version="1.0" encoding="UTF-8"?>
            <cartridge_basiclti_link xmlns="http://www.imsglobal.org/xsd/imslticc_v1p0"
                xmlns:blti = "http://www.imsglobal.org/xsd/imsbasiclti_v1p0"
                xmlns:lticm ="http://www.imsglobal.org/xsd/imslticm_v1p0"
                xmlns:lticp ="http://www.imsglobal.org/xsd/imslticp_v1p0"
                xmlns:xsi = "http://www.w3.org/2001/XMLSchema-instance"
                xsi:schemaLocation = "http://www.imsglobal.org/xsd/imslticc_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticc_v1p0.xsd
    http://www.imsglobal.org/xsd/imsbasiclti_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imsbasiclti_v1p0.xsd
    http://www.imsglobal.org/xsd/imslticm_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticm_v1p0.xsd
    http://www.imsglobal.org/xsd/imslticp_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticp_v1p0.xsd">
                <blti:title>Marsha Classrooms</blti:title>
                <blti:description>Open source LTI resource provider</blti:description>
                <blti:launch_url>http://testserver/lti/classrooms/</blti:launch_url>
                <blti:secure_launch_url>https://testserver/lti/classrooms/</blti:secure_launch_url>
                <blti:icon>http://testserver/static/marsha_classroom.png</blti:icon>
                <blti:secure_icon>https://testserver/static/marsha_classroom.png</blti:secure_icon>
                <blti:vendor>
                    <lticp:code>marsha</lticp:code>
                    <lticp:name>Marsha Classrooms</lticp:name>
                    <lticp:description>Open source LTI resource provider</lticp:description>
                    <lticp:url>https://example.com</lticp:url>
                    <lticp:contact>
                        <lticp:email>contact@example.com</lticp:email>
                    </lticp:contact>
                </blti:vendor>
                <cartridge_bundle identifierref="BLTI001_Bundle"/>
                <cartridge_icon identifierref="BLTI001_Icon"/>
            </cartridge_basiclti_link>
                        """  # noqa: E501 pylint: disable=line-too-long
            ),
        )
