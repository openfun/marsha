###########
Development
###########

At the time of writing, **Marsha** is developed with **Python** 3.6 for **Django 2.0**.

************
Code quality
************

We enforce good code by using some linters and auto code formatting tools.

To run all linters at once, run the command:

.. code-block:: shell

    make lint

You can also run each linter one by one. We have ones for the following tools:

.. _section-black:

black
=====

We use `black <https://github.com/ambv/black>`_ to automatically format python files to produce
`pep 8 <https://www.python.org/dev/peps/pep-0008/>`_ compliant code.

The best is to
`configure your editor to automatically update the files when saved <https://github.com/ambv/black#editor-integration>`_.

If you want to do this manually, run the command:

.. code-block:: shell

    make black

And to check if all is correct without actually modifying the files:

.. code-block:: shell

    make check-black

.. _section-flake8:

flake8
======

In addition to :ref:`section-black` auto-formatting, we pass the code through
`flake8 <http://flake8.pycqa.org/en/latest/>`_ to check for a lot of rules. In addition to the default ``flake8``
rules, we use these plugins:

- `flake8-bugbear <https://pypi.org/project/flake8-bugbear/>`_ to find likely bugs and design problems.
- `flake8-comprehensions <https://pypi.org/project/flake8-comprehensions/>`_ to helps write better list/set/dict comprehensions.
- `flake8-imports <https://pypi.org/project/flake8-imports/>`_ to check imports order via ``isort``.
- `flake8-mypy <https://pypi.org/project/flake8-mypy/>`_ to check typing inconsistencies via ``mypy`` (see :ref:`section-mypy`).
- `flake8-docstrings <https://pypi.org/project/flake8-docstrings/>`_ to check docstrings (see :ref:`section-docstrings`)

To check your code, run the command:

.. code-block:: shell

    make flake8


.. _section-pylint:

pylint
======

To enforce even more rules than the ones provided by :ref:`section-flake8`, we use `pylint <https://www.pylint.org/>`_
(with the help of `pylint-django <https://pypi.org/project/pylint-django/>`_).

``pylint`` may report some violations not found by ``flake8``, and vice-versa. More often, both will report the same ones.

To check your code, run the command:

.. code-block:: shell

    make pylint

.. _section-mypy:

mypy
====

We use `python typing <https://docs.python.org/3/library/typing.html>`_ as much as possible,
and `mypy <http://www.mypy-lang.org/>`_ (with the help of `mypy-django <https://github.com/machinalis/mypy-django>`_)
to check it.

We also enforce it when defining Django fields, via the use of a "Django check". And the type of reverse related fields
must always be defined.

To check if your code is valid for mypy, run the following command:

.. code-block:: shell

    make mypy

Following is how the types of fields must be defined. To check if some fields typing is invalid, among other problems,
run the following command:

.. code-block:: shell

    make check-django

It will tell you all found errors in typing, with indication on how to correct them.


Scalar fields
-------------

For scalar fields (``CharField``, ``IntegerField``, ``BooleanField``, ``DateField``...), we just add the type.
For each type of Django field, there is an expected type. Theses types are defined in the ``fields_type_mapping``
dict defined in ``marsha.core.base_models``. Add the missing ones if needed.

.. code-block:: python

    class Foo(models.Model):
        # we tell mypy that the attribute ``bar`` is of type ``str``
        name: str = models.CharField(...)


One-to-one fields
-----------------

The type expected for a ``OneToOneField`` is the pointed model.

And on the pointed model we set the type of the related name to the source model.

.. code-block:: python

    class Foo(models.Model):
        # we tell mypy that the attribute ``bar`` is of type ``Bar``
        bar: "Bar" = models.OneToOneField(to=Bar, related_name="the_foo")

    class Bar(models.Model):
        # we tell mypy that the class ``Bar`` has an attribute ``the_foo`` of type ``Foo``
        the_foo: Foo


Foreign keys
------------

The type expected for a ``ForeignKey`` is the pointed model.

On the pointed model we have a many-to-one relationship.
We use a type specifically defined for that, ``ReverseFKType``, defined in ``marsha.stubs``.

.. code-block:: python

    from marsha.stubs import ReverseFKType

    class Foo(models.Model):
        # we tell mypy that the attribute ``bar`` is of type ``Bar``
        bar: "Bar" = models.ForeignKey(to=Bar, related_name="foos")

    class Bar(models.Model):
        # we tell mypy that the class ``Bar`` has an attribute ``foos``
        # which is a reverse foreign key for the class ``Foo``
        foos: ReverseFKType[Foo]


Many-to-many fields
-------------------

To define the type of a ``ManyToManyField``, we use a type specifically defined for that, ``M2MType``, defined in
``marsha.stubs``.

On the pointed model, we use the same type, as it's also a many-to-many fields (ie it could have been defined in one
model or the other).

.. code-block:: python

    from marsha.stubs import M2MType

    class Foo(models.Model):
        # we tell mypy that the attribute ``bar`` is a many-to-many for the class ``Bar``
        bars: M2MType["Bar"] = models.ManyToManyField(to=Bar, related_name="foos")

    class Bar(models.Model):
        # we tell mypy that the class ``Bar`` has an attribute ``foos``
        # which is a many-to-many for the class ``Foo``
        foos: M2MType[Foo]


.. _section-docstrings:

**********
Docstrings
**********

:ref:`section-flake8` is configured to enforce docstrings rule defined in the
`pep 257 <https://www.python.org/dev/peps/pep-0257/>`_

In addition, we document function arguments, return types, etc... using the
`"NumPy" style documentation <https://numpydoc.readthedocs.io/en/latest/format.html>`_, which will be validated by
:ref:`section-flake8`.


.. _section-django:

******
Django
******

Opinionated choices
===================

We made the opinionated choice of following `this document, "Tips for Building High-Quality Django Apps at Scale" <https://blog.doordash.com/tips-for-building-high-quality-django-apps-at-scale-a5a25917b2b5>`_.

In particular:

- Do not split code in many Django applications if code is tightly coupled.
- Applications are inside the ``marsha`` package, not at root, so import are done like this:

.. code-block:: python

    from marsha.someapp.foo import bar

- Database tables are specifically named: we do not rely on the Django auto-generation. And then we don't prefix theses
  tables with the name of the project or the app. For example, a model named ``Video``, will have the ``db_table``
  attribute of its ``Meta`` class set to ``video``. Enforced by a "Django check".

- Through tables for ``ManyToManyField`` relations must be defined. Enforced by a "Django check".

In addition:

- We enforce typing of fields and reverse related fields (see :ref:`section-mypy`). Enforced by a "Django check".

- We enforce defining a related name for all related field (``ManyToManyField``, ``ForeignKey``, ``OneToOneField``).
  Enforced by a "Django check".

To check if theses rules are correctly applied, among other rules defined by Django itself, run:

.. code-block:: shell

    make check-django

.. note::

    for these checks to work, all models must inherit from ``BaseModel`` defined in ``marsha.core.base_models``.

Specific libraries
==================

Here are a list of specific Django libraries we chose to use and why.

django-configurations
---------------------

The aim is to be more specific about inheritance in settings from doc to staging to production, instead of relying on
multiple files (and changing the ``DJANGO_SETTINGS_MODULE`` environment variable accordingly), using the
``from .base import *`` pattern.

It also provides tools to get some variables from the environment and validating them.

As a consequence of this tool, some default behavior of Django don't work anymore. It's why the ``django-admin``
bash command is redefined in ``setup.cfg``.


********
Makefile
********

We provide a ``Makefile`` that allow to easily perform some actions.

make install
    Will install the project in the current environment, with its dependencies.

make dev
    Will install the project in the current environment, with its dependencies, including the ones needed in a
    development environment.

make check
    Will run all linters and checking tools.

make lint
    Will run all linters (:ref:`section-mypy`, :ref:`section-black`, :ref:`section-flake8`, :ref:`section-pylint`)

make mypy
    Will run the :ref:`section-mypy` tool.

make check-black
    Will run the :ref:`section-black` tool in check mode only (won't modify files)

make black
    Will run the :ref:`section-black` tool and update files that need to.

make flake8
    Will run the :ref:`section-flake8` tool.

make pylint
    Will run the :ref:`section-pylint` tool.

make check-django
    Will run the Django ``check`` command.

make check-migrations
    Will check that all needed migrations exist.

make doc
    Will build the documentation.

make dist
    Will build the package.

make clean
    Will clean python build related directories and files.

make full-clean
    Like ``make clean`` but will clean some other generated directories or files.

