// Simple image downloader for Hot Wheels Velocity
// Usage: node download-images.js

const https = require('https');
const fs = require('fs');
const path = require('path');

// Create images directory if it doesn't exist
const imagesDir = path.join(__dirname, 'HOT_WHEELS_IMAGES');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir);
}

// Hot Wheels themed royalty-free images
const imageUrls = [
    'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop',
    'https://images.pexels.com/photos/35619/capri-ford-oldtimer-automotive.jpg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/919073/pexels-photo-919073.jpeg?auto=compress&cs=tinysrgb&w=800'
];

function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(path.join(imagesDir, filename));

        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
                return;
            }

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                console.log(`✅ Downloaded: ${filename}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(path.join(imagesDir, filename), () => {}); // Delete the file on error
            reject(err);
        });
    });
}

async function downloadAllImages() {
    console.log('🚗 Starting Hot Wheels image downloads...\n');

    for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        const extension = url.includes('.jpg') ? '.jpg' : '.jpeg';
        const filename = `hot-wheels-${i + 1}${extension}`;

        try {
            await downloadImage(url, filename);
        } catch (error) {
            console.log(`❌ Failed to download ${filename}: ${error.message}`);
        }
    }

    console.log('\n🎉 Download complete! Images saved to HOT_WHEELS_IMAGES folder');
    console.log('📝 Remember: Always credit the original sources when using these images');
}

// Alternative: Download specific high-quality Hot Wheels images
const premiumImageUrls = [
    'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?q=80&w=1200&h=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1200&h=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200&h=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&h=800&auto=format&fit=crop'
];

async function downloadPremiumImages() {
    console.log('🏎️ Downloading premium Hot Wheels images...\n');

    for (let i = 0; i < premiumImageUrls.length; i++) {
        const url = premiumImageUrls[i];
        const filename = `premium-hot-wheels-${i + 1}.jpg`;

        try {
            await downloadImage(url, filename);
        } catch (error) {
            console.log(`❌ Failed to download ${filename}: ${error.message}`);
        }
    }
}

// Run the download
if (process.argv[2] === 'premium') {
    downloadPremiumImages();
} else {
    downloadAllImages();
}
