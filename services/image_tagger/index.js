const getImageTags = async (path) => {
    const  {pipeline} = await import('@xenova/transformers');
    try {     
        //get tag data from the classification
        let classifier = await pipeline("image-classification", "Xenova/vit-base-patch16-224") //image classifying pipeling Xenova/vit-base-patch16-224
        const classifiedTags = await classifier(path);
        //get tag data from the object detection
        let objectDetector = await pipeline("object-detection", "Xenova/detr-resnet-101")
        const objectTags = await objectDetector("C:\\Users\\TylerBuell\\Pictures\\Spark Pics\\Thug_Life_Jatin.png")
        //combine the tags
        return [...classifiedTags, ...objectTags]
    } catch (error) {
        console.error(error);
        return []
    }

}

module.exports = {
    getImageTags
}