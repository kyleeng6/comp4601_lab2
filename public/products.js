function init() {
	let inStockCheckbox = document.getElementById("in-stock")
	inStockCheckbox.addEventListener('change', function() {
		if (inStockCheckbox.checked) {
			inStockCheckbox.value = true;
		} else {
			inStockCheckbox.value = false;
		}
	});

	if (inStockCheckbox.checked) {
		inStockCheckbox.value = true;
	} else {
		inStockCheckbox.value = false;
	}

}



function searchQuery() {
	// Getting user input
	const name = document.getElementById('search-bar').value;
	const inStock = document.getElementById("in-stock").value
	//console.log(name);
	//console.log(inStock);
	window.location.href = `./products?name=${name}&inStock=${inStock}`
}