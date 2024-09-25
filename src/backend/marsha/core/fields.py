"""Marsha custom fields."""

from django.contrib.postgres.fields import ArrayField
from django.forms import CheckboxSelectMultiple, MultipleChoiceField


# pylint: disable=too-many-arguments


class InvertedCheckboxSelectMultiple(CheckboxSelectMultiple):
    """
    Modified CheckboxSelectMultiple to invert the choices.
    """

    # pylint: disable=too-many-positional-arguments
    def create_option(
        self, name, value, label, selected, index, subindex=None, attrs=None
    ):
        option = super().create_option(
            name, value, label, selected, index, subindex, attrs
        )
        if not selected:
            option["attrs"] = {"checked": True}
        else:
            option["attrs"] = {}
        return option


class InvertedMultipleChoiceField(MultipleChoiceField):
    """
    Modified MultipleChoiceField to invert the choices.
    """

    def to_python(self, value):
        value = super().to_python(value)
        return [choice[0] for choice in self.choices if choice[0] not in value]


class InvertedArrayField(ArrayField):
    """
    Modified ArrayField to use a MultipleChoiceField
    and to invert the choices.
    The point here, is to select the choices that are not in the array,
    resulting in a more intuitive UI.
    """

    def formfield(self, **kwargs):
        defaults = {
            "form_class": InvertedMultipleChoiceField,
            "choices": self.base_field.choices,
            "widget": InvertedCheckboxSelectMultiple,
            **kwargs,
        }
        return super(ArrayField, self).formfield(**defaults)
