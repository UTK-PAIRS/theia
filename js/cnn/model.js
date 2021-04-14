async function cnn_exc(img, tensor=undefined) {
    if (tensor == -1) throw new Error("Must be 70x70!");
    if (tensor === undefined) {
        tensor = await tf.browser.fromPixels(img).reshape([1, 70, 70, 3]);
    }

    let model = await tf.loadLayersModel('js/cnn/model.json');

    let res = model.predict(tensor);

    return new Promise (
        resolve => {res.data().then(ret => {resolve(ret);});}
    );
}
