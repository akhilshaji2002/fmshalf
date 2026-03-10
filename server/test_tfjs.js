const tf = require('@tensorflow/tfjs');
const mobilenet = require('@tensorflow-models/mobilenet');
const jpeg = require('jpeg-js');
const fs = require('fs');

async function download(url, filename) {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(filename, Buffer.from(buffer));
}

function readImage(path) {
    const buffer = fs.readFileSync(path);
    const pixels = jpeg.decode(buffer, true); // {width, height, data: Uint8Array}
    const numChannels = 3;
    const numPixels = pixels.width * pixels.height;
    const values = new Int32Array(numPixels * numChannels);

    for (let i = 0; i < numPixels; i++) {
        for (let channel = 0; channel < numChannels; ++channel) {
            values[i * numChannels + channel] = pixels.data[i * 4 + channel];
        }
    }

    return tf.tensor3d(values, [pixels.height, pixels.width, numChannels], 'int32');
}

async function run() {
    try {
        console.log("Downloading images...");
        await download("https://upload.wikimedia.org/wikipedia/commons/a/a3/Eq_it-na_pizza-margherita_sep2005_sml.jpg", "tf_pizza.jpg");
        await download("https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/George_Clooney_2023.jpg/800px-George_Clooney_2023.jpg", "tf_person.jpg");

        console.log("Loading MobileNet...");
        const model = await mobilenet.load({version: 2, alpha: 0.5}); // smaller version for speed

        console.log("\nTesting Pizza:");
        const pizzaTensor = readImage("tf_pizza.jpg");
        const pizzaPreds = await model.classify(pizzaTensor);
        console.log(pizzaPreds);
        pizzaTensor.dispose();

        console.log("\nTesting Person:");
        const personTensor = readImage("tf_person.jpg");
        const personPreds = await model.classify(personTensor);
        console.log(personPreds);
        personTensor.dispose();

    } catch(e) {
        console.error(e);
    }
}
run();
