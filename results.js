document.addEventListener('DOMContentLoaded', () => {
    const data = JSON.parse(localStorage.getItem('classificationResults'));
    if (data && data.classifications) {
        const resultsContainer = document.getElementById('output-container');
        resultsContainer.innerHTML = '';
        
        // Create an element to display latency
        const latencyInfo = document.createElement('p');
        latencyInfo.textContent = `Your image was processed in: ${(data.latency / 1000).toFixed(3)} seconds.`;
        resultsContainer.appendChild(latencyInfo);

        // Create carousel container
        const carouselContainer = document.createElement('div');
        carouselContainer.id = 'classificationCarousel';
        carouselContainer.classList.add('carousel', 'slide');
        carouselContainer.setAttribute('data-bs-ride', 'carousel');

        // Create carousel inner container
        const carouselInner = document.createElement('div');
        carouselInner.classList.add('carousel-inner');
        carouselContainer.appendChild(carouselInner);

        // Create indicators if there's more than one image
        if (data.classifications.length > 1) {
            const indicators = document.createElement('ol');
            indicators.classList.add('carousel-indicators');
            data.classifications.forEach((classification, index) => {
                const indicator = document.createElement('li');
                indicator.setAttribute('data-bs-target', '#classificationCarousel');
                indicator.setAttribute('data-bs-slide-to', index);
                if (index === 0) indicator.classList.add('active');
                indicators.appendChild(indicator);
            });
            carouselContainer.appendChild(indicators);
        }

        for (let i = 0; i < data.classifications.length; i++) {
            const classification = data.classifications[i];
            const imageUrl = classification.imageUrl;
            const objects = classification.objects;
        
            const img = new Image();
            img.onload = function() {
                // Maximum display dimensions
                const maxWidth = 800;
                const maxHeight = 600;

                // Calculate the scale factor to maintain aspect ratio
                const widthScale = maxWidth / img.width;
                const heightScale = maxHeight / img.height;
                const scale = Math.min(widthScale, heightScale);

                // Calculate the scaled dimensions
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;

                const canvas = document.createElement('canvas');
                canvas.classList.add('result-image');
                canvas.width = scaledWidth;
                canvas.height = scaledHeight;
                canvas.style.border = '2px solid white';
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight); //draw image onto canvas

                objects.forEach(obj => { //draw box around object and label it
                    const vertices = obj.boundingPoly.normalizedVertices; //get corners of bounding box
                    ctx.beginPath();
                    ctx.lineWidth = 4; // Make bounding box thick
                    ctx.strokeStyle = 'yellow'; // Change bounding box color to yellow for visibility
                    vertices.forEach((v, index) => { //draw box onto image
                        const x = v.x * scaledWidth;
                        const y = v.y * scaledHeight;
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
                    ctx.fillText(`${obj.name}: ${obj.confidence}%`, vertices[0].x * scaledWidth, vertices[0].y * scaledHeight - 10);
                    //write name of object and confidence value
                });

                // In order to preserve original image dimensions
                const canvasWrapper = document.createElement('div');
                canvasWrapper.style.width = `${scaledWidth}px`;
                canvasWrapper.style.height = `${scaledHeight}px`;
                canvasWrapper.appendChild(canvas);
        
                // Create carousel item
                const carouselItem = document.createElement('div');
                carouselItem.classList.add('carousel-item');
                if (i === 0) carouselItem.classList.add('active');
                carouselItem.appendChild(canvas);
                carouselInner.appendChild(carouselItem);
            };
            img.src = imageUrl;
        }

        // Append carousel to results container
        resultsContainer.appendChild(carouselContainer);

        // Add carousel controls
        if (data.classifications.length > 1) {
            const prevControl = document.createElement('a');
            prevControl.classList.add('carousel-control-prev');
            prevControl.href = '#classificationCarousel';
            prevControl.setAttribute('role', 'button');
            prevControl.setAttribute('data-bs-slide', 'prev');
            prevControl.innerHTML = '<span class="carousel-control-prev-icon" aria-hidden="true"></span><span class="visually-hidden">Previous</span>';
            
            const nextControl = document.createElement('a');
            nextControl.classList.add('carousel-control-next');
            nextControl.href = '#classificationCarousel';
            nextControl.setAttribute('role', 'button');
            nextControl.setAttribute('data-bs-slide', 'next');
            nextControl.innerHTML = '<span class="carousel-control-next-icon" aria-hidden="true"></span><span class="visually-hidden">Next</span>';

            carouselContainer.appendChild(prevControl);
            carouselContainer.appendChild(nextControl);
        }
    }
    localStorage.removeItem('classificationResults');
});
