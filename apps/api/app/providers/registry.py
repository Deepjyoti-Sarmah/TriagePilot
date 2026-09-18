"""Registry. Same names, same env selection, same defaults as
apps/web/lib/providers/index.ts.
"""
import os

from .activepieces import ActivepiecesProvider, ProviderError  # noqa: F401
from .direct import openai_provider, openrouter_provider
from .mock import MockProvider

mock_provider = MockProvider()
activepieces_provider = ActivepiecesProvider()

REGISTRY = {
    "mock": mock_provider,
    "activepieces": activepieces_provider,
    "openrouter": openrouter_provider,
    "openai": openai_provider,
}

PROVIDER_NAMES = list(REGISTRY.keys())


def ap_configured() -> bool:
    # Webhook is the only live requirement (OAuth MCP has no static token).
    return bool(os.environ.get("AP_FLOW_WEBHOOK_URL"))


def resolve_provider():
    raw = os.environ.get("TRIAGE_PROVIDER", "").strip().lower()
    if not raw:
        return activepieces_provider if ap_configured() else mock_provider
    try:
        return REGISTRY[raw]
    except KeyError:
        raise ProviderError(
            f'Unknown TRIAGE_PROVIDER "{raw}". Known: {", ".join(PROVIDER_NAMES)}.',
            status=400, code="unknown_provider",
        ) from None
