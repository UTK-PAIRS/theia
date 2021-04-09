var model   = null;
var canvas  = null;
var predict = null;
var f_sel   = null;
var out     = null;

const PERCENT = x => Math.round(x * 100000, 6) / 1000;

const char_class = [
    "Alpha",
    "Beta",
    "Chi",
    "Delta",
    "Epsilon",
    "Eta",
    "Gamma",
    "Iota",
    "Kappa",
    "Lambda",
    "Mu" ,
    "Nu" ,
    "Omega" ,
    "Omicron" ,
    "Phi" ,
    "Pi" ,
    "Psi" ,
    "Rho" ,
    "Sigma" ,
    "Tau" ,
    "Theta" ,
    "Upsilon" ,
    "Xi",
    "Zeta",
]

function main() {
    console.log("in main");
    canvas  = $("#display");
    predict = $("#predict");
    f_sel   = $("#file-selector");
    out     = $("#out");
    
    let load = async () => {
        await tf.ready();
        console.log("backend:", tf.getBackend());
        model = await tf.loadLayersModel('js/js_model/model.json');
        console.log(model);
    }
    load();

    predict.click( () => {
        url = URL.createObjectURL(f_sel.prop('files')[0]);
        getImageFromURL(url).then((res) => {
            console.log(res);
            canvas[0].getContext('2d').drawImage(res, 0, 0, width=512, height=512);
            classify(res);
        })
    });
}

async function getImageFromURL(src) {
    return new Promise((resolve, reject) => {
        var img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src
    })
}

async function classify(img) {
    let tensor = await tf.browser.fromPixels(img).reshape([1, 70, 70, 3]);
    let res = model.predict(tensor);

    res.data().then(data => out.text(arrToChars(data)))
}

function arrToChars(arr) {
    let s = ""

    let best_val = -1;
    let best_char = "N/A";
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] > best_val) {
            best_char = char_class[i];
            best_val = arr[i];
        }
        s += `${char_class[i]}: ${PERCENT(arr[i])}%\n`;
    }
    s += `Best guess: ${best_char} @ ${PERCENT(best_val)}%`;

    return s;
}