class Toast {
    constructor(toastMessage, toastBg) {
        this.toastMessage = toastMessage || "No message provided";

        this.bgList = ["success", "primary", "danger"];

        (toastBg || (toastBg = this.bgList[0])) && (() => {
            if (!this.bgList.includes(toastBg)) {
                toastBg = this.bgList[0];
            }

            // load bg
            this.toastBg = toastBg;
        })();

        this.displayToast();
    }

    displayToast() {
        const newToast = document.createElement("div");

        newToast.classList.add("uc-toast");

        newToast.classList.add(this.toastBg);

        newToast.innerHTML = this.toastMessage;

        document.querySelector("body").appendChild(newToast);

        setTimeout(() => {
            newToast.remove();
        }, 3000);
    }
}



