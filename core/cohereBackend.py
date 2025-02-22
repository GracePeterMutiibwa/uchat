import cohere


class CohereRagAPi:
    def __init__(self, apiKey: str):
        self.cohereInstance = cohere.ClientV2(apiKey)

    def cohereReason(self, messageQueue: list, systemPrompt: str, documents: list = []):
        # get response
        responseObject = self.cohereInstance.chat(
            model="command-r-plus",
            messages=[systemPrompt] + messageQueue,
            documents=[{"data": documents}],
        )

        return responseObject.message.content[0].text
