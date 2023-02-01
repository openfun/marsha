"""
Base model for the core app of the Marsha project.

In this base model, we activate generic behaviours that apply to all our models and enforce
checks and validation that go further than what Django is doing.
"""
from itertools import chain
import uuid

from django.core import checks
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from safedelete.models import SOFT_DELETE_CASCADE, SafeDeleteModel


CHECKED_APPS = {"core"}


def _get_fields_by_source_model(model):
    """Return all fields of a model and the exact model where they are defined.

    Parameters
    ----------
    model: Type[models.Model]
        The model for which to get the fields origin.

    Returns
    -------
    Dict[str, Type[models.Model]]
        A dict with keys being the fields names, and values the model on which the
        field is defined.

    """
    fields = {}

    for base in model.__bases__:
        if base is models.Model or not issubclass(base, models.Model):
            continue

        fields.update(_get_fields_by_source_model(base))

    for field in model._meta.get_fields():
        if field.name in fields:
            continue

        fields[field.name] = model

    return fields


class NonDeletedUniqueIndex(models.Index):
    """This class is kept because used in migrations.

    Do not remove it before version 3.0.0
    """


class BaseModel(SafeDeleteModel):
    """Base model for all our models.

    It is based on ``SafeDeleteModel`` to easily manage how we want the instances
    to be deleted/soft-deleted, with or without its relationships.
    The default ``safedelete`` policy is ``SOFT_DELETE_CASCADE``, ie the object to
    delete and its relations will be soft deleted:  their ``deleted`` field will be
    filled with the current date-time (the opposite, ``None``, is the same as
    "not deleted")

    Also it adds some checks run with ``django check``:
        - check that every ``ManyToManyField`` use a defined ``through`` table.
        - check that every model have a ``db_table`` defined, not prefixed with the name
        of the app or the project.

    """

    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("primary key for the record as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    created_on = models.DateTimeField(
        verbose_name=_("created on"),
        help_text=_("date and time at which a record was created"),
        default=timezone.now,
        editable=False,
    )
    updated_on = models.DateTimeField(
        verbose_name=_("updated on"),
        help_text=_("date and time at which a record was last updated"),
        auto_now=True,
        editable=False,
    )

    _safedelete_policy = SOFT_DELETE_CASCADE

    class Meta:
        """Options for the ``BaseModel`` model."""

        abstract = True

    # pylint: disable=signature-differs
    def save(self, *args, **kwargs):
        """Enforce validation each time an instance is saved."""
        self.full_clean()
        super().save(*args, **kwargs)

    @classmethod
    def _check_table_name(cls):
        """Check that the table name is defined.

        Returns
        -------
        List[checks.CheckMessage]
            A list of the check messages representing problems found on the model.

        """
        errors = []
        model_full_name: str = f"{cls._meta.app_label}.{cls._meta.object_name}"

        try:
            cls._meta.original_attrs["db_table"]
        except KeyError:
            errors.append(
                checks.Error(
                    f"The model '{model_full_name}' must define the 'db_table' attribute on its "
                    "'Meta' class. It must not be prefixed with the name of the "
                    "app or the project.",
                    hint=f"Add 'db_table = \"{cls._meta.model_name}\"' to the 'Meta' class of the "
                    "model '{model_full_name}'",
                    obj=cls,
                    id="marsha.models.E007",
                )
            )

        return errors

    @classmethod
    def _check_through_models(cls):
        """Check that all m2m fields have a defined ``through`` model.

        Returns
        -------
        List[checks.CheckMessage]
            A list of the check messages representing problems found on the model.

        """
        fields_by_model = _get_fields_by_source_model(cls)
        errors = []
        model_full_name = f"{cls._meta.app_label}.{cls._meta.object_name}"

        m2m_fields = [
            field
            for field in cls._meta.get_fields()
            if isinstance(field, models.ManyToManyField)
        ]

        for field in m2m_fields:
            # ignore if defined in a model outside of the scope
            if fields_by_model[field.name]._meta.app_label not in CHECKED_APPS:
                continue

            if field.remote_field.through._meta.auto_created:
                errors.append(
                    checks.Error(
                        f"The field '{field.name}' of the model '{model_full_name}' is a "
                        "ManyToManyField but without a 'through' model defined",
                        hint=f"Add the attribute 'through' to the field '{field.name}' of the "
                        "model '{model_full_name}' and define the appropriate model",
                        obj=cls,
                        id="marsha.models.E009",
                    )
                )

        return errors

    @classmethod
    def check(cls, **kwargs):
        """Add checks for related names.

        Parameters
        ----------
            kwargs:
                Actually not used but asked by django to be present "for possible future usage".

        Returns
        -------
        List[checks.CheckMessage]
            A list of the check messages representing problems found on the model.

        """
        errors = super().check(**kwargs)

        errors.extend(cls._check_table_name())
        errors.extend(cls._check_through_models())

        return errors

    def __repr__(self, dict_repr=False):
        return str(self.to_dict())

    def to_dict(self):
        """Return a dictionary representation of the model."""
        opts = self._meta
        data = {}
        for field in chain(opts.concrete_fields, opts.private_fields):
            data[field.name] = field.value_from_object(self)
        for field in opts.many_to_many:
            data[field.name] = [related.id for related in field.value_from_object(self)]
        return data
