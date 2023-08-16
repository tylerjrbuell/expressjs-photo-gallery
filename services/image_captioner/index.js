
const getImageCaption = async (path) => {
    const  {pipeline} = await import('@xenova/transformers');
    const captioner= await pipeline("image-to-text", "Xenova/vit-gpt2-image-captioning")
    try {
        const caption = await captioner(path)
        if(!caption.length) throw new Error("No caption found")
        const { generated_text } = caption[0]
        return generated_text
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    getImageCaption
}

