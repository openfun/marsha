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
