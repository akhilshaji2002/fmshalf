const tf = require('@tensorflow/tfjs');
const mobilenet = require('@tensorflow-models/mobilenet');
const jpeg = require('jpeg-js');
const fs = require('fs');

function readImage(path) {
    const buffer = fs.readFileSync(path);
    const pixels = jpeg.decode(buffer, true);
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
        await tf.setBackend('cpu');
        await tf.ready();
        console.log("Loading MobileNet on CPU...");
        const model = await mobilenet.load({version: 2, alpha: 0.5});
        
        console.log("Testing Pizza:");
        let tensor = readImage("tf_pizza.jpg");
        let preds = await model.classify(tensor);
        console.log("Pizza:", preds);
        tensor.dispose();

        console.log("Testing Person:");
        tensor = readImage("tf_person.jpg");
        preds = await model.classify(tensor);
        console.log("Person:", preds);
        tensor.dispose();
    } catch(e) {
        console.error("ERROR:", e);
    }
}
run();
