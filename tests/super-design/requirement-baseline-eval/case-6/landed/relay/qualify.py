"""Qualification records that relay's rules for a command form are tied to."""
from dataclasses import dataclass
from typing import Optional

PENDING = "pending"
QUALIFIED = "qualified"


@dataclass(frozen=True)
class Qualification:
    form: str
    state: str
    digest: Optional[str] = None

    @classmethod
    def pending(cls, form):
        return cls(form, PENDING)

    @classmethod
    def qualified(cls, form, digest):
        """A record whose qualification confirmed the binary with this SHA-256 digest."""
        return cls(form, QUALIFIED, digest)

    @property
    def is_qualified(self):
        return self.state == QUALIFIED
