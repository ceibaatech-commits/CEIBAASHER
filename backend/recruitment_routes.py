"""
CEIBAA Recruitment Portal — Route Aggregator
Merges all sub-module routers into a single `router` for server.py registration.
Split into: core_routes, social_routes, quiz_routes, bulk_routes
"""
from fastapi import APIRouter
from recruitment.core_routes import router as core_router
from recruitment.social_routes import router as social_router
from recruitment.quiz_routes import router as quiz_router
from recruitment.bulk_routes import router as bulk_router

router = APIRouter()

router.include_router(core_router)
router.include_router(social_router)
router.include_router(quiz_router)
router.include_router(bulk_router)
