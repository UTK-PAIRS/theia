const worker = Tesseract.createWorker({
    logger: m => {},
});

(async () => {
    await worker.load();
    await worker.loadLanguage('grc');
    await worker.initialize('grc');
    await worker.setParameters({
        tessedit_char_whitelist: WHITELIST,
        tessedit_pageseg_mode: Tesseract.PSM_SINGLE_CHAR,
    });
})();

const tesseract_conv_res = res => {
    let out = new Array(CHAR_CLASS.length).fill(0);
    for (const c in [...res]) {
        out[CHAR_TO_NUM[CHAR_TO_NAME[res[c]]]] += 1;
    }
    return out;
}

async function tesseract_exc(img) {
    return new Promise (
        async resolve => {
            const { data: { text } } = await worker.recognize(
                img,
            );
            resolve(tesseract_conv_res(text));
        }
    );
}
