from django.contrib import admin

from django.urls import path, include

from ninja import NinjaAPI

from core.api import uchat_router

api = NinjaAPI()

api.add_router("", uchat_router)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("core.urls")),
    path("api/", api.urls),
]


# handlers
handler404 = "core.views.custom404View"

handler500 = "core.views.custom500View"
