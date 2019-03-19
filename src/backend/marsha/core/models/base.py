"""
Base model for the core app of the Marsha project.

In this base model, we activate generic behaviours that apply to all our models and enforce
checks and validation that go further than what Django is doing.
"""
import uuid

from django.core import checks
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

from psqlextra.indexes import ConditionalUniqueIndex
from safedelete.models import SOFT_DELETE_CASCADE, SafeDeleteModel

from ..defaults import PENDING, STATE_CHOICES


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


class NonDeletedUniqueIndex(ConditionalUniqueIndex):
    """A special ConditionalUniqueIndex for non  deleted objects."""

    condition = '"deleted" IS NULL'

    def __init__(self, fields, name=None):
        """Override default init to pass our predefined condition.

        For the parameters, see ``ConditionalUniqueIndex.__init__``.

        """
        super().__init__(condition=self.condition, fields=fields, name=name)

    def deconstruct(self):
        """Remove ``condition`` as an argument to be defined in migrations."""
        path, args, kwargs = super().deconstruct()
        del kwargs["condition"]
        return path, args, kwargs


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
        auto_now_add=True,
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

    # pylint: disable=arguments-differ,missing-param-doc
    def save(self, *args, **kwargs):
        """Enforce validation each time an instance is saved."""
        self.full_clean()
        super().save(*args, **kwargs)

    @classmethod
    def _check_table_name(cls):
        """Check that the table name is correctly defined.

        Returns
        -------
        List[checks.CheckMessage]
            A list of the check messages representing problems found on the model.

        """
        errors = []
        model_full_name: str = "{}.{}".format(
            cls._meta.app_label, cls._meta.object_name
        )

        try:
            db_table = cls._meta.original_attrs["db_table"]
        except KeyError:
            errors.append(
                checks.Error(
                    "The model '{}' must define the 'db_table' attribute on its "
                    "'Meta' class. It must not be prefixed with the name of the "
                    "app or the project.".format(model_full_name),
                    hint="Add 'db_table = \"{}\"' to the 'Meta' class of the "
                    "model '{}'".format(cls._meta.model_name, model_full_name),
                    obj=cls,
                    id="marsha.models.E007",
                )
            )
        else:
            app_prefix = cls._meta.app_label
            module_prefix = cls.__module__.split(".")[0]
            for prefix in [
                app_prefix,
                module_prefix,
                app_prefix + "_",
                module_prefix + "_",
            ]:
                if db_table.startswith(prefix):
                    errors.append(
                        checks.Error(
                            "The model 'db_table' attribute of the model '{}'  must not "
                            "be prefixed with the name of the app ('{}') or the project "
                            "('{}').".format(
                                model_full_name, app_prefix, module_prefix
                            ),
                            hint="Change to 'db_table = \"{}\"' in the 'Meta' class of the "
                            "model '{}'".format(cls._meta.model_name, model_full_name),
                            obj=cls,
                            id="marsha.models.E008",
                        )
                    )
                    break

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
        model_full_name = "{}.{}".format(cls._meta.app_label, cls._meta.object_name)

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
                        "The field '{}' of the model '{}' is a ManyToManyField but "
                        "without a 'through' model defined".format(
                            field.name, model_full_name
                        ),
                        hint="Add the attribute 'through' to the field '{}' of the model '{}' "
                        "and define the appropriate model".format(
                            field.name, model_full_name
                        ),
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

    def validate_unique(self, exclude=None):
        """Add validation for our ``NonDeletedUniqueIndex`` replacing ``unique_together``.

        For the parameters, see ``django.db.models.base.Model.validate_unique``.

        """
        super().validate_unique(exclude)

        if not self.deleted:
            # these uniqueness checks only make sense for non deleted instances
            # because it's the condition of these unique-together fields

            unique_checks = self._get_conditional_non_deleted_unique_checks(exclude)

            if unique_checks:
                all_objects = self.__class__.all_objects
                try:
                    # we need to force ``_perform_unique_checks`` from ``SafeDeleteModel``
                    # to use the default manager to ignore deleted instances
                    self.__class__.all_objects = self.__class__.objects

                    errors = self._perform_unique_checks(unique_checks)

                finally:
                    self.__class__.all_objects = all_objects

                if errors:
                    raise ValidationError(errors)

    @classmethod
    def _get_conditional_non_deleted_indexes_fields(cls):
        """Get the tuples of fields for our conditional unique index for non deleted entries.

        Returns
        -------
        List[List[str]]
            A list with one entry for each matching index. Each entry is a tuple with
            all the fields that compose the unique index.

        """
        tuples = []

        if cls._meta.indexes:
            tuples.extend(
                [
                    index.fields
                    for index in cls._meta.indexes
                    if isinstance(index, NonDeletedUniqueIndex)
                ]
            )

        return tuples

    def _get_conditional_non_deleted_unique_checks(self, exclude=None):
        """Extract "unique checks" from our conditional unique for ``_perform_unique_checks``.

        This is basically a copy of ``django.db.models.Model_get_unique_checks`` (only the
        part for ``unique_together``), but using output from
        ``_get_conditional_non_deleted_indexes_fields`` instead of ``_meta.unique_together``.

        For the parameters, see ``django.db.models.base.Model._get_unique_checks``.

        Returns
        -------
        List[Tuple[Type["BaseModel"], TupleOfStr]]
            ``_perform_unique_checks`` expect a list with each entry being a tuple with:
            - a model on which the uniqueness is defined
            - a tuple of fields to be unique together for this model

        """
        if exclude is None:
            exclude = []

        unique_checks = []

        unique_togethers = [
            (self.__class__, self._get_conditional_non_deleted_indexes_fields())
        ]

        for parent_class in self._meta.get_parent_list():
            if issubclass(parent_class, BaseModel):
                unique_togethers.append(
                    (
                        parent_class,
                        # pylint: disable=protected-access
                        parent_class._get_conditional_non_deleted_indexes_fields(),
                    )
                )

        for model_class, unique_together in unique_togethers:
            if not unique_together:
                continue

            for check in unique_together:
                for name in check:
                    # If this is an excluded field, don't add this check.
                    if name in exclude:
                        break
                else:
                    unique_checks.append((model_class, tuple(check)))

        return unique_checks


class AbstractImage(BaseModel):
    """Abstract model for images."""

    uploaded_on = models.DateTimeField(
        verbose_name=_("uploaded on"),
        help_text=_(
            "datetime at which the active version of the resource was uploaded."
        ),
        null=True,
        blank=True,
    )
    upload_state = models.CharField(
        max_length=20,
        verbose_name=_("upload state"),
        help_text=_("state of the upload in AWS."),
        choices=STATE_CHOICES,
        default=PENDING,
    )

    class Meta:
        """Options for the ``AbstractImage`` model."""

        abstract = True

    @property
    def is_ready_to_display(self):
        """Whether the image is ready to display (ie) has been sucessfully uploaded.

        The value of this field seems to be trivially derived from the value of the
        `uploaded_on` field but it is necessary for conveniency and clarity in the client.
        """
        return self.uploaded_on is not None
