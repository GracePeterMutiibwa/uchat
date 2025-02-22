from django.shortcuts import render, redirect

from django.views.decorators.cache import cache_control

from django.contrib.auth.decorators import login_required, user_passes_test

from django.contrib import messages

from django.http import HttpRequest, JsonResponse

from django.contrib.auth import login, logout

from custom_user.models import User

from .ucTools import AuthTools, SaveTools, LoadTools, TrashTools, BotUtils


def custom404View(request, exception):
    return render(request, "errors/400.html", status=404)


def custom500View(request):
    return render(request, "errors/500.html", status=500)


def notAuthenticated(userInstance: User):
    return userInstance.is_authenticated is False


def loadUchatHomePage(request):
    return render(request, "public/home.html")


@user_passes_test(notAuthenticated, login_url="uc:router")
@cache_control(no_store=True, no_cache=True, must_revalidate=True)
def loadUchatLoginPage(request):

    return render(request, "public/login.html")


@login_required(login_url="uc:login")
@cache_control(no_store=True, no_cache=True, must_revalidate=True)
def ucLogout(request):
    logout(request)

    return redirect("uc:router")


@cache_control(no_store=True, no_cache=True, must_revalidate=True)
def ucRouter(request: HttpRequest):
    if request.user.is_authenticated:
        redirectUrl = "uc:dash"

    else:
        redirectUrl = "uc:login"

    return redirect(redirectUrl)


@login_required(login_url="uc:login")
@cache_control(no_store=True, no_cache=True, must_revalidate=True)
def loadUchatDashBoard(request: HttpRequest):
    dashContext = {"base_url": request.build_absolute_uri("/")}

    # api url
    LoadTools().loadApiEndpoint(whereToLoad=dashContext)

    # external data sources
    LoadTools().loadDataSources(whereToLoad=dashContext)

    # programs
    LoadTools().loadPresentPrograms(whereToLoad=dashContext)

    # lectures
    LoadTools().loadTimeTableData(whereToLoad=dashContext)

    # bots
    LoadTools().loadBotMeta(whereToLoad=dashContext)

    # cache metrics
    LoadTools().loadCacheMetrics(whereToLoad=dashContext)

    return render(request, "control/dash.html", context=dashContext)


@user_passes_test(notAuthenticated, login_url="uc:router")
@cache_control(no_store=True, no_cache=True, must_revalidate=True)
def ucValidateLogin(request: HttpRequest):
    # get
    loginMeta = request.POST.dict()

    presenceStatus, _ = AuthTools().userExists(userEmail=loginMeta["login-email"])

    # back to login in case of anything
    defaultUrl = request.META["HTTP_REFERER"]

    # print("Status:", presenceStatus)

    if presenceStatus is True:
        if _.check_password(raw_password=loginMeta["login-password"]):
            # login
            login(request, _)

            # router
            defaultUrl = "uc:router"

        else:
            messages.warning(
                request, "Either the email or password is invalid.., please try again.."
            )

    else:
        messages.error(request, "No account with such details was found...")

    return redirect(defaultUrl)


@login_required(login_url="uc:login")
@cache_control(no_store=True, no_cache=True, must_revalidate=True)
def updateAccountPassword(request):
    # details
    passwordData = request.POST.dict()

    attachedUser: User = request.user

    # update
    AuthTools().updatePassword(
        attachedUser=attachedUser, newPassword=passwordData["confirm-password"]
    )

    messages.success(request, "Your password was updated successfully!")

    return redirect(request.META["HTTP_REFERER"])


@login_required(login_url="uc:login")
@cache_control(no_store=True, no_cache=True, must_revalidate=True)
def manageApiEndpoint(request: HttpRequest):
    # get
    endpointMeta = request.POST.dict()

    # status
    writtenUrl = SaveTools().saveNewApiEndPoint(endpointMeta=endpointMeta)

    if not writtenUrl is None:
        messages.success(
            request, f"The  Scrapper and RAG API settings were updated successfully"
        )

    else:
        messages.warning(request, "Oops.. you provided a malformed url..")

    return redirect(request.META["HTTP_REFERER"])


@login_required(login_url="uc:login")
@cache_control(no_store=True, no_cache=True, must_revalidate=True)
def manageExternalSources(request: HttpRequest):
    # get
    externalSourceMeta = request.POST.dict()

    # {'type': '2',
    # 'status': 'new',
    #  'source-label': 'aa',
    #  'source-content': 'aa'}

    # print(">", externalSourceMeta)

    messageToShow = SaveTools().manageSourceData(sourceMeta=externalSourceMeta)

    messages.success(request, messageToShow)

    return redirect(request.META["HTTP_REFERER"])


@login_required(login_url="smart:login")
@cache_control(no_store=True, no_cache=True, must_revalidate=True)
def ucDeleteExternalSource(request, sourceTag: str):
    # get and wipe
    sourceName = TrashTools().deleteExternalSource(sourceTag=sourceTag)

    if sourceName is None:
        messages.warning(request, "Ooops, it appears like you followed a bad link..")

    else:
        messages.success(request, f"The source named `{sourceName}` was deleted")

    return redirect(request.META["HTTP_REFERER"])


@login_required(login_url="uc:login")
@cache_control(no_store=True, no_cache=True, must_revalidate=True)
def manageBotConfiguration(request: HttpRequest):
    # get
    botConfigurationMeta = request.POST.dict()

    # {
    # 'bot': 'new', 'prompt': 'Lorem ipsum dolor sit amet,',
    # 'bot-avatar': some link
    # 'sources': '6a5d0ce1-0fda-4b31-9ab4-31c36371f92e|5dbe0db5-98e4-4c4c-ac83-74909b6e3076'
    # }
    # print("bot:", botConfigurationMeta)
    botMessage = SaveTools().saveUpdateBot(botMeta=botConfigurationMeta)

    if botMessage is None:
        messages.warning(request, "The avatar link you provided is invalid (malformed)")

    else:
        messages.success(request, "your changes where added successfully...")

    return redirect(request.META["HTTP_REFERER"])


@login_required(login_url="smart:login")
@cache_control(no_store=True, no_cache=True, must_revalidate=True)
def ucDeleteBot(request, botTag: str):
    # get
    botName = TrashTools().deleteBotInstance(botTag=botTag)

    if botName is None:
        messages.warning(request, "Ooops, it appears like you followed a bad link..")

    else:
        messages.success(request, f"The ChatBot named `{botName}` was deleted")

    return redirect(request.META["HTTP_REFERER"])


def serveBotWidget(request, botTag: str):
    # prepare
    botWidget = BotUtils().prepareBotWidget(botTag=botTag, request=request)

    return botWidget
