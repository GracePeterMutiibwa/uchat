import json

import os


class WidgetManager:
    jsPath = os.path.join(os.path.dirname(__file__), "feed", "chat.js")

    def getChatJs(self):
        with open(self.jsPath, "r") as jsHandle:
            jsContent = jsHandle.read()

        return jsContent

    def generateJsCode(self, widgetConfig):
        # get the js
        necessaryJs = self.getChatJs()

        formattedConfig = json.dumps(widgetConfig)

        botJs = """
        (function(w, d) {
            w.$uchat = w.$uchat || {};

            w.$uchat.config = %s;

            %s
            
            if (d.readyState === 'complete') {
                // necessary css and icons
                loadUChat();

            } else {
                w.addEventListener('load', loadUChat);
            }
        })(window, document);
        """ % (
            formattedConfig,
            necessaryJs,
        )

        return botJs
