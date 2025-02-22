from ninja import Schema

from ninja import Router

from pprint import pprint

from .ucTools import SaveTools, FetchTools, BotUtils

from typing import List

from .cohereBackend import CohereRagAPi

from pydantic import BaseModel


class ProgramItemSchema(Schema):
    programs: list


class TTItemSchema(Schema):
    meta: dict


class AiResponseSchema(Schema):
    message: str


class ChatMessageSchema(BaseModel):
    role: str
    content: str
    stamp: str


uchat_router = Router()


@uchat_router.post(
    "/chat/{botTag}", include_in_schema=True, auth=None, response=AiResponseSchema
)
@uchat_router.post(
    "/chat/{botTag}/", include_in_schema=True, auth=None, response=AiResponseSchema
)
def updateProgramItems(request, botTag: str, chatEntries: List[ChatMessageSchema]):
    # get
    messageQueue = [
        {"role": eachMessage.role, "content": eachMessage.content}
        for eachMessage in chatEntries
    ]

    # print(messageQueue)

    apiKeyMeta = FetchTools().getApiItem()

    if apiKeyMeta.hasApiKey():
        # get the system prompt and data
        foundPrompt, foundData = BotUtils().processBotSources(botTag=botTag)

        # get response
        responseMessage = CohereRagAPi(apiKey=apiKeyMeta.inferenceApiKey).cohereReason(
            messageQueue=messageQueue, systemPrompt=foundPrompt, documents=foundData
        )

    else:
        responseMessage = "Oops, consult provider for assistance"

    return {"message": responseMessage}


@uchat_router.post("/cache-timetable", include_in_schema=True)
@uchat_router.post("/cache-timetable/", include_in_schema=True)
def updateProgramItems(request, timeTableData: TTItemSchema):
    # get
    ttRecord = timeTableData.dict().get("meta", None)

    if ttRecord is None:
        return {"message": "Invalid query"}

    # pprint(ttRecord)

    SaveTools().saveTimeTableItems(timeTableMeta=ttRecord)

    # print(">", "saved tt")

    return {"message": "received"}


@uchat_router.post("/cache-programs", include_in_schema=True)
@uchat_router.post("/cache-programs/", include_in_schema=True)
def updateProgramItems(request, programData: ProgramItemSchema):
    # get
    programsRecords = programData.dict().get("programs", None)

    if programsRecords is None:
        return {"message": "Invalid query"}

    # write new changes
    SaveTools().saveProgramItems(programRecords=programsRecords)

    # print("all is well")

    return {"message": "received"}
