function submitReview() {
	// Getting user input
	let rating = +document.getElementById('rating').value;
	//console.log(rating);

	// Create new review as a JSON object to be sent to server
	const path_segments = window.location.pathname.split('/');
	let reviewObj = {
		id: +path_segments[path_segments.length-1],
		rating: rating
	}
	//console.log(reviewObj);

	// Alert user when review was added succesfully
	let xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && (this.status == 201 || this.status == 404)) {
			alert(xhttp.responseText);
			location.reload();
		}
	};

	// Send POST request
	xhttp.open('POST', '/reviews');			
	xhttp.setRequestHeader('Content-Type', 'application/json');
	xhttp.setRequestHeader('Accept', 'text/plain');
	let data = JSON.stringify(reviewObj);
	xhttp.send(data);
}

function viewAllReviews() {
	// Get ID of the product we are currently viewing
	const path_segments = window.location.pathname.split('/');
	const id = path_segments[path_segments.length-1]
	window.location.href = `./${id}/reviews`
}