# LTI provider

Marsha can act as an LTI provider and supports version 1.0 of the standard.

In order to connect an LTI consumer site (such as Moodle or Open edX) a matching passport needs to be created in
Marsha.

## LTI Deep Linking

LTI content can be selected in any LMS supporting Deep Linking.

Below an example to set it up with moodle

### Moodle Admin setup

#### Create external tool preset
Logged as admin, go to `Site administration`
![moodle_lti_select_admin_1](images/moodle_lti_select_admin_1.png)

Go to `Plugins` tab, and click on `Manage tools` under `External Tools`

![moodle_lti_select_admin_2](images/moodle_lti_select_admin_2.png)

Click on `configure a tool manually`

![moodle_lti_select_admin_3](images/moodle_lti_select_admin_3.png)

Fill the form with following data

Label                 | Value
--------------------- | ------------------------------------
Tool name             | marsha
Tool URL              | https://marsha.education/
LTI version           | LTI 1.0/1.1
Consumer key          | [found in the passport]
Shared secret         | [found in the passport]
Supports Deep Linking | Checked
Content Selection URL | https://marsha.education/lti/select/

![moodle_lti_select_admin_4](images/moodle_lti_select_admin_4.png)

Click on `Save changes`

The new external tool should appear.

![moodle_lti_select_admin_5](images/moodle_lti_select_admin_5.png)

#### Iframe resizer

In order to have iframes resized automatically to show their content,
this snippet can be pasted in another admin view.

Back in the admin view, on `Appearance` tab, click on `Additional HTML`

![moodle_iframe_resizer_admin_1](images/moodle_iframe_resizer_admin_1.png)

Paste following code in `Within HEAD`

```html
<script src="https://cdn.jsdelivr.net/npm/iframe-resizer@4.2.11/js/iframeResizer.min.js"></script>
<script>
    window.onload = function() {
        iFrameResize({checkOrigin: false}, '#contentframe');
    }
</script>
```

![moodle_iframe_resizer_admin_2](images/moodle_iframe_resizer_admin_2.png)

### Moodle Teacher / admin usage

Once the external tool is setup, it can be used by teachers.

#### Select an existing content

Go to any course, click on `` and add an activity

![moodle_lti_select_teacher_1](images/moodle_lti_select_teacher_1.png)

![moodle_lti_select_teacher_2](images/moodle_lti_select_teacher_2.png)

![moodle_lti_select_teacher_3](images/moodle_lti_select_teacher_3.png)

Select `External source`

![moodle_lti_select_teacher_4](images/moodle_lti_select_teacher_4.png)

Select preconfigured tool, and click on `Select content`

![moodle_lti_select_teacher_5](images/moodle_lti_select_teacher_5.png)
![moodle_lti_select_teacher_6](images/moodle_lti_select_teacher_6.png)

A popin will appear with available content.

![moodle_lti_select_teacher_13](images/moodle_lti_select_teacher_13.png)

Click on a thumbnail, moodle form should be populated.

![moodle_lti_select_teacher_8](images/moodle_lti_select_teacher_8.png)

Click on `Save and display`, chosen video should appear.

![moodle_lti_select_teacher_12](images/moodle_lti_select_teacher_12.png)

#### Add a new content

The steps are the same as above.

When the Select content popin apears, click on `Add a video`

![moodle_lti_select_teacher_13](images/moodle_lti_select_teacher_13.png)

The form would be populated as above.

![moodle_lti_select_teacher_8](images/moodle_lti_select_teacher_8.png)

Click on `Save and display`, video dashboard will appear, allowing upload.

![moodle_lti_select_teacher_9](images/moodle_lti_select_teacher_9.png)

Click on `Upload a video` and `Select a file to upload`

![moodle_lti_select_teacher_10](images/moodle_lti_select_teacher_10.png)
![moodle_lti_select_teacher_11](images/moodle_lti_select_teacher_11.png)

When upload is done, the video will appear.

![moodle_lti_select_teacher_12](images/moodle_lti_select_teacher_12.png)

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
