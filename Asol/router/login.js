var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var mysql = require('mysql');
var crypto = require("crypto");
var cookieParser = require('cookie-parser');
var session = require('express-session');
var database = require('../util/asol_db');
var login = express();

login.use(bodyParser.json()); // for parsing application/json
login.use(bodyParser.urlencoded({
	extended : true
})); // for parsing application/x-www-form-urlencoded
login.use(multer()); // for parsing multipart/form-data
login.use(express.Router());

login.use(function(request, response, next) {
	console.log("/login middleware...");
	next();
});

//get 요청시 error
login.get('/', function(request, response){
	console.log("GET /login is called..");
	var output = [];
	output = {
			responseCode : 400,
			responseMessage : "Re-login with POST /login"
	};
	response.send(output);
});

login.post('/', function(request, response) {
	console.log("/login is requested..");
	var body = request.body;
	var key = "asol";

	//encryption
	var cipher = crypto.createCipher("aes128", key);
	var encryptedPassword = cipher.update(body.password, "utf-8", "hex");
	encryptedPassword += cipher.final("hex");

	var user = {
		phone : body.phone,
		pw : encryptedPassword
	};

	console.log("/login requested User Information : " + JSON.stringify(user));
	var dbConnection = database()
	var query = dbConnection.query("select * from USER where phone = "+ mysql.escape(body.phone) + " and pw=  "+ mysql.escape(encryptedPassword), function(err, result) {

		if (err) { //DB error
			console.log(err);
			var failResult = [];
			failResult.push(
					{
						responseCode : 500, //internal error
						responseMessage : "Server Internal Error"
					}
			);
			response.send(failResult);
			console.log("/login result : " + JSON.stringify(failResult));
		}
		else { // No error
			console.log(result);
			var successResult = [];
			var userInfo = [];
			userInfo.push(result);

			if (result.length > 0) {
				successResult.push(
						{
							responseCode : 200,
							responseMessage : "LoginSuccess",
							responseUserInfo : userInfo
						}
				);
			}
			else if (result.length === 0) {
				successResult.push(
						{
							responseCode : 400,
							responseMessage : "LoginFail"
						}
				);
			}
			response.send(successResult);
			//response.send(result);
			console.log("/login result : " + JSON.stringify(successResult));
		}
	}); //Insert
	dbConnection.end(); //Release DB Connection
});
module.exports = login;
