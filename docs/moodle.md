### Moodle Admin setup

#### Prerequisites

Before heading to Moodle, you should get an LTI passport from administrators of the Marsha server to which you want to connect.

The passport should consist in 2 oauth credentials: a consumer key and a shared secret.

#### Create external tool preset

In Moodle, logged as an admin, go to `Site administration`:

<table><tr>
  <td><img src="images/moodle_lti_select_admin_1.png" alt="Moodle LTI select admin view 1"/></td>
</tr></table>

Go to `Plugins` tab, and click on `Manage tools` under `External Tools`:

<table><tr>
  <td><img src="images/moodle_lti_select_admin_2.png" alt="Moodle LTI select admin view 2"/></td>
</tr></table>

Click on `configure a tool manually`:

<table><tr>
  <td><img src="images/moodle_lti_select_admin_3.png" alt="Moodle LTI select admin view 3"/></td>
</tr></table>

Fill the form with following data:

Label                 | Value
--------------------- | ------------------------------------
Tool name             | marsha
Tool URL              | https://marsha.education/
LTI version           | LTI 1.0/1.1
Consumer key          | [found in the passport]
Shared secret         | [found in the passport]
Supports Deep Linking | Checked
Content Selection URL | https://marsha.education/lti/select/

<table><tr>
  <td><img src="images/moodle_lti_select_admin_4.png" alt="Moodle LTI select admin view 4"/></td>
</tr></table>

Click on `Save changes`.

The new external tool should appear:


<table><tr>
  <td><img src="images/moodle_lti_select_admin_5.png" alt="Moodle LTI select admin view 5"/></td>
</tr></table>

You may want to customize the tool's icon and use one of the following in resolution 32x32:

<table><tr>
  <td><img src="images/marsha_32x32_blue.png" alt="Marsha icon blue 32x32"/></td>
  <td><img src="images/marsha_32x32_yellow.png" alt="Marsha icon yellow 32x32"/></td>
  <td><img src="images/marsha_32x32_black.png" alt="Marsha icon black 32x32"/></td>
  <td><img src="images/marsha_32x32_white.png" alt="Marsha icon white 32x32"/></td>
</td></tr></table>

#### Cookies configuration

Secured cookies needs to be enabled for Deep Linking response authentication:

<table><tr>
  <td><img src="images/moodle_lti_select_admin_6.png" alt="Moodle LTI select admin view 6"/></td>
</tr></table>

#### Iframe resizer

In order to have iframes resized automatically to show their content,
this snippet can be pasted in another admin view.

Back in the admin view, on `Appearance` tab, click on `Additional HTML`:

<table><tr>
  <td>
    <img src="images/moodle_iframe_resizer_admin_1.png" alt="Moodle iframe resizer admin view 1"/>
  </td>
</tr></table>

Paste the following code in `Within HEAD`:

```html
<script src="https://cdn.jsdelivr.net/npm/iframe-resizer@4.2.11/js/iframeResizer.min.js"></script>
<script>
    window.onload = function() {
        iFrameResize({checkOrigin: false}, '#contentframe');
    }
</script>
```

<table><tr>
  <td>
    <img src="images/moodle_iframe_resizer_admin_2.png" alt="Moodle iframe resizer admin view 2"/>
  </td>
</tr></table>

### Moodle Teacher / admin usage

Once the external tool is setup, it can be used by teachers.

#### Select an existing content

Go to any course, click on `` and add an activity:

<table><tr>
  <td>
    <img src="images/moodle_lti_select_teacher_1.png" alt="Moodle LTI select teacher view 1"/>
  </td>
</tr></table>

<table><tr>
  <td>
    <img src="images/moodle_lti_select_teacher_2.png" alt="Moodle LTI select teacher view 2"/>
  </td>
</tr></table>

<table><tr>
  <td>
    <img src="images/moodle_lti_select_teacher_3.png" alt="Moodle LTI select teacher view 3"/>
  </td>
</tr></table>

Select `External source`:

<table><tr>
  <td>
    <img src="images/moodle_lti_select_teacher_4.png" alt="Moodle LTI select teacher view 4"/>
  </td>
</tr></table>

Select preconfigured tool, and click on `Select content`:

<table><tr>
  <td>
    <img src="images/moodle_lti_select_teacher_5.png" alt="Moodle LTI select teacher view 5"/>
  </td>
</tr></table>

<table><tr>
  <td>
    <img src="images/moodle_lti_select_teacher_6.png" alt="Moodle LTI select teacher view 6"/>
  </td>
</tr></table>

A popin will appear with available content:

<table><tr>
  <td>
    <img src="images/moodle_lti_select_teacher_13.png" alt="Moodle LTI select teacher view 13"/>
  </td>
</tr></table>

Click on a thumbnail, moodle form should be populated:

<table><tr>
  <td>
    <img src="images/moodle_lti_select_teacher_8.png" alt="Moodle LTI select teacher view 8"/>
  </td>
</tr></table>

Click on `Save and display`, chosen video should appear:

<table><tr>
  <td>
    <img src="images/moodle_lti_select_teacher_12.png" alt="Moodle LTI select teacher view 12"/>
  </td>
</tr></table>

#### Add a new content

The steps are the same as above.

When the Select content popin apears, click on `Add a video`:

<table><tr>
  <td>
    <img src="images/moodle_lti_select_teacher_13.png" alt="Moodle LTI select teacher view 13"/>
  </td>
</tr></table>

The form would be populated as above:

<table><tr>
  <td>
    <img src="images/moodle_lti_select_teacher_8.png" alt="Moodle LTI select teacher view 8"/>
  </td>
</tr></table>

Click on `Save and display`, video dashboard will appear, allowing upload:

<table><tr>
  <td>
    <img src="images/moodle_lti_select_teacher_9.png" alt="Moodle LTI select teacher view 9"/>
  </td>
</tr></table>

Click on `Upload a video` and `Select a file to upload`:

<table><tr>
  <td>
    <img src="images/moodle_lti_select_teacher_10.png" alt="Moodle LTI select teacher view 10"/>
  </td>
</tr></table>

<table><tr>
  <td>
    <img src="images/moodle_lti_select_teacher_11.png" alt="Moodle LTI select teacher view 11"/>
  </td>
</tr></table>

When upload is done, the video will appear:

<table><tr>
  <td>
    <img src="images/moodle_lti_select_teacher_12.png" alt="Moodle LTI select teacher view 12"/>
  </td>
</tr></table>
