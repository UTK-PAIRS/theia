// document elements
var model       = null;
var canvas      = null;
var predict     = null;
var f_sel       = null;
var out         = null;
var mod_options = null;

// eligible models
var models      = {};
// selected models
var smod        = {};

// should work in jquery -- doesn't when testing locally?
// https://stackoverflow.com/questions/16839698/jquery-getscript-alternative-in-native-javascript
function getScript(source) {
    let script = document.createElement('script');
    let prior = document.getElementsByTagName('script')[0];
    script.async = 1;

    script.src = source;
    prior.parentNode.insertBefore(script, prior);

    return script;
}

function update_tbutton() {
    for (const e in smod) {
        if (smod[e] == true) {
            $('#predict').attr('disabled', false);
            $('#predict').text('Transcribe');
            return;
        }
    }
    $('#predict').attr('disabled', true);
    $('#predict').text('Select Model');
}

// load all models in MODEL_DIRS
async function load_models() {
    const load_model = async model => {
        return new Promise (resolve => {
                getScript(`js/${model}/model.js`).onload = () => {
                    try {
                        models[model] = {"exc": eval(`${model}_exc`)};
                        add_model(model);
                        smod[model] = 0;
                        console.log(`${model} loaded`);
                        resolve(0);
                    } catch (ReferenceError) {
                        console.log(`${model} does not have an exc function! -- not loaded`);
                        resolve(-1);
                        return;
                    }
                };
            }
        )
    }
    
    return Promise.all(MODEL_DIRS.map(load_model));
}

function add_model(name, elm=mod_options) {
    elm.append(`
    <div class="p-2">
        <label class="m_txt"><input class="m_sel" id="${name}_sel" type="checkbox" value="${name}"> ${name}</label>
    </div>
    `);
    models[name]["elm"] = $(`#${name}_sel`);
}

function main() {
    // initialize element variables
    canvas      = $("#display");
    predict     = $("#predict");
    f_sel       = $("#file-selector");
    out         = $("#out");
    mod_options = $('#model_options');

    // disable UI
    $('#predict').attr('disabled', true);
    $('#predict').text('Loading models...');

    // load all models and then add in selection menu
    load_models().then(() => {
        console.log("models loaded");

        $(".m_sel").change(async () => {
            await tf.ready();
            await Promise.all($('.m_sel').map(elm => {
                return new Promise(
                    resolve => {
                        let e = $('.m_sel')[elm];
                        smod[e.value] = e.checked;
                        resolve(0);
                    }
                )
            }))
            update_tbutton();
        });

        $('#predict').text('Upload image');
    });



    f_sel.change( async () => {
        await tf.ready();
        update_tbutton();
    });



    predict.click( () => {
        // disable button
        $('#predict').attr('disabled', true);
        $('#predict').text('Loading ...');

        // get file
        url = URL.createObjectURL(f_sel.prop('files')[0]);
        getImageFromURL(url).then((res) => {
            canvas[0].getContext('2d').drawImage(res, 0, 0, width=70, height=70);

            let tensor = -1;
            try {
                tensor = tf.browser.fromPixels(res).reshape([1, 70, 70, 3]);
            } catch (e) {
                $('#predict').text('Image must be 70x70!');
                return;
            }

            $('#results-container').show();
            Promise.all($('.m_sel').map(
                async elm => {
                    let e = $('.m_sel')[elm];

                    if (e.checked) {
                        console.log(`getting results for ${e.value}`);
                        let r = undefined;
                        try {
                            const t = await tensor;
                            r = Array.from(await eval(`${e.value}_exc(res, t)`));
                        } catch (e) {
                            console.error(e);
                            return undefined;
                        }
                        r.unshift(e.value)
                        return r;
                    }
                }
            )).then(ret => {
                    genResultTable(ret.filter(x => {
                        return x !== undefined;
                    }));
                    $('#predict').text('Done!');
                }
            );
        });
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

function genResultTable(arr) {
    $('#table-results-1')[0].innerHTML = "";
    const genArr = e => {
        let best_val = 0.0;
        let best_char = "N/A";
        let r = [];

        r.push(e[0]);
        for (let i = 1; i < e.length; i++) {
            if (e[i] > best_val) {
                best_char = CHAR_CLASS[i - 1];
                best_val = e[i];
            } else if (best_val != 0.0 && e[i] == best_val) {
                best_char += ", " + CHAR_CLASS[i - 1];
            }
            r.push(`${PERCENT(e[i])}%\n`);
        }
        r.push(best_char);

        return r;
    }

    Promise.all(arr.map(genArr)).then(
        r => {
            $("#table-results-1-head")[0].innerHTML = "";
            let s = '<tr><th></th>';
            for (let i = 0; i < arr.length; i++) {
                s += `<th>${r[i][0]}</th>`;
            }
            $("#table-results-1-head").append(s + "</tr>");

            for (let i = 1; i < r[0].length; i++) {
                let s = `<tr><th scope="row">${ROW_HEADER[i - 1]}</th>`;
                for (let j = 0; j < arr.length; j++) {
                    s += `<td>${r[j][i]}</td>`;
                }
                $('#table-results-1').append(s + '</tr>');
            }
        }
    );
}
