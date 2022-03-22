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

#### Cookies configuration

Secured cookies needs to be enabled for Deep Linking response authentication.

![moodle_lti_select_admin_6](images/moodle_lti_select_admin_6.png)

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
