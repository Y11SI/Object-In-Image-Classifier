document.addEventListener('DOMContentLoaded', () => {
    const data = JSON.parse(localStorage.getItem('classificationResults'));
    if (data && data.classifications) {
        const resultsContainer = document.getElementById('output-container');
        resultsContainer.innerHTML = '';
        
        //display latency in seconds
        const latencyInfo = document.createElement('p');
        latencyInfo.textContent = `Your image was processed in: ${(data.latency / 1000).toFixed(3)} seconds.`;
        resultsContainer.appendChild(latencyInfo);

        //create carousel container
        const carouselContainer = document.createElement('div');
        carouselContainer.id = 'classificationCarousel';
        carouselContainer.classList.add('carousel', 'slide');
        carouselContainer.setAttribute('data-bs-ride', 'carousel');

        //create carousel inner
        const carouselInner = document.createElement('div');
        carouselInner.classList.add('carousel-inner');
        carouselContainer.appendChild(carouselInner);

        //create indicators if there is more than one image
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

        //create result images to display
        for (let i = 0; i < data.classifications.length; i++) {
            const classification = data.classifications[i];
            const imageUrl = classification.imageUrl;
            const objects = classification.objects;
        
            const img = new Image();
            img.onload = function() {
                //maximum image dimensions
                const maxWidth = 800;
                const maxHeight = 600;

                //calculate the scale to maintain the image's aspect ratio
                const widthScale = maxWidth / img.width;
                const heightScale = maxHeight / img.height;
                const scale = Math.min(widthScale, heightScale);

                //calculate the scaled dimensions
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;

                //use canvas elements to draw the image with the results overlayed on top
                const canvas = document.createElement('canvas');
                canvas.classList.add('result-image');
                canvas.width = scaledWidth; //match dimensions with image
                canvas.height = scaledHeight;
                canvas.style.border = '2px solid white'; //add white border to image for aesthetics
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight); //draw image onto canvas

                //draw box around object and label it
                objects.forEach(obj => {
                    const vertices = obj.boundingPoly.normalizedVertices; //get corners of bounding box
                    ctx.beginPath();
                    ctx.lineWidth = 4; //make bounding box thick
                    ctx.strokeStyle = 'yellow'; //change bounding box color to yellow for visibility
                    vertices.forEach((v, index) => { //draw box onto image
                        const x = v.x * scaledWidth; //normalise coordinates to scaled image size
                        const y = v.y * scaledHeight;
                        if (index === 0) {
                            ctx.moveTo(x, y); //start drawing from first vertex
                        } else {
                            ctx.lineTo(x, y); //draw line to next vertex
                        }
                    });
                    ctx.closePath();
                    ctx.stroke();
                    ctx.fillStyle = 'blue'; //change text color to blue
                    ctx.font = 'bold 18px Arial'; //make text strongly visible
                    ctx.fillText(`${obj.name}: ${obj.confidence}%`, vertices[0].x * scaledWidth, vertices[0].y * scaledHeight - 10);
                    //write name of object and confidence value
                });

                //create wrapper to ensure image is correctly displayed
                const canvasWrapper = document.createElement('div');
                canvasWrapper.style.width = `${scaledWidth}px`;
                canvasWrapper.style.height = `${scaledHeight}px`;
                canvasWrapper.appendChild(canvas);
        
                //create carousel item for the result image
                const carouselItem = document.createElement('div');
                carouselItem.classList.add('carousel-item');
                if (i === 0) carouselItem.classList.add('active');
                carouselItem.appendChild(canvas);
                carouselInner.appendChild(carouselItem);
            };
            img.src = imageUrl;
        }

        //append carousel to results container
        resultsContainer.appendChild(carouselContainer);

        //add carousel controls
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
    localStorage.removeItem('classificationResults'); //clear storage when finished
});
