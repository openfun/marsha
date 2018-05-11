#####################
Environment variables
#####################

We try to follow `12 factors app <https://12factor.net/>`_ and so use environment variables for configuration.

Here is a list of the ones that are needed or optional:

**********************
DJANGO_SETTINGS_MODULE
**********************

Description
    Define the settings file to use

Type
    String

Mandatory
    Yes

Default
    None

Choices
    Must be set to ``marsha.settings``


********************
DJANGO_CONFIGURATION
********************

Description
    Define the configuration to use in settings

Type
    String

Mandatory
    Yes

Default
    None

Choices
    Actually only ``Dev`` is available


*****************
DJANGO_SECRET_KEY
*****************

Description
    Used to provide cryptographic signing, and should be set to a unique, unpredictable value

Type
    String

Mandatory
    Yes

Default
    None


************
DJANGO_DEBUG
************

Description
    Turns on/off debug mode

Type
    Boolean

Mandatory
    No

Default
    ``True`` if ``DJANGO_CONFIGURATION`` is set to ``Dev``, ``False`` otherwise

Choices
    ``True`` or ``False``


************
DATABASE_URL
************

Description
    URL to represent the connection string to a database

Type
    String

Mandatory
    No if ``DJANGO_CONFIGURATION`` is set to ``Dev``, yes otherwise

Default
    ``sqlite:///path/to/project/db.sqlite3`` if ``DJANGO_CONFIGURATION`` is set to ``Dev``, None otherwise

Choices
    See `schemas as presented by dj-database-url <https://github.com/kennethreitz/dj-database-url#url-schema>`_
