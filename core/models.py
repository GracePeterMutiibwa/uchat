from django.db import models

from custom_user.models import User

from uuid import uuid4

from django.utils import timezone

from datetime import datetime

from django_extensions.db.fields import AutoSlugField


def generateReferenceTag():
    # generate unique ids for each of the records that are saved in the database
    return str(uuid4())


def getCurrentTime(veryNew=None):
    # reference the different time zones to use
    if veryNew is None:
        # get the date
        veryNew = datetime.now()
    else:
        pass

    return veryNew.astimezone(timezone.get_current_timezone())


class ResetLink(models.Model):
    # use a uuid for the reset tag
    resetTag = models.UUIDField(primary_key=True, default=uuid4, editable=False)

    # the users attached email address
    attachedEmail = models.TextField()

    # the attached based user account
    attachedUser = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="my_links"
    )


class SourceItem(models.Model):
    createdDate = models.DateTimeField(default=getCurrentTime)

    sourceItemTag = models.UUIDField(primary_key=True, default=uuid4, editable=False)

    # meta
    sourceType = models.TextField()

    sourceLabel = models.TextField()

    sourceContent = models.TextField()

    usageCount = models.IntegerField(default=0)


class ApiRootItem(models.Model):
    queryEndPoint = models.TextField(default="")

    inferenceApiKey = models.TextField(default="")

    scrapApiKey = models.TextField(default="")

    def hasApiKey(self):
        return len(self.inferenceApiKey.strip()) > 0


class ProgramItem(models.Model):
    programTag = models.UUIDField(primary_key=True, default=uuid4, editable=False)

    programName = models.TextField()

    programmeCode = models.TextField()

    programmeStudyMode = models.TextField()

    programmeDuration = models.TextField()

    programLink = models.TextField()


class TTProgram(models.Model):
    ttProgramTag = models.UUIDField(primary_key=True, default=uuid4, editable=False)

    ttProgramName = models.TextField()

    ttProgramBatch = models.TextField(default="")

    ttProgramYear = models.TextField(default="")


class TimeTableSlot(models.Model):
    timeTableTag = models.UUIDField(primary_key=True, default=uuid4, editable=False)

    attachedProgram = models.ForeignKey(
        TTProgram, on_delete=models.CASCADE, related_name="tt_slots"
    )

    dayLabel = models.TextField()

    lectureParticulars = models.TextField()

    lectureDuration = models.TextField()


class BotItem(models.Model):
    createdDate = models.DateTimeField(auto_now=True)

    botTag = models.UUIDField(primary_key=True, default=uuid4, editable=False)

    botLabel = models.TextField()

    botSources = models.TextField()

    botPrompt = models.TextField()

    botSlug = AutoSlugField(populate_from="botLabel")

    botAvatar = models.TextField(default="")

    def __str__(self):
        return f"{self.botLabel}: {self.botTag}"


class CacheMetricsItem(models.Model):
    recordTag = models.UUIDField(primary_key=True, default=uuid4, editable=False)

    programUsage = models.IntegerField(default=0)

    ttUsage = models.IntegerField(default=0)
