from fastapi import Request
from fastapi.responses import JSONResponse
from starlette import status

from core.logging_config import logger

async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {exc}")

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "details": "Internal Server Error"
        }
    )