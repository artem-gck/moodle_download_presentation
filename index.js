(() => {
    window.require = null;
    window.define = null;

    const filename = document.querySelector("h1")?.innerText?.trim() || "безымянный.pdf";

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.4.0/jspdf.umd.min.js";
    script.async = false;
    document.head.appendChild(script);

    script.onload = (async () => {
        const htmlText = await downloadHtml();

        const _document = document.createElement("div");
        console.log(htmlText);
        _document.innerHTML = htmlText;

        let slides = [..._document.querySelectorAll("slide")];

        const doc = new jspdf.jsPDF();
        doc.deletePage(1);

        if (slides.length == 0) {
            slides = [..._document.querySelectorAll(".lightbox-gallery-image-thumbnail")];
            let images = slides.map($slide => $slide.getAttribute("href"));
            let imageSizes = await Promise.all(images.map(getImageFromHrefDimensions));

            slides
                .map($slide => $slide.getAttribute("href"))
                .forEach((link, i) => {
                    const {img, w, h} = imageSizes[i];
                    const pageW = 480;
                    const pageH = 480 * h / w;
                    doc.addPage([pageW, pageH], "l")
                    doc.addImage(img, null, 0, 0, pageW, pageH);
                }, doc);
            doc.output('save', filename + '.pdf');
        }
        else {
            let images = slides.map($slide => $slide.getAttribute("data"));
            let imageSizes = await Promise.all(images.map(getImageDimensions));

            slides
                .map($slide => $slide.getAttribute("data"))
                .forEach((base64img, i) => {
                    const {w, h} = imageSizes[i];
                    const pageW = 480;
                    const pageH = 480 * h / w;
                    doc.addPage([pageW, pageH], "l")
                    doc.addImage(base64img, null, 0, 0, pageW, pageH);
                }, doc);
            doc.output('save', filename + '.pdf');
        }
    });

    function getImageDimensions(base64) {
        return new Promise(function (resolve, rejected) {
            const img = document.createElement("img");
            img.src = "data:img/png;base64," + base64;
            img.onload = function () {
                resolve({w: img.width, h: img.height})
            };
        })
    }

    function getImageFromHrefDimensions(link) {
        return new Promise(function (resolve, rejected) {
            const img = document.createElement("img");
            img.src = link;
            img.onload = function () {
                resolve({img: img, w: img.width, h: img.height})
            };
        })
    }

    async function downloadHtml() {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            document.body.className = "";
            document.body.id = "";
            document.body.innerHTML = `
            <progress id="indicator" style="width: 50%;"></progress>
            <h1>Скачиваем ${filename}</h1>
            <div id="progress">Скачано: 0 Bytes</div>
            `;
            const $progress = document.querySelector("#progress");
            const $indicator = document.querySelector("#indicator");

            xhr.onloadend = () => {
                $indicator.value = "100";
                $indicator.max = "100";
                resolve(xhr.response);
            }
            xhr.onprogress = e => {
                $progress.innerText = "Скачано " + formatBytes(e.loaded);
            }
            xhr.open("GET", window.location.href, true);
            xhr.send();
        });
    }

    function formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes'

        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

        const i = Math.floor(Math.log(bytes) / Math.log(k))

        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
    }
})();
