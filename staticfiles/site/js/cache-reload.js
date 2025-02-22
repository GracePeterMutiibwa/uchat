// for programs
// {
//     "Programme Name": "Bachelor of Medicine and Bachelor of Surgery",
//     "Code": "MBR",
//     "Duration": "5 Years",
//     "Study Time": "Fulltime",
//     "Program Link": "https://www.must.ac.ug/programme/bachelor-of-medicine-and-bachelor-of-surgery/"
// }

// partly for time table handshake
// {
//     "batch": "FORTH YEAR",
//     "group": "MLS IV:",
//     "program": "MLS IV",
//     "node": "#table_193"
// }
document.addEventListener('DOMContentLoaded', () => {
    class UcApi {
        getCsrfToken = () => {
            let tokenHolder = document.getElementById('update-password-form').querySelector('input[name="csrfmiddlewaretoken"]');

            return tokenHolder.value;
        }

        accessEndPoint(apiUrl, dataItems, sCallBack, eCallBack) {
            axios.post(
                apiUrl,
                dataItems, {
                headers: {
                    "X-CSRFToken": this.getCsrfToken()
                }
            }
            ).then(response => {
                sCallBack(response.data);
            })
                .catch(anyError => {
                    eCallBack(anyError);
                });
        }
    }

    document.querySelectorAll('.url-trigger').forEach(eachPageReloader => {
        eachPageReloader.addEventListener('click', (e) => {
            // network
            if (!navigator.onLine) {
                return;
            }

            // get meta
            let urlContainer = document.querySelector(eachPageReloader.getAttribute('data-url-source'));

            let pageReceiver = document.querySelector(eachPageReloader.getAttribute('data-load-area'));

            // everything checks out
            if (urlContainer && urlContainer.value.trim().length > 0 && pageReceiver) {
                // url
                const urlForPage = urlContainer.value.trim();

                let fetchingStall = new Stall("Processing page...").show();

                new UcFetch().execute(
                    "page",
                    (pageData, cacheTag) => {
                        pageReceiver.value = pageData;

                        fetchingStall.hide();

                        new Toast("Page data was retrieved");
                    },
                    (error) => {
                        new Toast(error, "danger");
                    },
                    urlForPage
                );

            } else {
                new Toast("No URL was found..", "danger");
            }
        })
    });

    function reloadPage() {
        setTimeout(() => {
            window.location.reload();
        }, 4000)
    }

    async function processTimetableData(cacheData) {
        try {
            // {
            //     "batch": "YEAR I",
            //     "group": "MBR 1:",
            //     "program": "MBR 1",
            //     "node": "#table_3"
            // }

            // for time table data

            // console.log(cacheData);

            // all of them
            let presentPrograms = cacheData.slice();

            // compute percentage
            const percentPerItem = 100 / presentPrograms.length;

            const progressModal = new Stall("Writing data...", "progress").show();



            await Promise.all(presentPrograms.map(async (ttProgramInfo, _index) => {
                const _progress = Math.round((_index + 1) * percentPerItem);

                // get the node
                let timeTableNode = ttProgramInfo['node'];

                await new UcFetch().execute(
                    "timetable",
                    (timeTableData, e) => {
                        // extract relevant
                        const { batch, group, program } = ttProgramInfo;

                        // format
                        const timeTableMeta = { batch, group, program, timetable: timeTableData }

                        // console.log(timeTableMeta);

                        new UcApi().accessEndPoint(
                            "/api/cache-timetable/",
                            {
                                meta: timeTableMeta
                            },
                            (e) => { progressModal.updateProgress(_progress); },
                            (e) => {
                                new Toast(e, "danger")
                            }
                        )
                    },
                    (e) => { new Toast(e, "danger") },
                    timeTableNode
                )

                if (_index === presentPrograms.length - 1) {
                    // console.log(ttProgramInfo);

                    progressModal.hide();

                    new Toast("Timetable data was updated, page will reload shortly");

                    reloadPage();
                }
            }));

        } catch (error) {
            console.error('Error processing timetable:', error);

            new Toast("Failed to update timetable data", "danger");
        }
    }



    document.querySelectorAll('.cache-reload').forEach(eachCacheReloader => {
        eachCacheReloader.addEventListener('click', (clickEvent) => {
            clickEvent.preventDefault();

            // get the data
            let cacheConfiguration = eachCacheReloader.getAttribute('data-cache-tag');

            if (navigator.onLine) {
                let cacheStall = new Stall("Fetching data...").show();

                // make the reload
                new UcFetch().execute(
                    cacheConfiguration,
                    async (cacheData, cacheTag) => {
                        if (!navigator.onLine) {
                            return
                        }

                        cacheStall.hide();

                        if (cacheTag === 1) {
                            if (cacheData.length > 0) {
                                const programStall = new Stall("Writing data...").show()

                                new UcApi().accessEndPoint(
                                    "/api/cache-programs/",
                                    {
                                        programs: cacheData
                                    },
                                    (e) => {
                                        programStall.hide();

                                        new Toast("Programs were updated, page will reload shortly")

                                        reloadPage();
                                    },
                                    (e) => {
                                        new Toast(e, "danger")
                                    }
                                )
                            }

                        } else {
                            if (cacheData.length > 0) {
                                // process the time table
                                processTimetableData(cacheData);
                            }

                        }

                    },
                    (error) => {
                        new Toast(error);
                    },
                    null
                );
            }
        });
    })
});