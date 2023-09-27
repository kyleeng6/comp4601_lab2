function validateForm() {
	// Getting user input
	const productName = document.getElementById('product-name').value;
	const productPrice = +document.getElementById('product-price').value;
	const productXDim = +document.getElementById('product-x-dimension').value;
	const productYDim = +document.getElementById('product-y-dimension').value;
	const productZDim = +document.getElementById('product-z-dimension').value;
	const productStock = +document.getElementById('product-stock').value;
	
	// Input validation
	if (productName === '') {
		alert('Enter a valid product name!');
	} else if (productPrice <= 0) {
		alert('Enter a valid price!');
	} else if (productXDim <= 0 || productYDim <= 0 || productZDim <= 0) {
		alert('Enter valid product dimensions!');
	} else if (productStock < 0) {
		alert('Stock can have a minimum value of 0!');
	} else {
		let newProduct = {
			name: productName,
			price: productPrice,
			dimensions: {x:productXDim,y:productYDim,z:productZDim},
			stock: productStock
		} 

		let xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 201) {
				alert('Server added product succesfully');
				window.location.href = xhttp.responseText;
			} else if (this.readyState == 4 && this.status == 404) {
				alert('Error adding product')
			}
		};

		xhttp.open('POST', '/products');			
		xhttp.setRequestHeader('Content-Type', 'application/json');
		let data = JSON.stringify(newProduct);
		xhttp.send(data);
	}
}