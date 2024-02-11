document.getElementById('upload-form').addEventListener('submit', function(e) {
    e.preventDefault();

    var formData = new FormData();
    var imageFiles = document.getElementById('image-input').files;
    for (var i = 0; i < imageFiles.length; i++) {
        formData.append('images', imageFiles[i]);
    }

    fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData
    })  
    .then(response => response.json())
    .then(data => {
        console.log(data);
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = '';

        data.classifications.forEach(classification => {
            const imageUrl = classification.imageUrl;
            const objects = classification.objects;

            const img = new Image();
            img.onload = function() {
                const maxWidth = 800; // Max width for the image
                const maxHeight = 600; // Max height for the image
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                objects.forEach(obj => {
                    const vertices = obj.boundingPoly.normalizedVertices;
                    ctx.beginPath();
                    ctx.lineWidth = 4; // Make bounding box thicker
                    ctx.strokeStyle = 'yellow'; // Change bounding box color to yellow for visibility
                    vertices.forEach((v, index) => {
                        const x = v.x * width;
                        const y = v.y * height;
                        if (index === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    });
                    ctx.closePath();
                    ctx.stroke();
                    ctx.fillStyle = 'blue'; // Change text color to blue
                    ctx.font = 'bold 18px Arial'; // Increase text sizes
                    ctx.fillText(`${obj.name}: ${obj.confidence}%`, vertices[0].x * width, vertices[0].y * height - 10);
                });

                resultsContainer.appendChild(canvas);
            };
            img.src = imageUrl;
        });
    })
    .catch(error => {
        console.error(error);
    });
});