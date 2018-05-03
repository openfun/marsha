"""Base models for the core app of the Marsha project."""

from datetime import date, datetime
from typing import Any, Dict, List, Mapping, Tuple, Type, get_type_hints

from django.core import checks
from django.db import models
from django.db.models.fields.related import RelatedField
from django.db.models.fields.reverse_related import ForeignObjectRel

from marsha.stubs import M2MType, ReverseFKType, Typing


CheckMessages = List[checks.CheckMessage]  # pylint: disable=invalid-name


CHECKED_APPS = {"core"}


fields_type_mapping: Mapping[Type[models.Field], type] = {
    models.AutoField: int,
    models.BooleanField: bool,
    models.CharField: str,
    models.DateField: date,
    models.DateTimeField: datetime,
    models.FloatField: float,
    models.IntegerField: int,
}
reverse_fields_type_mapping: Mapping[Type[RelatedField], type] = {
    models.ForeignKey: ReverseFKType, models.ManyToManyField: M2MType
}


def _get_fields_by_source_model(
    model: Type[models.Model]
) -> Dict[str, Type[models.Model]]:
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
    fields: Dict[str, Type[models.Model]] = {}

    for base in model.__bases__:
        if base is models.Model or not issubclass(base, models.Model):
            continue

        fields.update(_get_fields_by_source_model(base))

    for field in model._meta.get_fields():
        if field.name in fields:
            continue

        fields[field.name] = model

    return fields


class BaseModel(models.Model):
    """Base model for all our models.

    It will check that all fields are correctly annotated. Same for fields pointing
    to other models: final models must have all related names correctly annotated.
    It will also checks that all ``ManyToManyField`` use a defined ``through`` table.
    And that all model have a ``db_table`` defined, not rpefixed with the name of the
    app or the project.

    """

    class Meta:
        """Options for the ``BaseModel`` model."""

        abstract = True

    @classmethod
    def _get_expected_field_annotation(cls, field: models.Field) -> Tuple[type, str]:
        """Get the expected annotation for a django model field.

        Parameters
        ----------
        field: models.Field
            The instance of a field of the ``cls`` model for which we want to know
            the expected annotation.

        Returns
        -------
        Tuple[type, str]
            A tuple with two entries: the expected type annotation, and a string representation
            of this annotation.

        Raises
        ------
        ValueError
            If the field is not a ``ManyToManyField``, a ``ForeignKey``, a ``OneToOneField``
            and not of a type defined in ``fields_type_mapping``.

        """
        if isinstance(field, models.ManyToManyField):
            return M2MType[field.related_model], '%s["%s"]' % (  # type: ignore
                M2MType.__name__, field.related_model._meta.object_name
            )

        if isinstance(field, models.ForeignKey):  # covers OneToOneField too
            return field.related_model, '"%s"' % field.related_model._meta.object_name

        field_class: Type[models.Field]
        field_type: Typing
        for field_class, field_type in fields_type_mapping.items():
            if isinstance(field, field_class):
                return field_type, field_type.__name__

        raise ValueError(
            "Field type not yet managed for '%s': %s"
            % (field.name, field.__class__.__name__)
        )

    @classmethod
    def _check_annotated_fields(cls) -> CheckMessages:
        """Check that all fields are correctly annotated.

        Returns
        -------
        List[checks.CheckMessage]
            A list of the check messages representing problems found on the model.

        """
        from marsha.core import models as core_models  # imported here to avoid cyclic import

        fields: List[models.Field] = [
            field
            for field in cls._meta.get_fields()
            if field.concrete and not field.auto_created
        ]

        fields_by_model: Dict[str, Type[models.Model]] = _get_fields_by_source_model(
            cls
        )

        errors: CheckMessages = []
        model_full_name: str = "%s.%s" % (cls._meta.app_label, cls._meta.object_name)

        field: models.Field
        for field in fields:
            field_name: str = field.name

            try:
                expected_annotation = cls._get_expected_field_annotation(field)
            except ValueError:
                errors.append(
                    checks.Error(
                        "The expected annotation for the field '%s' on the model '%s', a "
                        "'%s' is not known: please define it in 'fields_type_mapping'"
                        % (field_name, model_full_name, field.__class__),
                        obj=cls,
                        id="marsha.models.E001",
                    )
                )
                continue

            # check that the field is annotated
            if field_name not in cls.__annotations__:

                # ignore if defined in a model outside of the scope
                if fields_by_model[field_name]._meta.app_label not in CHECKED_APPS:
                    continue

                errors.append(
                    checks.Error(
                        "There is no typing annotation for the field '%s' on the model '%s'"
                        % (field_name, model_full_name),
                        hint="Add the annotation for the '%s' field on the model '%s': ': %s'"
                        % (field_name, model_full_name, expected_annotation[1]),
                        obj=cls,
                        id="marsha.models.E002",
                    )
                )
                continue

            # check that the field is correctly annotated
            annotation_type = get_type_hints(cls, core_models.__dict__)[field_name]

            if annotation_type != expected_annotation[0]:
                errors.append(
                    checks.Error(
                        "The typing annotation is wrong for the field '%s' on "
                        "the model '%s': it should be '%s', not '%s'"
                        % (
                            field_name,
                            model_full_name,
                            expected_annotation[1],
                            annotation_type,
                        ),
                        hint="Change the annotation for the '%s' field on the model '%s': ': %s'"
                        % (field_name, model_full_name, expected_annotation[1]),
                        obj=cls,
                        id="marsha.models.E003",
                    )
                )
                continue

        # expected_annotation_type = sel

        return errors

    @classmethod
    def _check_annotated_related_names(cls) -> CheckMessages:
        """Check that all related names are defined and annotated on final models.

        Returns
        -------
        List[checks.CheckMessage]
            A list of the check messages representing problems found on the model.

        """
        from marsha.core import models as core_models  # imported here to avoid cyclic import

        related_fields: List[ForeignObjectRel] = [
            field
            for field in cls._meta.get_fields()
            if field.is_relation
            and hasattr(field, "related_name")
            and field.field.model._meta.app_label in CHECKED_APPS
        ]

        errors: CheckMessages = []
        model_full_name: str = "%s.%s" % (cls._meta.app_label, cls._meta.object_name)

        field: ForeignObjectRel
        for field in related_fields:

            field_name: str = field.field.name
            related_name: str = field.related_name
            related_model: Type[models.Model] = field.field.model
            related_model_name: str = related_model._meta.object_name
            related_model_full_name: str = "%s.%s" % (
                related_model._meta.app_label, related_model_name
            )

            # first, check that related name are defined on fk/m2m/o2o fields
            if not related_name:
                errors.append(
                    checks.Error(
                        "The field '%s' on the model '%s', pointing to the model '%s' "
                        "doesn't have the 'related_name' attribute defined."
                        % (field_name, related_model_full_name, model_full_name),
                        hint="Set the 'related_name' argument when declaring the "
                        "'%s' field on the model '%s'"
                        % (field_name, related_model_full_name),
                        obj=cls,
                        id="marsha.models.E004",
                    )
                )
                continue

            # then check that related names names are annotated on final models
            expected_annotation_type: Typing
            expected_annotation_string: str

            if field.multiple:  # reverse relation of a ForeignKey or ManyToManyField
                expected_annotation_type = reverse_fields_type_mapping[  # type: ignore
                    field.field.__class__
                ][
                    related_model
                ]
                expected_annotation_string = '%s["%s"]' % (
                    reverse_fields_type_mapping[field.field.__class__].__name__,
                    related_model_name,
                )

            else:  # reverse relation of a OneToOneField
                expected_annotation_type = related_model
                expected_annotation_string = '"%s"' % related_model_name

            if related_name not in cls.__annotations__:
                errors.append(
                    checks.Error(
                        "There is no typing annotation for the related_name '%s' on the "
                        "model '%s', pointed by the field '%s' defined on the model '%s'"
                        % (
                            related_name,
                            model_full_name,
                            field_name,
                            related_model_full_name,
                        ),
                        hint="Add '%s: %s' in the model '%s'"
                        % (related_name, expected_annotation_string, model_full_name),
                        obj=cls,
                        id="marsha.models.E005",
                    )
                )
                continue

            # and finally check that annotations of these related names are correct

            annotation_type = get_type_hints(cls, core_models.__dict__)[related_name]

            if annotation_type != expected_annotation_type:
                errors.append(
                    checks.Error(
                        "The typing annotation is wrong for the related_name '%s' on "
                        "the model '%s', pointed by the field '%s' defined on the "
                        "model '%s': it should be '%s', not '%s'"
                        % (
                            related_name,
                            model_full_name,
                            field_name,
                            related_model_full_name,
                            expected_annotation_string,
                            annotation_type,
                        ),
                        hint="Change to '%s: %s' in the model '%s'"
                        % (related_name, expected_annotation_string, model_full_name),
                        obj=cls,
                        id="marsha.models.E006",
                    )
                )

                continue

        return errors

    @classmethod
    def _check_table_name(cls) -> CheckMessages:
        """Check that the table name is correctly defined.

        Returns
        -------
        List[checks.CheckMessage]
            A list of the check messages representing problems found on the model.

        """
        errors: CheckMessages = []
        model_full_name: str = "%s.%s" % (cls._meta.app_label, cls._meta.object_name)

        try:
            db_table: str = cls._meta.original_attrs["db_table"]
        except KeyError:
            errors.append(
                checks.Error(
                    "The model '%s' must define the 'db_table' attribute on its "
                    "'Meta' class. It must not be prefixed with the name of the "
                    "app or the project." % (model_full_name,),
                    hint="Add 'db_table: str = \"%s\"' to the 'Meta' class of the "
                    "model '%s'" % (cls._meta.model_name, model_full_name),
                    obj=cls,
                    id="marsha.models.E007",
                )
            )
        else:
            app_prefix = cls._meta.app_label
            module_prefix = cls.__module__.split(".")[0]
            for prefix in [
                app_prefix, module_prefix, app_prefix + "_", module_prefix + "_"
            ]:
                if db_table.startswith(prefix):
                    errors.append(
                        checks.Error(
                            "The model 'db_table' attribute of the model '%s'  must not "
                            "be prefixed with the name of the app ('%s') or the project "
                            "('%s')." % (model_full_name, app_prefix, module_prefix),
                            hint="Change to 'db_table: str = \"%s\"' in the 'Meta' class of the "
                            "model '%s'" % (cls._meta.model_name, model_full_name),
                            obj=cls,
                            id="marsha.models.E008",
                        )
                    )
                    break

        return errors

    @classmethod
    def _check_through_models(cls) -> CheckMessages:
        """Check that all m2m fields have a defined ``through`` model.

        Returns
        -------
        List[checks.CheckMessage]
            A list of the check messages representing problems found on the model.

        """
        fields_by_model: Dict[str, Type[models.Model]] = _get_fields_by_source_model(
            cls
        )
        errors: CheckMessages = []
        model_full_name: str = "%s.%s" % (cls._meta.app_label, cls._meta.object_name)

        m2m_fields: List[models.ManyToManyField] = [
            field
            for field in cls._meta.get_fields()
            if isinstance(field, models.ManyToManyField)
        ]

        field: models.ManyToManyField
        for field in m2m_fields:

            # ignore if defined in a model outside of the scope
            if fields_by_model[field.name]._meta.app_label not in CHECKED_APPS:
                continue

            if field.remote_field.through._meta.auto_created:
                errors.append(
                    checks.Error(
                        "The field '%s' of the model '%s' is a ManyToManyField but "
                        "without a 'through' model defined"
                        % (field.name, model_full_name),
                        hint="Add the attribute 'through' to the field '%s' of the model '%s' "
                        "and define the appropriate model"
                        % (field.name, model_full_name),
                        obj=cls,
                        id="marsha.models.E009",
                    )
                )

        return errors

    @classmethod
    def check(cls, **kwargs: Any) -> CheckMessages:
        """Add checks for related names.

        Parameters
        ----------
            kwargs: Any
                Actually not used but asked by django to be present "for possible future usage".

        Returns
        -------
        List[checks.CheckMessage]
            A list of the check messages representing problems found on the model.

        """
        errors = super().check(**kwargs)

        errors.extend(cls._check_table_name())
        errors.extend(cls._check_through_models())
        errors.extend(cls._check_annotated_fields())
        errors.extend(cls._check_annotated_related_names())

        return errors
