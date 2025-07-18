"""Test LTI xml configuration views in the ``core`` app of the Marsha project."""

from django.test import TestCase, override_settings

import xmltodict


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class LTIConfigViewTestCase(TestCase):
    """Test LTI configuration view."""

    maxDiff = None

    @override_settings(LTI_CONFIG_TITLE="Marsha")
    @override_settings(LTI_CONFIG_DESCRIPTION="Open source LTI resource provider")
    @override_settings(LTI_CONFIG_ICON="marsha-icon.png")
    @override_settings(LTI_CONFIG_CONTACT_EMAIL="contact@example.com")
    @override_settings(LTI_CONFIG_URL="https://example.com")
    def test_views_lti_config_strings(self):
        """Validate that xml is correctly rendered."""
        response = self.client.get("/lti/config.xml")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.context_data,
            {
                "code": "marsha",
                "contact_email": "contact@example.com",
                "description": "Open source LTI resource provider",
                "launch_url": "testserver",
                "icon_url": "//testserver/static/marsha-icon.png",
                "title": "Marsha",
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
                <blti:title>Marsha</blti:title>
                <blti:description>Open source LTI resource provider</blti:description>
                <blti:launch_url>http://testserver</blti:launch_url>
                <blti:secure_launch_url>https://testserver</blti:secure_launch_url>
                <blti:icon>http://testserver/static/marsha-icon.png</blti:icon>
                <blti:secure_icon>https://testserver/static/marsha-icon.png</blti:secure_icon>
                <blti:vendor>
                    <lticp:code>marsha</lticp:code>
                    <lticp:name>Marsha</lticp:name>
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

    @override_settings(LTI_CONFIG_TITLE="")
    @override_settings(LTI_CONFIG_DESCRIPTION="")
    @override_settings(LTI_CONFIG_ICON="")
    @override_settings(LTI_CONFIG_CONTACT_EMAIL="")
    @override_settings(LTI_CONFIG_URL="")
    def test_views_lti_config_empty_strings(self):
        """Validate that xml is correctly rendered with empty settings."""
        response = self.client.get("/lti/config.xml")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.context_data,
            {
                "code": None,
                "contact_email": "",
                "description": "",
                "launch_url": "testserver",
                "icon_url": "",
                "title": "",
                "url": "",
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
                <blti:launch_url>http://testserver</blti:launch_url>
                <blti:secure_launch_url>https://testserver</blti:secure_launch_url>
                <cartridge_bundle identifierref="BLTI001_Bundle"/>
                <cartridge_icon identifierref="BLTI001_Icon"/>
            </cartridge_basiclti_link>
                        """  # noqa: E501 pylint: disable=line-too-long
            ),
        )

    @override_settings(LTI_CONFIG_TITLE=None)
    @override_settings(LTI_CONFIG_DESCRIPTION=None)
    @override_settings(LTI_CONFIG_ICON=None)
    @override_settings(LTI_CONFIG_CONTACT_EMAIL=None)
    @override_settings(LTI_CONFIG_URL=None)
    def test_views_lti_config_none(self):
        """Validate that xml is correctly rendered without settings."""
        response = self.client.get("/lti/config.xml")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.context_data,
            {
                "code": None,
                "contact_email": None,
                "description": None,
                "launch_url": "testserver",
                "icon_url": None,
                "title": None,
                "url": None,
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
                <blti:launch_url>http://testserver</blti:launch_url>
                <blti:secure_launch_url>https://testserver</blti:secure_launch_url>
                <cartridge_bundle identifierref="BLTI001_Bundle"/>
                <cartridge_icon identifierref="BLTI001_Icon"/>
            </cartridge_basiclti_link>
                        """  # noqa: E501 pylint: disable=line-too-long
            ),
        )

    @override_settings(LTI_CONFIG_TITLE=None)
    @override_settings(LTI_CONFIG_DESCRIPTION=None)
    @override_settings(LTI_CONFIG_ICON=None)
    @override_settings(LTI_CONFIG_CONTACT_EMAIL=None)
    @override_settings(LTI_CONFIG_URL="https://example.com")
    def test_views_lti_config_url_only(self):
        """Validate that xml is correctly rendered without settings."""
        response = self.client.get("/lti/config.xml")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.context_data,
            {
                "code": None,
                "contact_email": None,
                "description": None,
                "launch_url": "testserver",
                "icon_url": None,
                "title": None,
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
                <blti:launch_url>http://testserver</blti:launch_url>
                <blti:secure_launch_url>https://testserver</blti:secure_launch_url>
                <blti:vendor>
                    <lticp:url>https://example.com</lticp:url>
                </blti:vendor>
                <cartridge_bundle identifierref="BLTI001_Bundle"/>
                <cartridge_icon identifierref="BLTI001_Icon"/>
            </cartridge_basiclti_link>
                        """  # noqa: E501 pylint: disable=line-too-long
            ),
        )

    def test_views_lti_config_default(self):
        """Validate that xml is correctly rendered with default settings."""
        response = self.client.get("/lti/config.xml")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.context_data,
            {
                "code": "marsha",
                "contact_email": None,
                "description": "An LTI first, opensource and extensible "
                "Learning Content Management System",
                "launch_url": "testserver",
                "icon_url": "//testserver/static/marsha_32x32_blue.png",
                "title": "Marsha",
                "url": None,
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
                <blti:title>Marsha</blti:title>
                <blti:description>An LTI first, opensource and extensible Learning Content Management System</blti:description>
                <blti:launch_url>http://testserver</blti:launch_url>
                <blti:secure_launch_url>https://testserver</blti:secure_launch_url>
                <blti:icon>http://testserver/static/marsha_32x32_blue.png</blti:icon>
                <blti:secure_icon>https://testserver/static/marsha_32x32_blue.png</blti:secure_icon>
                <blti:vendor>
                    <lticp:code>marsha</lticp:code>
                    <lticp:name>Marsha</lticp:name>
                    <lticp:description>An LTI first, opensource and extensible Learning Content Management System</lticp:description>
                </blti:vendor>
                <cartridge_bundle identifierref="BLTI001_Bundle"/>
                <cartridge_icon identifierref="BLTI001_Icon"/>
            </cartridge_basiclti_link>
                        """  # noqa: E501 pylint: disable=line-too-long
            ),
        )

    @override_settings(LTI_CONFIG_TITLE="Marsha")
    @override_settings(LTI_CONFIG_DESCRIPTION="Open source LTI resource provider")
    @override_settings(
        LTI_CONFIG_ICONS={
            "videos": "marsha_video.png",
        },
        LTI_CONFIG_TITLES={
            "videos": "Marsha Videos",
        },
    )
    @override_settings(LTI_CONFIG_CONTACT_EMAIL="contact@example.com")
    @override_settings(LTI_CONFIG_URL="https://example.com")
    def test_views_lti_config_video(self):
        """Validate that xml is correctly rendered."""
        response = self.client.get("/lti/videos/config.xml")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.context_data,
            {
                "code": "marsha",
                "contact_email": "contact@example.com",
                "description": "Open source LTI resource provider",
                "launch_url": "testserver/lti/videos/",
                "icon_url": "//testserver/static/marsha_video.png",
                "title": "Marsha Videos",
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
                <blti:title>Marsha Videos</blti:title>
                <blti:description>Open source LTI resource provider</blti:description>
                <blti:launch_url>http://testserver/lti/videos/</blti:launch_url>
                <blti:secure_launch_url>https://testserver/lti/videos/</blti:secure_launch_url>
                <blti:icon>http://testserver/static/marsha_video.png</blti:icon>
                <blti:secure_icon>https://testserver/static/marsha_video.png</blti:secure_icon>
                <blti:vendor>
                    <lticp:code>marsha</lticp:code>
                    <lticp:name>Marsha Videos</lticp:name>
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
