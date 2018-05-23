"""Stubs for the whole project to be used for typing annotations."""

# pylint: disable=pointless-statement,missing-docstring,unused-argument,invalid-name

from typing import Any, Generic, Iterable, Optional, Tuple, Type, TypeVar

from django.db.models import Model


T = TypeVar("T")
Typing = Any


class ReverseFKType(Generic[T]):
    """Stub to represent the related field of a django ``ForeignKey``/``OneToOneField``."""

    def add(self, *objs: T, bulk: Optional[bool] = True) -> None:
        ...

    def remove(self, *objs: T, bulk: Optional[bool] = True) -> None:
        ...

    def clear(self, bulk: bool = True) -> None:
        ...

    def set(
        self,
        objs: Iterable[T],
        bulk: Optional[bool] = True,
        clear: Optional[bool] = False,
    ) -> None:
        ...

    def create(self, **kwargs: Any) -> T:
        ...

    def get_or_create(self, **kwargs: Any) -> Tuple[T, bool]:
        ...

    def update_or_create(self, **kwargs: Any) -> Tuple[T, bool]:
        ...


ReverseO2O = ReverseFKType


class M2MType(Generic[T]):
    """Stub to represent both sides of a django ``ManyToManyField``."""

    through: Type[Model]

    def add(self, *objs: T) -> None:
        ...

    def remove(self, *objs: T) -> None:
        ...

    def clear(self) -> None:
        ...

    def set(self, objs: Iterable[T], clear: Optional[bool] = False) -> None:
        ...

    def create(self, **kwargs: Any) -> T:
        ...

    def get_or_create(self, **kwargs: Any) -> Tuple[T, bool]:
        ...

    def update_or_create(self, **kwargs: Any) -> Tuple[T, bool]:
        ...


UniqueTogether = Iterable[Iterable[str]]
TupleOfStr = Tuple[str, ...]
