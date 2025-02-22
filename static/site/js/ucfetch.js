class UcFetch {
    constructor() {
        this.conf = {
            "program": {
                "root": "https://timetable.must.ac.ug",
                "url": "https://www.must.ac.ug/undergraduate-programmes/",
                "formatter": "must-program",
            },
            "timetable": {
                "root": "https://timetable.must.ac.ug",
                "url": "https://timetable.must.ac.ug/index_teaching.html",
                "formatter": "must-tt",
                "status": "---"
            }
        }

        this.configMap = {
            "program": 1,
            "timetable": 2,
            "page": 3
        }

    }

    // find the scrap url
    getScrapUrl() {
        let ucMetaHolder = document.getElementById('ucfetch-meta-input')

        // console.log('Holder:', ucMetaHolder);

        let ucUrl = ucMetaHolder.getAttribute("data-uc-root");

        let ucScrapKey = ucMetaHolder.getAttribute("data-scrap-key");

        const completeUrl = `${ucUrl}api/scrap/${ucScrapKey}/`;

        return completeUrl;
    }

    execute(configurationString, sCallBack, eCallBack, urlToUse) {
        // determine the appropriate configuration
        let postConfig;

        if (configurationString === "page") {
            postConfig = {
                "root": "https://www.google.com/",
                "url": urlToUse,
                "formatter": "as-text"

            };
        } else {
            // determine
            postConfig = this.conf[configurationString];

            if (configurationString === "timetable" && urlToUse !== null) {
                // update the post config : status with whatever the url is
                // i.e. #table_207
                postConfig["status"] = urlToUse;
            }
        }

        // make the requests
        axios.post(
            this.getScrapUrl(),
            postConfig
        ).then(response => {
            sCallBack(response.data.message, this.configMap[configurationString]);
        })
            .catch(anyError => {
                eCallBack(anyError);
            });
    }
}