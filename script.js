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
        // UI, display a success message.
    })
    .catch(error => {
        console.error(error);
        // UI, display an error message.
    });
});
