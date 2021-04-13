async function cnn_exc(img) {
    let model = await tf.loadLayersModel('js/cnn/model.json');

    let tensor = await tf.browser.fromPixels(img).reshape([1, 70, 70, 3]);
    let res = model.predict(tensor);

    return new Promise (
        resolve => {res.data().then(ret => {resolve(ret);});}
    );
}
