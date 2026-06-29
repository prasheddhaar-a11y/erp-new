"""
Small in-process response cache for expensive dashboard reads.

The cache is intentionally short lived so repeated tunnel requests feel fast
without changing role permissions or long-term data freshness.
"""

from __future__ import annotations

from copy import deepcopy
from time import monotonic
from typing import Any, Hashable


_CACHE: dict[Hashable, tuple[float, Any]] = {}


def get_cached(key: Hashable) -> Any | None:
    item = _CACHE.get(key)
    if not item:
        return None

    expires_at, value = item
    if expires_at <= monotonic():
        _CACHE.pop(key, None)
        return None

    return deepcopy(value)


def set_cached(key: Hashable, value: Any, ttl_seconds: int = 20) -> Any:
    _CACHE[key] = (monotonic() + ttl_seconds, deepcopy(value))
    return value
