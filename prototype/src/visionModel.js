let modelPromise;

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("无法读取识别图片"));
    image.src = source;
  });
}

async function loadModel() {
  if (!modelPromise) {
    modelPromise = Promise.all([
      import("@tensorflow/tfjs"),
    ]).then(async ([tf]) => {
      await tf.ready();
      const modelUrl = `${import.meta.env.BASE_URL}models/mobilenet-v1/model.json`;
      const classificationModel = await tf.loadLayersModel(modelUrl);
      const featureModel = tf.model({
        inputs: classificationModel.inputs,
        outputs: classificationModel.getLayer("global_average_pooling2d_1").output,
      });
      return { tf, featureModel };
    });
  }
  return modelPromise;
}

export async function extractVisionEmbedding(source) {
  const [{ tf, featureModel }, image] = await Promise.all([loadModel(), loadImage(source)]);
  const tensor = tf.tidy(() => {
    const pixels = tf.browser.fromPixels(image);
    const resized = tf.image.resizeBilinear(pixels, [224, 224], true);
    const normalized = resized.toFloat().div(127.5).sub(1);
    return featureModel.predict(normalized.expandDims(0));
  });
  try {
    const values = await tensor.data();
    return Array.from(values, (value) => Number(value.toFixed(6)));
  } finally {
    tensor.dispose();
  }
}

export function cosineSimilarity(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return -1;
  let dot = 0;
  let leftLength = 0;
  let rightLength = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftLength += left[index] ** 2;
    rightLength += right[index] ** 2;
  }
  if (!leftLength || !rightLength) return -1;
  return dot / Math.sqrt(leftLength * rightLength);
}

export function similarityToScore(similarity) {
  if (!Number.isFinite(similarity)) return 0;
  return Math.round(Math.max(0, Math.min(99, ((similarity - 0.35) / 0.6) * 100)));
}
