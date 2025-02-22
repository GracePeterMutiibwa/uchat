from custom_user.models import User

# from .mailingTools import MailPreProcessor

import json

from django.http import HttpRequest

import secrets

from django.utils import timezone

from datetime import datetime

from django.http import HttpResponse

from .widgetTools import WidgetManager

from .models import (
    ResetLink,
    SourceItem,
    ApiRootItem,
    ProgramItem,
    TTProgram,
    TimeTableSlot,
    BotItem,
    CacheMetricsItem,
)

import re


class UrlValidator:
    def __init__(self):
        self.__valid_patterns = (
            r"^"  # Start of string
            r"(?:https?:\/\/)?"  # Protocol: op
            r"(?:[\w\-]+\.)*[\w\-]+\.[a-zA-Z]{2,63}"  # Domain with subdomains
            r"(?::\d{1,5})?"  # Port (optional)
            r"(?:\/(?:["  # Path start
            r"\w"  # Word chars
            r"\-"  # Hyphen
            r"\."  # Dot
            r"\_"  # Underscore
            r"\~"  # Tilde
            r"\/"  # Forward slash
            r"\?"  # Question mark
            r"\#"  # Hash
            r"\["  # Square brackets
            r"\]"
            r"\@"  # At symbol
            r"\!"  # Exclamation
            r"\$"  # Dollar
            r"\&"  # Ampersand
            r"\'"  # Single quote
            r"\("  # Parentheses
            r"\)"
            r"\*"  # Asterisk
            r"\+"  # Plus
            r"\,"  # Comma
            r"\;"  # Semicolon
            r"\="  # Equals
            r"]*)*)?"  # Path end: op
            r"(?:\?[^#\s]*)?"  # Query string: op
            r"(?:#\S*)?"  # Fragment: op
            r"$"
        )

    def isValid(self, resourceUrl):
        """
        Check if the url isn't malformed
        """
        return bool(re.match(self.__valid_patterns, resourceUrl))


class FetchTools:

    def inflateSourceList(self, sourceString: str):
        return sourceString.split("|")

    def getMetricsItem(self):
        # get
        foundMetrics = CacheMetricsItem.objects.first()

        if foundMetrics is None:
            foundMetrics = CacheMetricsItem.objects.create()

        return foundMetrics

    def getApiItem(self):
        # get the present item
        foundItem = ApiRootItem.objects.first()

        if foundItem is None:
            # create a new one
            foundItem = ApiRootItem.objects.create()

        return foundItem

    def getSourceViaTag(self, sourceItemTag: str):
        return SourceItem.objects.filter(sourceItemTag=sourceItemTag).first()

    def getAllSources(self):
        return SourceItem.objects.all()

    def getAllProgramItems(self):
        return ProgramItem.objects.all()

    def getAllTimeTableSlots(self):
        return TimeTableSlot.objects.all()

    def getTTProgramViaName(self, ttProgramName: str):
        return TTProgram.objects.filter(ttProgramName=ttProgramName).first()

    def getBotViaTag(self, botTag: str):
        return BotItem.objects.filter(botTag=botTag).first()

    def getBotStatus(self, botTag: str):
        return BotItem.objects.filter(botTag=botTag).exists()

    def getAllBots(self):
        return BotItem.objects.all()


class BotUtils:
    def processBotSources(self, botTag: str):
        # get
        foundBot: BotItem = FetchTools().getBotViaTag(botTag=botTag)

        # find sources
        sourceList = FetchTools().inflateSourceList(sourceString=foundBot.botSources)

        # context documents
        botDocuments = {}

        for eachSourceTag in sourceList:
            if eachSourceTag in ["timetable", "programs"]:
                if eachSourceTag == "timetable":
                    LoadTools().loadTimeTableData(
                        whereToLoad=botDocuments, formatMode=1
                    )

                else:
                    LoadTools().loadPresentPrograms(
                        whereToLoad=botDocuments, formatMode=1
                    )

            else:
                # get
                sourceMeta: SourceItem = FetchTools().getSourceViaTag(
                    sourceItemTag=eachSourceTag
                )

                botDocuments[sourceMeta.sourceLabel] = sourceMeta.sourceContent

        # prompt
        systemPrompt = {"role": "system", "content": foundBot.botPrompt}

        return systemPrompt, botDocuments

    def getBotTitle(self, botTag: str):
        # get
        botInstance: BotItem = FetchTools().getBotViaTag(botTag=botTag)

        return botInstance.botLabel, botInstance.botAvatar

    def extractWidgetTag(self, widgetMeta: str):
        #                       -> -2 (is the display position)
        # e0dc963a-c123-475f-bd08-99eb9d1b363d-2

        tagChecks = [
            len(widgetMeta) == 38,
            widgetMeta[-1].isnumeric() and int(widgetMeta[-1]) in [1, 2],
        ]

        # confirm
        isValid = all(tagChecks)

        if isValid:
            widgetTagPositionMeta = (widgetMeta[:-2], int(widgetMeta[-1]))

        else:
            widgetTagPositionMeta = None

        return widgetTagPositionMeta

    def prepareBotWidget(self, botTag: str, request: HttpRequest):
        # get the tag and position
        widgetTagAndPosition = self.extractWidgetTag(widgetMeta=botTag)

        # get
        if widgetTagAndPosition is None or (
            not FetchTools().getBotStatus(botTag=widgetTagAndPosition[0])
        ):
            return HttpResponse("Invalid widget code", status=400)

        # print("passed here")

        titleAndAvatar = self.getBotTitle(botTag=widgetTagAndPosition[0])

        # get the status
        widgetConfig = self.getWidgetConfig(
            widgetTag=widgetTagAndPosition[0],
            widgetTitle=titleAndAvatar[0],
            widgetAvatar=titleAndAvatar[1],
            variantTag=widgetTagAndPosition[1],
            request=request,
        )

        # get js
        botJs = WidgetManager().generateJsCode(widgetConfig=widgetConfig)

        # prepare, also cache for 1 hour only
        widgetResponse = HttpResponse(botJs, content_type="application/javascript")

        widgetResponse["Cache-Control"] = "public, max-age=3600"

        return widgetResponse

    def getWidgetConfig(
        self,
        widgetTag: str,
        widgetTitle: str,
        widgetAvatar: str,
        variantTag: int,
        request: HttpRequest,
    ):

        return {
            "variant": variantTag,
            "title": widgetTitle,
            "avatar": widgetAvatar,
            "api_endpoint": self.generateUrl(
                request=request, topLevelLink=f"api/chat/{widgetTag}"
            ),
        }

    def generateUrl(self, request: HttpRequest, topLevelLink: str):
        # base
        baseUrl = request.build_absolute_uri("/")

        # merge the base url with the top level link
        completeUrl = f"{baseUrl}{topLevelLink}"

        return completeUrl


class TrashTools:
    def deleteExternalSource(self, sourceTag: str):
        # get
        foundSource = FetchTools().getSourceViaTag(sourceItemTag=sourceTag)

        sourceName = None

        if foundSource:
            # keep label for reference
            sourceName = foundSource.sourceLabel

            foundSource.delete()

        return sourceName

    def deleteBotInstance(self, botTag: str):
        # get
        foundBot: BotItem = FetchTools().getBotViaTag(botTag=botTag)

        botName = None

        if foundBot:
            # reference
            botName = foundBot.botLabel

            # get attached sources
            sourcesAttached = FetchTools().inflateSourceList(
                sourceString=foundBot.botSources
            )

            foundBot.delete()

            # release sources
            SaveTools().trackSourceUsage(sourceList=sourcesAttached, actionTag=0)

        return botName


class SaveTools:
    def trackSourceUsage(self, sourceList: list, actionTag: int):
        for eachSourceTag in sourceList:
            if eachSourceTag in ["programs", "timetable"]:
                # get
                metricsInstance: CacheMetricsItem = FetchTools().getMetricsItem()

                if eachSourceTag == "programs":
                    if actionTag == 1:
                        metricsInstance.programUsage += 1

                    else:
                        metricsInstance.programUsage -= 1

                else:
                    if actionTag == 1:
                        metricsInstance.ttUsage += 1

                    else:
                        metricsInstance.ttUsage -= 1

                # write changes
                metricsInstance.save()

            else:
                # get the program
                attachedSource: SourceItem = FetchTools().getSourceViaTag(
                    sourceItemTag=eachSourceTag
                )

                if actionTag == 1:
                    attachedSource.usageCount += 1

                else:
                    attachedSource.usageCount -= 1

                # save usage
                attachedSource.save()

        return

    def saveUpdateBot(self, botMeta: dict):
        # validate
        botAvatarLink = botMeta["bot-avatar"]

        if not UrlValidator().isValid(resourceUrl=botAvatarLink):
            return None

        # get
        botStatus = botMeta["bot"]

        # get
        botLabel = botMeta["bot-label"].strip().title()

        botPrompt = botMeta["prompt"]

        botSources = botMeta["sources"]

        # list
        sourceList = FetchTools().inflateSourceList(sourceString=botSources)

        isNew = botStatus == "new"

        if isNew:
            BotItem.objects.create(
                botLabel=botLabel,
                botSources=botSources,
                botPrompt=botPrompt,
                botAvatar=botAvatarLink,
            )

        else:
            foundBot: BotItem = FetchTools().getBotViaTag(botTag=botStatus)

            oldList = FetchTools().inflateSourceList(sourceString=foundBot.botSources)

            self.trackSourceUsage(sourceList=oldList, actionTag=0)

            foundBot.botLabel = botLabel

            foundBot.botSources = botSources

            foundBot.botPrompt = botPrompt

            foundBot.botAvatar = botAvatarLink

            foundBot.save()

        # make updates for the new sources
        self.trackSourceUsage(sourceList=sourceList, actionTag=1)

        displayMessage = (
            f"Bot configuration for `{botLabel}` was created successfully.."
            if isNew
            else f"You changes to Bot: `{botLabel}` were applied successfully"
        )

        return displayMessage

    def saveTTSlots(self, weekDay: str, presentSlots: list, attachedProgram: TTProgram):
        # format and collect
        slotItems = [
            TimeTableSlot(
                attachedProgram=attachedProgram,
                dayLabel=weekDay,
                lectureParticulars=eachLectureSlot["particulars"],
                lectureDuration=eachLectureSlot["duration"],
            )
            for eachLectureSlot in presentSlots
        ]

        # save
        TimeTableSlot.objects.bulk_create(slotItems)

        return

    def saveTimeTableItems(self, timeTableMeta: dict):
        """
        {
            "batch": "YEAR I",
            "group": "MBR 1:",
            "program": "MBR 1",
            "timetable": {
                "Monday": [
                            {
                                "particulars": "MBR 1, PHA I, BSP I,PHS1211 / PHS1221   Physiology II,S403",
                                "duration": "08:00-10:00"
                            }
                ]
            }
        }
        """

        # wipe old
        oldDetails = FetchTools().getTTProgramViaName(
            ttProgramName=timeTableMeta["program"]
        )

        if not oldDetails is None:
            # foreign key relationships get rid of the rest
            # of the records
            oldDetails.delete()

        # new one
        newProgramInfo = TTProgram.objects.create(
            ttProgramName=timeTableMeta["program"],
            # i.e. HEAC I has many different sub programs
            ttProgramBatch=timeTableMeta["group"],
            # specific year i.e. YEAR I
            ttProgramYear=timeTableMeta["batch"],
        )

        for weekDay, eachDaySlots in timeTableMeta["timetable"].items():
            self.saveTTSlots(
                weekDay=weekDay,
                presentSlots=eachDaySlots,
                attachedProgram=newProgramInfo,
            )

        return

    def saveProgramItems(self, programRecords: list):
        """
        {'Code': 'MBR',
        'Duration': '5 Years',
        'Program Link': 'https://www.must.ac.ug/programme/bachelor-of-medicine-and-bachelor-of-surgery/',
        'Programme Name': 'Bachelor of Medicine and Bachelor of Surgery',
        'Study Time': 'Fulltime'
        }
        """

        # format
        programsToCreate = [
            ProgramItem(
                programmeCode=eachRecord.get("Code"),
                programmeDuration=eachRecord.get("Duration"),
                programLink=eachRecord.get("Program Link"),
                programName=eachRecord.get("Programme Name"),
                programmeStudyMode=eachRecord.get("Study Time"),
            )
            for eachRecord in programRecords
        ]

        # wipe present items
        FetchTools().getAllProgramItems().delete()

        # replace with the new ones
        ProgramItem.objects.bulk_create(programsToCreate)

        return

    def prepareDateStamp(self, dateInstance: datetime):
        # format
        return dateInstance.astimezone(tz=timezone.get_current_timezone())

    def manageSourceData(self, sourceMeta: dict):
        sourceStatus = sourceMeta["status"]

        # get
        sourceLabel = sourceMeta["source-label"].strip().lower()

        sourceType = int(sourceMeta["type"])

        sourceData = sourceMeta["source-content"]

        isNew = sourceStatus == "new"

        if isNew:
            SourceItem.objects.create(
                sourceType=sourceType,
                sourceLabel=sourceLabel,
                sourceContent=sourceData,
            )

        else:
            foundSource: SourceItem = FetchTools().getSourceViaTag(
                sourceItemTag=sourceStatus
            )

            foundSource.sourceType = sourceType

            foundSource.sourceLabel = sourceLabel

            foundSource.sourceContent = sourceData

            foundSource.save()

        # alert
        displayMessage = (
            "Your new datasource was saved successfully.."
            if isNew
            else "You changes were applied successfully"
        )

        return displayMessage

    def saveNewApiEndPoint(self, endpointMeta: dict):
        # get
        apiEndpoint = endpointMeta["api-endpoint"]

        if UrlValidator().isValid(resourceUrl=apiEndpoint):
            # save
            endPointInstance = FetchTools().getApiItem()

            endPointInstance.queryEndPoint = apiEndpoint

            # details
            endPointInstance.inferenceApiKey = endpointMeta["api-key"]

            endPointInstance.scrapApiKey = endpointMeta["scrap-key"]

            endPointInstance.save()

        else:
            apiEndpoint = None

        return apiEndpoint


class LoadTools:
    def loadCacheMetrics(self, whereToLoad: dict):
        # get
        metricsInstance: CacheMetricsItem = FetchTools().getMetricsItem()

        whereToLoad["cache_metrics"] = {
            "programs": metricsInstance.programUsage,
            "timetable": metricsInstance.ttUsage,
        }

        return

    def resolveSources(self, sourceList: list):
        sourceNames = []

        for eachTag in sourceList:
            if eachTag in ["programs", "timetable"]:
                sourceNames.append(eachTag)

            else:
                referenceSource: SourceItem = FetchTools().getSourceViaTag(
                    sourceItemTag=eachTag
                )

                sourceNames.append(referenceSource.sourceLabel)

        return ", ".join(sourceNames)

    def loadBotMeta(self, whereToLoad: dict):
        # get
        foundBots = FetchTools().getAllBots()

        # format
        formattedBots = [
            {
                "created": SaveTools()
                .prepareDateStamp(dateInstance=eachBot.createdDate)
                .strftime("%b %d, %Y"),
                "sources": len(
                    FetchTools().inflateSourceList(sourceString=eachBot.botSources)
                ),
                "src": eachBot.botSources,
                "tag": eachBot.botTag,
                "label": eachBot.botLabel,
                "prompt": eachBot.botPrompt,
                "src_label": self.resolveSources(
                    sourceList=FetchTools().inflateSourceList(eachBot.botSources)
                ),
                "slug": eachBot.botSlug,
                "avatar": eachBot.botAvatar,
            }
            for eachBot in foundBots
        ]

        if len(formattedBots) > 0:
            whereToLoad["available_bots"] = formattedBots
        else:
            pass

        return

    def loadTimeTableData(self, whereToLoad: dict, formatMode=0):
        # get
        foundSlots = FetchTools().getAllTimeTableSlots()

        # formatted
        formattedSlots = [
            {
                "year": (
                    eachSlot.attachedProgram.ttProgramYear
                    if eachSlot.attachedProgram
                    else ""
                ),
                "program": (
                    eachSlot.attachedProgram.ttProgramName
                    if eachSlot.attachedProgram
                    else ""
                ),
                "day": eachSlot.dayLabel,
                "duration": eachSlot.lectureDuration,
                "particulars": eachSlot.lectureParticulars,
            }
            for eachSlot in foundSlots
        ]

        if len(formattedSlots) > 0:
            if formatMode == 0:
                whereToLoad["present_lectures"] = formattedSlots

            else:
                whereToLoad["lecture information"] = formattedSlots

        else:
            pass

        return

    def loadPresentPrograms(self, whereToLoad: dict, formatMode=0):
        # get
        programsFound = FetchTools().getAllProgramItems()

        # format
        formattedProgrammes = [
            {
                "name": eachProgram.programName,
                "code": eachProgram.programmeCode,
                "mode": eachProgram.programmeStudyMode,
                "duration": eachProgram.programmeDuration,
                "link": eachProgram.programLink,
            }
            for eachProgram in programsFound
        ]

        if len(formattedProgrammes) > 0:
            # load
            if formatMode == 0:
                whereToLoad["present_programs"] = formattedProgrammes

            else:
                whereToLoad["university programs"] = formattedProgrammes
        else:
            pass

        return

    def loadDataSources(self, whereToLoad: dict):
        # get
        activeSources = FetchTools().getAllSources()

        # format the sources
        formattedSources = [
            {
                "type": int(eachSource.sourceType),
                "label": eachSource.sourceLabel,
                "content": eachSource.sourceContent,
                "tag": str(eachSource.sourceItemTag),
                "usage": eachSource.usageCount,
                "date": SaveTools()
                .prepareDateStamp(dateInstance=eachSource.createdDate)
                .strftime("%b %d, %Y"),
            }
            for eachSource in activeSources
        ]

        # print(formattedSources)

        if len(formattedSources) > 0:
            # load
            whereToLoad["present_sources"] = formattedSources
        else:
            pass

        return

    def loadApiEndpoint(self, whereToLoad: dict):
        # get
        endpointInstance = FetchTools().getApiItem()

        whereToLoad["api_url"] = endpointInstance.queryEndPoint

        whereToLoad["scrap_key"] = endpointInstance.scrapApiKey

        if endpointInstance.hasApiKey():
            whereToLoad["api_key"] = endpointInstance.inferenceApiKey

        return


class AuthTools:
    def deleteUserViaEmail(self, userEmail: str):
        # check if the tag count is not 0
        userStatus, userInstance = self.userExists(userEmail=userEmail)

        if not userInstance is None:
            userInstance.delete()

        else:
            pass

        return userStatus

    def getAdminEmails(self):
        # scan through all the administrator emails
        return [
            eachAdmin.email
            for eachAdmin in User.objects.filter(is_superuser=False).all()
        ]

    def resetTagIsValid(self, resetTag: str):
        # check if the tag count is not 0
        tagCount = ResetLink.objects.filter(resetTag=resetTag).count()

        return tagCount > 0

    def executeTemporaryPasswordIssuance(self, resetTag: str, request: HttpRequest):
        # get the tag
        resetEmail, linkForReset = self.getAttachedEmailFromTag(resetTag=resetTag)

        # user
        attachedUser: User = linkForReset.attachedUser

        # access the users object
        temporaryPassword: str = self.randomPasswordMint()

        loginUrl = self.generateUrl(request=request, topLevelLink="login/")

        # make a password update
        self.updatePassword(attachedUser=attachedUser, newPassword=temporaryPassword)

        # send the email
        # MailPreProcessor().pushMailMessage(
        #     mailInfo=[temporaryPassword, loginUrl], recipients=[resetEmail], mailType=2
        # )

        # get rid of the reset link
        linkForReset.delete()

        # print('All has been done..')

        return

    def createBaseUser(self, userEmail: str, userPassword: str):
        # create
        newUser: User = User.objects.create(email=userEmail)

        newUser.set_password(userPassword)

        newUser.save()

        return

    def randomPasswordMint(self):
        return secrets.token_urlsafe(4)

    def updatePassword(self, attachedUser: User, newPassword: str):
        # change
        attachedUser.set_password(raw_password=newPassword)

        attachedUser.save()

        return

    def userExists(self, userEmail: str):
        # matches
        userObject = User.objects.filter(email=userEmail).first()

        return not userObject is None, userObject

    def hasResetLinkAlready(self, userInstance: User):
        linkCount = userInstance.my_links.count()

        # print('Count:', linkCount)

        return linkCount > 0

    def prepareReset(self, attachedUserObject: User):
        # save new link
        newResetLink: ResetLink = ResetLink.objects.create(
            attachedEmail=attachedUserObject.email, attachedUser=attachedUserObject
        )

        newResetLink.save()

        # get reset id
        resetId: str = str(newResetLink.resetTag)

        # resetId = '1234'

        # print("Tag:", resetId)

        return resetId

    def getAttachedEmailFromTag(self, resetTag: str):
        # get the link
        foundLink: ResetLink = ResetLink.objects.filter(resetTag=resetTag).first()

        return foundLink.attachedEmail, foundLink

    def generateUrl(self, request: HttpRequest, topLevelLink: str):
        # generate a base url for the login page
        baseUrl = request.build_absolute_uri("/")

        # merge the base url with the top level link
        completeUrl = f"{baseUrl}{topLevelLink}"

        return completeUrl

    def broadCastResetLink(self, linkTag: str, request: HttpRequest):
        # get the attached email
        attachedEmail, _ = self.getAttachedEmailFromTag(resetTag=linkTag)

        # create a reset url from the base and the tag
        resetUrl = self.generateUrl(
            request=request, topLevelLink=f"resolve-reset/{linkTag}/"
        )

        # print("Rest url:", resetUrl)

        # # send the mail reset link mail message
        # MailPreProcessor().pushMailMessage(
        #     mailInfo=[resetUrl], recipients=[attachedEmail], mailType=1
        # )

        return
