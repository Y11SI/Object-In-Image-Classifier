document.addEventListener('DOMContentLoaded', () => {
    const data = JSON.parse(localStorage.getItem('classificationResults'));
    if (data && data.classifications) {
        const resultsContainer = document.getElementById('output-container');
        resultsContainer.innerHTML = '';

        data.classifications.forEach(classification => { //To display result of image classification
            const imageUrl = classification.imageUrl;
            const objects = classification.objects;

            const img = new Image();
            img.onload = function() { //Recreate image in size that fits in webpage
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
                canvas.classList.add('result-image');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height); //draw image onto canvas

                objects.forEach(obj => { //draw box around object and label it
                    const vertices = obj.boundingPoly.normalizedVertices; //get corners of bounding box
                    ctx.beginPath();
                    ctx.lineWidth = 4; // Make bounding box thick
                    ctx.strokeStyle = 'yellow'; // Change bounding box color to yellow for visibility
                    vertices.forEach((v, index) => { //draw box onto image
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
                    //write name of object and confidence value
                });

                resultsContainer.appendChild(canvas); //ready to display new image
            };
            img.src = imageUrl;
        });
    }
    localStorage.removeItem('classificationResults');
});
