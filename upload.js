document.getElementById('image-input').addEventListener('change', function(e) {
    const files = e.target.files;
    const previewContainer = document.getElementById('preview-container');
    previewContainer.innerHTML = ''; // Clear existing content
    previewContainer.classList.remove('image-preview-placeholder'); // Remove placeholder class

    // Create carousel container
    const carouselContainer = document.createElement('div');
    carouselContainer.id = 'carouselExampleControls';
    carouselContainer.classList.add('carousel', 'slide');
    carouselContainer.setAttribute('data-bs-ride', 'carousel');

    // Create carousel inner
    const carouselInner = document.createElement('div');
    carouselInner.classList.add('carousel-inner');

    for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const carouselItem = document.createElement('div');
            carouselItem.classList.add('carousel-item');
            if (i === 0) carouselItem.classList.add('active'); // First item active

            const img = document.createElement('img');
            img.src = event.target.result;
            img.classList.add('image-preview');
            img.style.objectFit = 'contain'; // Maintain aspect ratio within max dimensions
            img.style.height = 'auto'; // Auto-adjust height to maintain aspect ratio
            img.style.width = 'auto'; // Auto-adjust width to maintain aspect ratio

            carouselItem.appendChild(img);
            carouselInner.appendChild(carouselItem);
        };
        reader.readAsDataURL(files[i]);
    }

    carouselContainer.appendChild(carouselInner);

    // Add carousel controls
    if (files.length > 1) {

        const indicators = document.createElement('ol');
        indicators.classList.add('carousel-indicators');
        for (let i = 0; i < files.length; i++) {
            const indicator = document.createElement('li');
            indicator.setAttribute('data-bs-target', '#carouselExampleControls');
            indicator.setAttribute('data-bs-slide-to', i);
            if (i === 0) indicator.classList.add('active');
            indicators.appendChild(indicator);
        }
        carouselContainer.prepend(indicators);

        const prevControl = document.createElement('a');
        prevControl.className = 'carousel-control-prev';
        prevControl.href = '#carouselExampleControls';
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
        nextControl.href = '#carouselExampleControls';
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
    var startTime = Date.now();
    var formData = new FormData();
    var imageFiles = document.getElementById('image-input').files;
    for (var i = 0; i < imageFiles.length; i++) {
        formData.append('images', imageFiles[i]);
    }

    fetch('https://inbound-augury-413219.nw.r.appspot.com/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        var latency = Date.now() - startTime; // Calculate latency
        data.latency = latency; // Append latency to the data
        localStorage.setItem('classificationResults', JSON.stringify(data));
        window.location.href = 'results.html';
    })
    .catch(error => {
        console.error(error);
    });
});
