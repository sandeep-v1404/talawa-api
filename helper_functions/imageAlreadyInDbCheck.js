
const ImageHash = require("../models/ImageHash")
const { imageHash } = require('image-hash');
const deleteImage = require("./deleteImage");
const User = require("../models/User");
const Hash = require("../Hash");

let hashObj = new Hash();


// Check to see if image already exists in db using hash
// if its there point to that image and remove the image just uploaded
// if its not there allow the file to remain uploaded
module.exports = function imageAlreadyInDbCheck(image, item) {
    let fileName;
    return new Promise((resolve, reject)=>{
        imageHash(`./${image}`, 16, true, async (error, data) => {
            if (error)
                throw error;
            hash = data;
    
            // Finds an entry with the same hash
            const imageAlreadyExistsInDb = await ImageHash.findOne({
                hashValue: hash
            });
    
            if (imageAlreadyExistsInDb) {
                console.log("Image already exists in db");
    
                // remove the image that was just uploaded
                deleteImage(image);

                fileName = imageAlreadyExistsInDb._doc.fileName; // will include have file already in db if pic is already saved will be null otherwise
            }
            else {
                if (item.image) { // If user already has a profile picture delete it from the API
                    deleteImage(item.image);
                }
    
                const hashObj = new ImageHash({
                    hashValue: hash,
                    fileName: image
                });
                await hashObj.save();
            }


            resolve();
        })
    }).then(()=>{
        console.log(fileName)
        return fileName;
    });


}

