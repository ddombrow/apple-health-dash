from __future__ import annotations

import os
from pathlib import Path

import httpx
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import (
    FileResponse,
    PlainTextResponse,
    Response,
)
from starlette.routing import Route


ROOT = Path(__file__).resolve().parent
DIST_DIR = ROOT / "console" / "dist"
INDEX_FILE = DIST_DIR / "index.html"
MSW_FILE = ROOT / "console" / "mockServiceWorker.js"
API_UPSTREAM = os.environ.get("CONSOLE_API_UPSTREAM", "http://localhost:4001")
MILEAGE_UPSTREAM = os.environ.get("CONSOLE_MILEAGE_UPSTREAM", "http://localhost:8080")
HOP_BY_HOP_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "host",
}


def _ensure_build() -> None:
    if not INDEX_FILE.is_file():
        raise RuntimeError(
            "Missing console build output. Run `npm run build --prefix console` first."
        )


def _safe_file(base: Path, relative_path: str) -> Path | None:
    target = (base / relative_path).resolve()
    try:
        target.relative_to(base.resolve())
    except ValueError:
        return None
    if not target.is_file():
        return None
    return target


def _filtered_headers(headers) -> dict[str, str]:
    return {
        key: value
        for key, value in headers.items()
        if key.lower() not in HOP_BY_HOP_HEADERS
    }


async def _proxy(request: Request, upstream: str, path: str) -> Response:
    query = request.url.query
    upstream_url = f"{upstream.rstrip('/')}/{path}"
    if query:
        upstream_url = f"{upstream_url}?{query}"

    timeout = httpx.Timeout(60.0)
    req_headers = _filtered_headers(request.headers)
    req_body = await request.body()

    async with httpx.AsyncClient(follow_redirects=False, timeout=timeout) as client:
        upstream_response = await client.request(
            method=request.method,
            url=upstream_url,
            headers=req_headers,
            content=req_body,
        )

    response_headers = _filtered_headers(upstream_response.headers)
    return Response(
        content=upstream_response.content,
        status_code=upstream_response.status_code,
        headers=response_headers,
    )


async def health(_: object) -> Response:
    return PlainTextResponse("ok")


async def console_index(_: object) -> Response:
    _ensure_build()
    return FileResponse(INDEX_FILE)


async def mock_service_worker(_: object) -> Response:
    if not MSW_FILE.is_file():
        return PlainTextResponse("Not Found", status_code=404)
    return FileResponse(MSW_FILE)


async def console(request) -> Response:
    _ensure_build()
    path = request.path_params.get("path", "")
    file_path = _safe_file(DIST_DIR, path)
    if file_path is not None:
        return FileResponse(file_path)

    # Client-side routes should render the app shell, but missing file-like paths
    # should stay 404 so browsers do not receive HTML for JS/CSS requests.
    if Path(path).suffix:
        return PlainTextResponse("Not Found", status_code=404)

    return FileResponse(INDEX_FILE)


async def api_proxy(request: Request) -> Response:
    path = request.path_params.get("path", "")
    return await _proxy(request, API_UPSTREAM, f"api/{path}")


async def mileage_proxy(request: Request) -> Response:
    path = request.path_params.get("path", "")
    return await _proxy(request, MILEAGE_UPSTREAM, f"mileage/{path}")


app = Starlette(
    routes=[
        Route("/healthz", health),
        Route("/mockServiceWorker.js", mock_service_worker),
        Route(
            "/api",
            api_proxy,
            methods=["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
        ),
        Route(
            "/api/{path:path}",
            api_proxy,
            methods=["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
        ),
        Route(
            "/mileage",
            mileage_proxy,
            methods=["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
        ),
        Route(
            "/mileage/{path:path}",
            mileage_proxy,
            methods=["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
        ),
        Route("/console", console_index),
        Route("/console/", console_index),
        Route("/console/{path:path}", console),
    ]
)
