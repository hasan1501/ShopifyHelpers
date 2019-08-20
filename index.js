const axios = require('axios');
const fs = require('fs');
const url = require('url');
const Jimp = require('jimp');

class Shopify {

    constructor({apiKey, password, storeUrl, version}) {
        this.apiKey = apiKey;
        this.password = password;
        this.storeUrl = storeUrl;
        this.version = version;
    }

    getShopifyUrl() {
        return `https://${this.apiKey}:${this.password}@${this.storeUrl}/admin/api/${this.version}`;
    }

    async getNumberOfProducts() {
        let count = await axios.get(`${this.getShopifyUrl()}/products/count.json`);

        return count.data.count;
    }

    async getAllProducts() {
        let allProducts = [];
        let numberOfProducts = await this.getNumberOfProducts();
        let numberOfTimesToRun = parseInt(numberOfProducts / 250) + 1;
        let nextPage = '';
        for (let i = 0; i < numberOfTimesToRun; i++) {
            let productsFromWebsite = await axios.get(`${this.getShopifyUrl()}/products.json?limit=250${nextPage}`);

            let page_info = productsFromWebsite
                .headers
                .link
                .split(" ")[0];
            let q = url.parse(page_info, true);
            nextPage = `&page_info=${q.query.page_info}`;

            for (const product of productsFromWebsite.data.products) {
                allProducts.push(product);
            }
        }
        return allProducts;
    }

    async getProductInfo(productId) {
        let product = await axios.get(`${this.getShopifyUrl()}/products/${productId}.json`);

        return product.data.product;
    }

    async updateProduct(productId, options) {

        options.id = productId;

        try {
            let updated_product = await axios.put(`${this.getShopifyUrl()}/products/${productId}.json`, {product: options});

            if (updated_product.status === 200) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.log('Error in updating product', error);
            return false;
        }
    }

    async updateVariant(variantId, options) {
        options.id = variantId;

        try {
            let updated_variant = await axios.put(`${this.getShopifyUrl()}/variants/${variantId}.json`, {variant: options});

            if (updated_variant.status === 200) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.log('Error in updating variant', error);
            return false;
        }
    }

    async deleteVariant(productId, variantId) {
        try {
            let deleted_variant = await axios.delete(`${this.getShopifyUrl()}/products/${productId}/variants/${variantId}.json`);
            if (deleted_variant.status === 200) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.log('Error in deleting variant', error);
            return false;
        }
    }

    static async optimizeImages(folderPath, width = Jimp.AUTO, height = Jimp.AUTO) {
        let allFiles = fs.readdirSync(folderPath);

        for (const file of allFiles) {
            console.log(`Checking file : ${file}`);
            if (file !== '.DS_Store') {
                let changed_image = await Jimp
                    .read(`${folderPath}/${file}`)
                    .then((new_image) => {
                        return new_image
                            .resize(width, height)
                            .write(`./updatedImages/${file}`);
                    })
                console.log(`Image Optimization finished for ${file} : ${changed_image.bitmap.width} x ${changed_image.bitmap.height}`);
            }
        }
    }
}

module.exports = Shopify;