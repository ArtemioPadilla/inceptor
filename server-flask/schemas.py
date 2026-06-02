"""Pydantic models mirroring the frontend Zod schemas in ``src/schemas/``.

No cross-language reuse is possible, so the OpenAPI contract is the shared
artifact that keeps Python and TypeScript honest — asserted by the contract
test. Field rules (lengths, honeypot, trimming) mirror ``contact.ts`` /
``feedback.ts`` one-for-one. See ADR 0006.
"""

from typing import Annotated

from pydantic import BaseModel, EmailStr, Field, StringConstraints

# Honeypot: visually hidden in the form; bots fill it, humans don't. max_length=0
# means a non-empty value fails validation (mirrors Zod `z.string().max(0)`).
Honeypot = Annotated[str, StringConstraints(max_length=0)]


class ContactModel(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]
    email: EmailStr
    message: Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=10, max_length=2000)
    ]
    website: Honeypot


class NewsletterModel(BaseModel):
    email: EmailStr
    website: Honeypot


class FeedbackModel(BaseModel):
    title: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=120)]
    body: Annotated[str, StringConstraints(strip_whitespace=True, min_length=10, max_length=8000)]
    labels: list[Annotated[str, StringConstraints(min_length=1, max_length=50)]] | None = Field(
        default=None, max_length=10
    )
    website: Honeypot
