# Development

At the time of writing, **Marsha** is developed with **Python** 3.6 for
**Django 2.0**.

## Code quality

We enforce good code by using some linters and auto code formatting tools.

To run all linters at once, run the command:

```bash
make lint
```

You can also run each linter one by one. We have ones for the following
tools:

### Black

We use [Black](https://github.com/ambv/black) to automatically format python
files to produce [pep8](https://www.python.org/dev/peps/pep-0008/) compliant
code.

The best is to [configure your editor to automatically update the files
when saved](https://github.com/ambv/black#editor-integration).

If you want to do this manually, run the command:

```bash
make lint-black
```

And to check if all is correct without actually modifying the files:

```bash
make check-black
```

### Flake8

In addition to section-black auto-formatting, we pass the code through
[flake8](http://flake8.pycqa.org/en/latest/) to check for a lot of
rules. In addition to the default `flake8` rules, we use these plugins:

-   [flake8-bugbear](https://pypi.org/project/flake8-bugbear/) to find
    likely bugs and design problems.
-   [flake8-comprehensions](https://pypi.org/project/flake8-comprehensions/)
    to helps write better list/set/dict comprehensions.
-   [flake8-imports](https://pypi.org/project/flake8-imports/) to check
    imports order via `isort`.
-   [flake8-mypy](https://pypi.org/project/flake8-mypy/) to check typing
    inconsistencies via `mypy` (see section-mypy).
-   [flake8-docstrings](https://pypi.org/project/flake8-docstrings/) to
    check docstrings (see section-docstrings)

To check your code, run the command:

```bash
make lint-flake8
```

### Pylint


To enforce even more rules than the ones provided by section-flake8, we
use [pylint](https://www.pylint.org/) (with the help of
[pylint-django](https://pypi.org/project/pylint-django/)).

`pylint` may report some violations not found by `flake8`, and
vice-versa. More often, both will report the same ones.

To check your code, run the command:

```bash
make lint-pylint
```


## Docstrings

section-flake8 is configured to enforce docstrings rule defined in the
[pep 257](https://www.python.org/dev/peps/pep-0257/)

In addition, we document function arguments, return types, etc... using
the ["NumPy" style
documentation](https://numpydoc.readthedocs.io/en/latest/format.html),
which will be validated by section-flake8.

## Django

### Opinionated choices

We made the opinionated choice of following [this document, "Tips for
Building High-Quality Django Apps at
Scale"](https://blog.doordash.com/tips-for-building-high-quality-django-apps-at-scale-a5a25917b2b5).

In particular:

-   Do not split code in many Django applications if code is
    tightly coupled.
-   Applications are inside the `marsha` package, not at root, so import
    are done like this:

```bash
from marsha.someapp.foo import bar
```

-   Database tables are specifically named: we do not rely on the
    Django auto-generation. And then we don't prefix theses tables with
    the name of the project or the app. For example, a model named
    `Video`, will have the `db_table` attribute of its `Meta` class set
    to `video`. Enforced by a "Django check".
-   Through tables for `ManyToManyField` relations must be defined.
    Enforced by a "Django check".

In addition:

-   We enforce defining a related name for all related field
    (`ManyToManyField`, `ForeignKey`, `OneToOneField`). Enforced by a
    "Django check".

To check if theses rules are correctly applied, among other rules
defined by Django itself, run:

```bash
make check-django
```

> **note**
>
> for these checks to work, all models must inherit from `BaseModel`
> defined in `marsha.core.base_models`.

### Specific libraries

Here are a list of specific Django libraries we chose to use and why.

#### django-configurations

The aim is to be more specific about inheritance in settings from doc to
staging to production, instead of relying on multiple files (and
changing the `DJANGO_SETTINGS_MODULE` environment variable accordingly),
using the `from .base import *` pattern.

It also provides tools to get some variables from the environment and
validating them.

As a consequence of this tool, some default behavior of Django don't
work anymore. It's why the `django-admin` bash command is redefined in
`setup.cfg`.

#### django-safedelete

We don't want to lose data, so everything is kept in database, but
hidden from users.

See adr/0004-soft-deletion for details about the reasoning behind this
choice.

#### django-postgres-extra

With `django-safedelete`, model instances are not deleted but saved with
a field `deleted` changing from `None` to the deletion date-time.

So we cannot anymore use `unique_together`.

`django-postgres-extra` provides a `ConditionalUniqueIndex` index, that
acts like `unique_together`, but with a condition. We use the condition
`WHERE "deleted" IS NULL`, to enforce the fact that only one non-deleted
instance matching the fields combination can exist.

## Tests

The whole Marsha project is tested.

Run this command to run all the tests:

```bash
make test
```

If you want to be more specific about the tests to run, use the Django
command:

```bash
docker-compose exec app python manage.py test marcha.path.to.module
docker-compose exec app python manage.py test marcha.path.to.module.Class
docker-compose exec app python manage.py test marcha.path.to.module.Class.method
```

## Makefile

We provide a `Makefile` that allow to easily perform some actions. You can see the list of
available targets with explanations by running:

```bash
make help
```

## Apps scaffolding

We provide scripts to scaffold a new app.

### Backend app scaffolding

```bash
bin/generate_backend_lti_app
```

You will be prompted to enter some variables used in the app:

- `app_name`: the name of the app.
- `app_verbose_name`: the description of the app.
- `model`: (must be capitalized) the first model to create in the app.
- `flag`: the flag used in marsha to enable the app.
- `setting_name`: the flag used in the settings to enable the app. 
- `model_lower`: used for instance variable name. 
- `model_plural_lower`: used for instance list variable name.
- `model_url_part`: used for url part.
- `model_short_description`: the description of the model.

After that, activation helpers will be displayed.

ie:
```
app_name: assignments
app_verbose_name: Resource to request assignments files to students
model: Submission
flag [ASSIGNMENTS]: 
setting_name [ASSIGNMENTS_ENABLED]: 
model_lower [submission]: 
model_plural_lower [submissions]: 
model_url_part [submissions]: 
model_short_description [submission]: File submitted by a student

Don't forget to configure Marsha settings to activate assignments app:

src/backend/marsha/settings.py
    INSTALLED_APPS = [
        […]
+       "marsha.assignments.apps.AssignmentsConfig",
    ]

+    # assignments application
+    ASSIGNMENTS_ENABLED = values.BooleanValue(False)


src/backend/marsha/urls.py
+    if settings.ASSIGNMENTS_ENABLED:
+        urlpatterns += [path("", include("marsha.assignments.urls"))]


src/backend/marsha/core/defaults.py
     # FLAGS
     […]
+    ASSIGNMENTS = "assignments"


src/backend/marsha/core/views.py
    from .defaults import ASSIGNMENTS

  In all convenient flags configurations:
     "flags": {
         […]
+        ASSIGNMENTS: settings.ASSIGNMENTS_ENABLED,
     },


src/backend/marsha/development/views.py
+    from ..assignments.models import Submission

   In last_objects configuration:
     "last_objects": {
         […]
+         "submissions": Submission.objects.order_by("-updated_on")[:5],
     },

src/backend/marsha/core/templates/core/lti_development.html
     <select name="resource">
       […]
       <option value="submissions">File submitted by a student</option>
     </select>

env.d/test, env.d/development.dist, env.d/development
+   # assignments application
+   DJANGO_ASSIGNMENTS_ENABLED=True

You will then have to fix tests checking the `context.get("flags")` items.

To generate the initial migration once the model is ready:
docker-compose exec app python manage.py makemigrations assignments
```

The generated app will be available in the `src/backend/marsha` directory. 

```
src/backend/marsha/assignments/
├── admin.py
├── api.py
├── apps.py
├── factories.py
├── forms.py
├── __init__.py
├── models.py
├── serializers.py
├── tests
│   ├── __init__.py
│   ├── test_api.py
│   ├── test_views_lti.py
│   └── test_views_lti_select.py
├── urls.py
└── views.py
```

### Frontend app scaffolding

```bash
bin/generate_frontend_lti_app
```

You will be prompted to enter some variables used in the app:

- `app_name`: the name of the app.
- `app_name_capitalized`: used for app data naming.
- `model`: (must be capitalized) used for variables naming.
- `model_name`: (must be snake cased) the model name from the backend.
- `model_lower`: (must be camel cased) used for variables naming. 
- `model_plural`: used for variables naming. 
- `model_plural_lower`: used for variables naming.
- `model_plural_capitalized`: used for variables naming.
- `model_url_part`: used for url part.
- `flag`: the flag used in marsha to enable the app.

After that, activation helpers will be displayed.

ie:
```
app_name: assignments
app_name_capitalized [Assignments]: 
model: Submission
model_name [submission]: 
model_lower [submission]: 
model_plural [Submissions]: 
model_plural_lower [submissions]: 
model_plural_capitalized [Submissions]: 
model_url_part [submissions]: 
flag [ASSIGNMENTS]: 

Don't forget to configure assignments in core:

src/frontend/apps/lti_site/types/AppData.ts
    export enum appNames {
      […]
+     ASSIGNMENTS = 'assignments',
      […]
    }

    export enum flags {
      […]
+     ASSIGNMENTS = 'assignments',
      […]
    }

src/frontend/apps/lti_site/data/appConfigs.ts
    export const appConfigs: { [key in appNames]?: { flag?: flags } } = {
      […]
+     [appNames.ASSIGNMENTS]: { flag: flags.ASSIGNMENTS },
      […]
    };

```

The generated app will be available in the `src/frontend/apps` directory. 

```
src/frontend/apps/lti_site/apps/assignments/
├── DashboardSubmission
│   ├── index.spec.tsx
│   └── index.tsx
├── data
│   ├── assignmentsAppData.ts
│   └── queries
│       ├── index.spec.tsx
│       └── index.tsx
├── Routes.tsx
├── SelectContentTab
│   ├── index.spec.tsx
│   └── index.tsx
├── types
│   ├── AssignmentsAppData.ts
│   └── models.ts
└── utils
    ├── parseDataElements
    │   └── parseDataElements.ts
    └── tests
        └── factories.ts
```


## Splitting files while preserving git history

To split a file while preserving git history, you can use the following process:

install gitfilesplit:

```bash
pip install gitfilesplit
```

create a new branch:

```bash
git checkout -b split-test-api-organization
```

split the file:

```bash
gitfilesplit test_api_organization.py api/organizations/test_{create,delete,list,retrieve,update}.py
```

The script will create a new branch with the split files and a commit for each file, then it will octopus merge all the new branches into the current one.

Unfortunately, for now, the script generates commit messages that are not compatible with our gitlint check. You will have to fix them manually :

```bash
git rebase master --rebase-merges -i
```

Then, you have to fix the commit messages manually by marking them with `reword`.
ie:

```
♻️(backend) split test_api_organization.py into api/…/test_retrieve.py

Split generated by gitfilesplit
```

Then cleanup the resulting files by removing unwanted content, and commit the changes.

Push the branch and open a PR.

Since our github configuration does a rebase on master before merging, a conflict will be detected.
Once the PR passes the CI, and is approved you'll have to merge it manually:

```bash
git switch master
git merge split-test-api-organization
git push
```
