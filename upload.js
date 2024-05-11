document.getElementById('image-input').addEventListener('change', function(e) {
    const files = e.target.files;
    const previewContainer = document.getElementById('preview-container'); //create new class for preview image
    previewContainer.innerHTML = ''; //clear any existing content
    previewContainer.classList.remove('image-preview-placeholder'); //remove placeholder class after selecting image

    //create the carousel container
    const carouselContainer = document.createElement('div');
    carouselContainer.id = 'carouselControls';
    carouselContainer.classList.add('carousel', 'slide');
    carouselContainer.setAttribute('data-bs-ride', 'carousel');

    //create carousel inner
    const carouselInner = document.createElement('div');
    carouselInner.classList.add('carousel-inner');

    for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const carouselItem = document.createElement('div');
            carouselItem.classList.add('carousel-item');
            if (i === 0) carouselItem.classList.add('active'); //first image is shown in preview

            const img = document.createElement('img');
            img.src = event.target.result;
            img.classList.add('image-preview');
            img.style.objectFit = 'contain';
            img.style.height = 'auto';
            img.style.width = 'auto';

            carouselItem.appendChild(img);
            carouselInner.appendChild(carouselItem);
        };
        reader.readAsDataURL(files[i]);
    }

    carouselContainer.appendChild(carouselInner);

    //add carousel controls (left and right button + indicators) if there is more than 1 image
    if (files.length > 1) {

        const indicators = document.createElement('ol');
        indicators.classList.add('carousel-indicators');
        for (let i = 0; i < files.length; i++) {
            const indicator = document.createElement('li');
            indicator.setAttribute('data-bs-target', '#carouselControls');
            indicator.setAttribute('data-bs-slide-to', i);
            if (i === 0) indicator.classList.add('active');
            indicators.appendChild(indicator);
        }
        carouselContainer.prepend(indicators);

        const prevControl = document.createElement('a');
        prevControl.className = 'carousel-control-prev';
        prevControl.href = '#carouselControls';
        prevControl.role = 'button';
        prevControl.setAttribute('data-bs-slide', 'prev');
        const prevIcon = document.createElement('span');
        prevIcon.className = 'carousel-control-prev-icon';
        prevIcon.setAttribute('aria-hidden', 'true');
        const prevScreenReader = document.createElement('span');
        prevScreenReader.className = 'visually-hidden';
        prevScreenReader.innerText = 'Previous';
        prevControl.appendChild(prevIcon);
        prevControl.appendChild(prevScreenReader);

        const nextControl = document.createElement('a');
        nextControl.className = 'carousel-control-next';
        nextControl.href = '#carouselControls';
        nextControl.role = 'button';
        nextControl.setAttribute('data-bs-slide', 'next');
        const nextIcon = document.createElement('span');
        nextIcon.className = 'carousel-control-next-icon';
        nextIcon.setAttribute('aria-hidden', 'true');
        const nextScreenReader = document.createElement('span');
        nextScreenReader.className = 'visually-hidden';
        nextScreenReader.innerText = 'Next';
        nextControl.appendChild(nextIcon);
        nextControl.appendChild(nextScreenReader);

        carouselContainer.appendChild(prevControl);
        carouselContainer.appendChild(nextControl);

    }

    previewContainer.appendChild(carouselContainer);
});


document.getElementById('upload-form').addEventListener('submit', function(e) {
    e.preventDefault();
    var startTime = Date.now(); //get timestamp when user submits form
    var formData = new FormData();
    var imageFiles = document.getElementById('image-input').files;
    for (var i = 0; i < imageFiles.length; i++) {
        formData.append('images', imageFiles[i]); //add all selected images to form
    }

    fetch('https://inbound-augury-413219.nw.r.appspot.com/upload', { //URL for google app engine server
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        var latency = Date.now() - startTime; //calculate latency using startTime
        data.latency = latency; //append latency to the data
        localStorage.setItem('classificationResults', JSON.stringify(data)); //store data in local storage
        window.location.href = 'results.html'; //navigate to results page
    })
    .catch(error => {
        console.error(error);
    });
});
