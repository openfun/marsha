# LTI provider

Marsha can act as an LTI provider and supports version 1.0 of the standard.

In order to connect an LTI consumer site (such as Moodle or Open edX) a matching passport needs to be created in
Marsha.

## LTI Deep Linking

LTI content can be selected in any LMS supporting Deep Linking.

We provide [instructions to set it up in Moodle](moodle.md).

## Launch requests References

For developers' reference, here are examples of LTI launch requests sent by the most common LMS. If your LMS is missing 
from this list, please feel free to submit a Pull Request to add it to the list and we will make sure Marsha supports it.

### Launch request sent by Open edX

```json
{
  "custom_component_display_name": "LTI Consumer",
  "lti_version": "LTI-1p0",
  "oauth_nonce": "55763888688528959391532682559",
  "resource_link_id": "example.com-df7b0f2886f04b279854585735a402c4",
  "context_id": "course-v1:ufr+mathematics+0001",
  "oauth_signature_method": "HMAC-SHA1",
  "oauth_version": "1.0",
  "oauth_signature": "wRAp5yHp4tS+2lhkET+D0wo7d2o=",
  "lis_person_sourcedid": "barbara",
  "lti_message_type": "basic-lti-launch-request",
  "launch_presentation_return_url": "",
  "lis_person_contact_email_primary": "barbara.gardner9@example.com",
  "user_id": "56255f3807599c377bf0e5bf072359fd",
  "roles": "Instructor",
  "oauth_consumer_key": "mykey",
  "lis_result_sourcedid":
    "course-v1%3Aufr%2Bmathematics%2B0001:example.com-df7b0f2886f04b279854585735a402c4:56255f3807599c377bf0e5bf072359fd",
  "launch_presentation_locale": "en",
  "oauth_timestamp": "1532682559",
  "oauth_callback": "about:blank"
}
```

### Launch request sent by Moodle

```json
{
  "oauth_version": "1.0",
  "oauth_nonce": "0fe8149463986292b9aa1124becbbfd8",
  "oauth_timestamp": "1532684082",
  "oauth_consumer_key": "mykey",
  "context_id": "115",
  "context_label": "World of Water",
  "context_title": "World of Water",
  "context_type": "CourseSection",
  "launch_presentation_document_target": "iframe",
  "launch_presentation_locale": "en",
  "launch_presentation_return_url":
    "http://ltiapps.net/test/tc-return.php?course=115&launch_container=2&instanceid=3&sesskey=N7oPpfYugI",
  "lis_outcome_service_url": "http://ltiapps.net/test/tc-outcomes.php",
  "lis_person_contact_email_primary": "barbara.gardner9@example.com",
  "lis_person_name_family": "Gardner",
  "lis_person_name_full": "Barbara Gardner",
  "lis_person_name_given": "Barbara",
  "lis_person_sourcedid": "2015123",
  "lis_result_sourcedid":
    "69b01137b1b3c7c87f562b6e14f0b9bc:::115:::249:::{\"data\": {\"instanceid\": \"3\", \"userid\": \"249\", \"launchid\": 180548532}, \"hash\": \"290ab06bcf0ed944243b530718bdad0d33277884842e3f304cfb95c56c91b752\"}",
  "lti_message_type": "basic-lti-launch-request",
  "lti_version": "LTI-1p0",
  "resource_link_description":
    "A quick revision PowerPoint about the Water cycle.",
  "resource_link_id": "3",
  "resource_link_title": "Revise the Water cycle",
  "roles": "Learner",
  "tool_consumer_info_product_family_code": "moodle",
  "tool_consumer_info_version": "2015051101",
  "tool_consumer_instance_guid": "school.demo.moodle.net",
  "tool_consumer_instance_name": "Mount Orange School",
  "user_id": "249",
  "ext_lms": "moodle-2",
  "oauth_callback": "about:blank",
  "oauth_signature_method": "HMAC-SHA1",
  "oauth_signature": "4UedAqFXIsLuBto0pAtJuRXeQIw="
}
```

# Deep Linking request sent by Moodle

```json
{
  "oauth_version": "1.0",
  "oauth_nonce": "fac452792511fd88c173f2208c1ad3c9",
  "oauth_timestamp": "1649681644",
  "oauth_consumer_key": "A9H5YBAYNERTBIBVEQS4",
  "user_id": "2",
  "lis_person_sourcedid": "",
  "roles": "Instructor,urn:lti:sysrole:ims/lis/Administrator,urn:lti:instrole:ims/lis/Administrator",
  "context_id": "2",
  "context_label": "My first course",
  "context_title": "My first course",
  "context_type": "CourseSection",
  "lis_course_section_sourcedid": "",
  "lis_person_name_given": "Admin",
  "lis_person_name_family": "User",
  "lis_person_name_full": "Admin User",
  "ext_user_username": "admin",
  "lis_person_contact_email_primary": "demo@moodle.a",
  "launch_presentation_locale": "en",
  "ext_lms": "moodle-2",
  "tool_consumer_info_product_family_code": "moodle",
  "tool_consumer_info_version": "2021051706",
  "oauth_callback": "about:blank",
  "lti_version": "LTI-1p0",
  "lti_message_type": "ContentItemSelectionRequest",
  "tool_consumer_instance_guid": "1f60aaf6991f55818465e52f3d2879b7",
  "tool_consumer_instance_name": "Sandbox",
  "tool_consumer_instance_description": "Moodle sandbox demo",
  "accept_media_types": "application/vnd.ims.lti.v1.ltilink",
  "accept_presentation_document_targets": "frame,iframe,window",
  "accept_copy_advice": "false",
  "accept_multiple": "true",
  "accept_unsigned": "false",
  "auto_create": "false",
  "can_confirm": "false",
  "content_item_return_url": "https://sandbox.moodledemo.net/mod/lti/contentitem_return.php?course=2&id=1&sesskey=yzHWN1EYAM",
  "title": "Marsha LTI provider (never empty : fallback to moodle external tool name)",
  "text": "(current activity description if exists)",
  "oauth_signature_method": "HMAC-SHA1",
  "oauth_signature": "GEetrp41W4gCH5m1Fe6RPhf55W4="
}
```
