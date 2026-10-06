from fastapi import Request
from fastapi.responses import JSONResponse
from starlette import status

from core.logging_config import logger

async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception for %s %s", request.method, request.url.path)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal Server Error"
        }
    )