// ============================== COMP 4601 - Lab #1 ============================== //
/*
	Lab #2
    COMP 4601
    Carleton University

    Kyle Eng
	101192595
*/

// ============================ MODULES + DECLARATIONS ============================ //

// GLOBAL VARIABLES
const port = 3000;						// SERVER PORT = 3000
const uri = 'mongodb://127.0.0.1'; 		// MONGODB URI

// MODULES
const express = require('express');     
const app = express();
const fs = require('fs');                  
const path = require('path');           

// const mongo = require('mongodb');
// const mc = mongo.MongoClient;
const { MongoClient } = require("mongodb");
const mc = new MongoClient(uri);
const db = mc.db("L2-DB");

// MIDDLEWARE
app.use(express.static(__dirname + '/public'));	// use public folder for serving static files
app.use(express.json());			
app.use(express.urlencoded({extended: true}));

// TEMPLATE ENGINE SETUP 
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

// Output the request method and url for each request sent to the server
app.use ((req, res, next)=> {
	console.log(`${req.method}: ${req.url}`);
	next();
});

// ========================= HELPER FUNCTIONS =============================== //

// // helper function to send a ress
// function sendres(res, code, message){
// 	res.statusCode = code;
// 	res.write(message);
// 	res.end();
// }

// Read products.json and intialize the database with its information


// Event listener to gracefully close the MongoDB connection on server shutdown
// process.on('SIGINT', async () => {
// 	try {
// 		console.log('Closing MongoDB connection...');
// 		await mongoClient.close();
// 		console.log('MongoDB connection closed.');
// 		server.close(() => {
// 			console.log('Express server stopped.');
// 		});
// 	} catch (error) {
// 		console.error('Error closing MongoDB connection:', error);
// 		process.exit(1); // Exit with an error code
// 	}
// });


async function connectMongo() {
	try {
		await mc.connect();
		console.log("[Connected to MongoDB database.]");
	} catch (err){
		console.log("[Error connecting to MongoDB database]", err);
		throw err;
	}
}

function initServer() {
	fs.readFile('products/products.json', 'utf8', function(err, contents) {
		if (err) {
			console.log('Error: Could not parse products.json', err);
			return;
		}
	
		const data = JSON.parse(contents);
		for (let product of data) { 
			product.reviews = [];
		}
		//console.log(data);

		// Reset + Initialize Database
		db.collection('products').drop((err) => {
			if (err) {
				console.log('[Error: Could not drop "products\" collection.]', err);
				return;
			}
			console.log("[Success: \"products\" collection dropped.]");
			db.collection('products').insertMany(data, function(err){
				if (err) {
					console.log('[Error: Could not initialize "products\" collection.]', err);
					return;
				}
				console.log("[Success: \"products\" collection initialized.]");
				app.listen(port, () => {
					console.log(`[Success: Your application is running on port ${port}.]`);
				});
			});
		});
	});
}



// ============================== CONNECT TO DATABASE ============================== //
connectMongo();
initServer();

// ================================ SERVER ROUTES ================================= //

// GET ROUTES
app.get(['/', '/home'], sendHome);							// Sends home page (HTML)
app.get(['/add-product'], sendAddProduct);					// Sends the add product page (HTML)
app.get(['/products'], sendProducts);						// Sends products (JSON) || products page (HTML)
app.get(['/products/:productid'], sendProduct);				// Sends product (JSON) || product page (HTML)
app.get(['/products/:productid/reviews'], sendReviews);		// Sends product reviews (JSON) || product reviews page (HTML)

app.get(['/orders'], sendOrders);							// Sends orders (JSON)
app.get(['/orders/:orderid'], sendOrder);					// Sends singular order (JSON)

// POST ROUTES
app.post(['/products'], addProduct);						// Creates a new product
app.post(['/reviews'], addReview);							// Creates a new review for a product

app.post(['/orders'], addOrder);							// Creates a new review for a product



/*


an order must contain 
the name of the person making the purchase, 
a set of products being purchased, 
as well as the quantity of each product

Upon receiving an order request, your server must check that the order is
valid (all products in the order exist and enough quantity of each is in-stock to fulfill this order). 


COMP 4601A – Fall 2023 – Lab #2 Due 11:59pm Sunday, October 1st, 2022
2
being purchased. 



*/


// ================================ SERVER FUNCTIONS ================================= //

// FUNCTIONS FOR GET ROUTES
function sendHome(req, res){
	res.render('pages/home');
}

function sendAddProduct(req, res){
	res.render('pages/add-product');
}

function sendProducts(req, res){
	const name = req.query.name ? req.query.name : '';
	const inStockOnly = req.query.inStock ? req.query.inStock : 'false';
	
	let query = {};
	if (name != '') { query.name = {$regex : name, $options: 'i'} };
	if (inStockOnly != 'false') { query.stock = {$gt : 0} };
	// console.log(query);
	db.collection("products").find(query).toArray(function(err, result){
		if(err) {
			console.log('[Error: ([GET] Products) => Could not query products.]');
			res.status(400);
			res.set('Content-Type', 'text/plain');
			res.send('[Error: ([GET] Products) => Could not query products. Bad Request.]');
			return;
		}
		res.format ({
			'text/html': ()=> {
				res.status(200);
				res.set('Content-Type', 'text/html');
				res.render('pages/products', {inventory: result});
			},
			'application/json': ()=> {
				res.status(200);
				res.set('Content-Type', 'application/json');
				res.json(result);
			},
			'default': ()=> { 
				res.status(406);
				res.set('Content-Type', 'text/plain');
				res.send('[Error: ([GET] Product) => Requested format in Accept header is not supported.]');
			}
		});
	});
}

function sendProduct(req, res){
	const productID = +req.params.productid;
	let query = {
		id : {'$eq' : productID}
	};
	console.log(query);

	db.collection("products").findOne(query, function(err, result) {
		if(err) {
			console.log('[Error: ([GET] Product) => Could not query product.]');
			res.status(400);
			res.set('Content-Type', 'text/plain');
			res.send('[Error: ([GET] Product) => Could not query product. Bad Request.]');
			return;
		}
		console.log(result);
		if (result == null) {
			console.log('[Error: ([GET] Product) => Product Does not Exist.]');
			res.status(404);
			res.set('Content-Type', 'text/plain');
			res.send('[Error: ([GET] Product) => Product Could not be Found.]');
			return;
		}
		let avgRating = -1;
		if (result.reviews.length !== 0) {
			let sum = 0;
			let tot = 0;
			console.log(result.reviews)
			for (const rating of result.reviews) {
				sum += rating;
				tot += 1;
			}
			avgRating = sum/tot;
		}
		//console.log(avgRating)

		res.format ({
			'text/html': ()=> {
				res.status(200);
				res.set('Content-Type', 'text/html');
				res.render('pages/product', {product: result, avgRating: avgRating});
			},
			'application/json': ()=> {
				res.status(200);
				res.set('Content-Type', 'application/json');
				res.json(result);
			},
			'default': ()=> { 
				res.status(406);
				res.set('Content-Type', 'text/plain');
				res.send('[Error: ([GET] Product) => Requested format in Accept header is not supported.]');
			}
		});
	});
}

function sendReviews(req, res) {
	const productID = +req.params.productid;
	let query = {
		id : {'$eq' : productID}
	};
	console.log(query);

	db.collection("products").findOne(query, function(err, result) {
		if(err) {
			console.log('[Error: ([GET] Product) => Could not query product.]');
			res.status(400);
			res.set('Content-Type', 'text/plain');
			res.send('[Error: ([GET] Product) => Could not query product. Bad Request.]');
			return;
		}
		console.log(result);
		if (result == null) {
			console.log('[Error: ([GET] Product) => Product Does not Exist.]');
			res.status(404);
			res.set('Content-Type', 'text/plain');
			res.send('[Error: ([GET] Product) => Product Could not be Found.]');
			return;
		}

		let avgRating = -1;
		if (result.reviews.length !== 0) {
			let sum = 0;
			let tot = 0;
			console.log(result.reviews)
			for (const rating of result.reviews) {
				sum += rating;
				tot += 1;
			}
			avgRating = sum/tot;
		}
		//console.log(avgRating)

		res.format ({
			'text/html': ()=> {
				res.status(200);
				res.set('Content-Type', 'text/html');
				res.render(`pages/reviews`, {product: result, avgRating: avgRating});
			},
			'application/json': ()=> {
				res.status(200);
				res.set('Content-Type', 'application/json');
				res.json(result.reviews);
			},
			'default': ()=> { 
				res.status(406);
				res.set('Content-Type', 'text/plain');
				res.send('[Error: ([GET] Reviews) => Requested format in Accept header is not supported.]');
			}
		});
	});
}

function sendOrders() {}

function sendOrder() {}


// FUNCTIONS FOR POST ROUTES
function addProduct(req, res){
	try {
		const newProduct = req.body; 
		const newID = inventory.length; 
		newProduct.id = newID;
		newProduct.reviews = [];
		inventory.push(newProduct);
		//console.log(inventory);
		res.status(201);
		res.set('Content-Type', 'text/plain');
		res.send(`/products/${inventory[inventory.length-1].id}`)
    } catch (parseError) {
        console.error('Error Adding Product: ', parseError);
		res.status(404);
		res.set('Content-Type', 'text/plain');
		res.send('Error adding product');
    }
}

function addReview(req, res){
	const productID = req.body.id;
	const productRating = req.body.rating;
	let query = {
		id : {'$eq' : productID}
	};
	console.log(query);

	db.collection("products").updateOne(query, {$push: {reviews: productRating}}, function(err, result) {
		if(err) {
			console.log('[Error: ([POST] Reviews) => Could not query product.]');
			res.status(400);
			res.set('Content-Type', 'text/plain');
			res.send('[Error: ([POST] Reviews) => Could not query product. Bad Request.]');
			return;
		}
		console.log(result);
		if (result == null) {
			console.log('([Error: ([POST] Reviews) => Product Does not Exist. Review not added.]');
			res.status(404);
			res.set('Content-Type', 'text/plain');
			res.send('[Error: ([POST] Reviews) => Product Could not be Found. Review not added.]');
			return;
		}
		res.format ({
			'text/plain': ()=> {
				res.status(201);
				res.set('Content-Type', 'text/plain');
				res.send('[Success: review was added]');
			},
			'default': ()=> { 
				res.status(406);
				res.set('Content-Type', 'text/plain');
				res.send('[sendProducts()] => [Error: Requested format in Accept header is not supported.]');
			}
		});
	});
}

function addOrder() {}