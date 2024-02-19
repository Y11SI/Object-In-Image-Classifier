document.getElementById('image-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewContainer = document.getElementById('preview-container');
            previewContainer.innerHTML = ''; // Clear any existing content
            previewContainer.classList.remove('image-preview-placeholder'); // Remove placeholder class
            const previewImage = document.createElement('img');
            previewImage.src = e.target.result;
            previewImage.classList.add('image-preview');
            previewImage.style.maxWidth = '750px'; // Set maximum width
            previewImage.style.maxHeight = '500px'; // Set maximum height
            previewImage.style.width = 'auto'; // Ensure the width is auto to maintain aspect ratio
            previewImage.style.height = 'auto'; // Ensure the height is auto to maintain aspect ratio
            previewContainer.appendChild(previewImage);
        };
        reader.readAsDataURL(file);
    }
});

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
        localStorage.setItem('classificationResults', JSON.stringify(data));
        window.location.href = 'results.html';
    })
    .catch(error => {
        console.error(error);
    });
});
