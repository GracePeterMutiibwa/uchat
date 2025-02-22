from django.urls import path
from . import views

app_name = "uc"


urlpatterns = [
    path("", views.loadUchatHomePage, name="home"),
    path("login/", views.loadUchatLoginPage, name="login"),
    # manager
    path("dashboard/", views.loadUchatDashBoard, name="dash"),
    # routes
    path("router/", views.ucRouter, name="router"),
    # auth
    path("logout/", views.ucLogout, name="logout"),
    path("authenticate-login/", views.ucValidateLogin, name="authenticate-login"),
    path("change-password/", views.updateAccountPassword, name="update-password"),
    # save
    path("save-api-url/", views.manageApiEndpoint, name="manage-endpoint"),
    path("save-external-data/", views.manageExternalSources, name="manage-external"),
    path(
        "trash-source/<str:sourceTag>/",
        views.ucDeleteExternalSource,
        name="trash-source",
    ),
    path(
        "manage-configuration/",
        views.manageBotConfiguration,
        name="manage-configuration",
    ),
    path(
        "trash-bot/<str:botTag>/",
        views.ucDeleteBot,
        name="trash-bot",
    ),
    path(
        "get-widget/<str:botTag>/",
        views.serveBotWidget,
        name="get-widget",
    ),
]
