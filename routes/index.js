'use strict';

var express = require('express');
var async = require('async');
var router = express.Router();
var passport = require('../lib/passport');
var bcrypt = require('bcrypt');
var User = require('../models/user');

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', {
		title: 'Express'
	});
});

/* AUTHENTICATION ROUTES */
router.route('/login')
	.get(function(req, res, next) {
		res.sendStatus(405);
	})
	.post(passport.authenticate('local', {
		successRedirect: '/',
		failureRedirect: '/login'
	}));

router.route('/logout')
	.all(function(req, res, next) {
		if (!req.user) {
			var err = new Error('User not logged in.');
			return next(err);
		}
		req.logout();
		res.sendStatus(200);
	});

router.route('/signup')
	.get(function(req, res, next) {
		res.sendStatus(405);
	})
	.post(function(req, res, next) {
		console.log('inside /singup');

		console.log(req.body);
		if (!req.body || !req.body.username || !req.body.password) {
			var err = new Error('No credentials.');
			return next(err);
		}

		async.waterfall([
			function(calllater) {
				bcrypt.genSalt(16, calllater);
				console.log('bcrypt.genSalt');
			},
			function(salt, calllater) {
				bcrypt.hash(req.body.password, salt, calllater);
				console.log('bcrypt.hash');
			},
			function(hash, calllater) {
				console.log('call later: ', calllater);
				console.log('===req.body.username: ', req.body.username);
				User.create({
					username: req.body.username,
					email: req.body.email,
					password: hash,
					dob: req.body.dob,
					phone_number: req.body.phone_number,
					address_book: {
						primary_address: {
							name: {
								last: req.body.lastname,
								first: req.body.firstname
							},
							address: req.body.address
						}
					}
				}).then(function(user) {
					console.log('create user then');
					calllater(null, user);
				}).catch(calllater);
			}
		], function(err, result) {
			if (err) {
				// make error handler
				return next(err);
			}
			res.sendStatus(201);
		});
	});

router.route('/changePassword')
	.get(function(req, res, next) {
		res.sendStatus(405);
	})
	.put(function(req, res, next) {

		// check that user is logged
		if (!req.user) {
			var err = new Error('User not logged in.');
			return next(err);
		}

		// check that body contains a passport value
		if (!req.body || !req.body.password) {
			var err = new Error('No credentials.');
			return next(err);
		}
		async.waterfall([
			// bcrypt the password
			function(calllater) {
				bcrypt.genSalt(16, calllater);
			},
			function(salt, calllater) {
				bcrypt.hash(req.body.password, salt, calllater);
			},
			// update the Users db row with the new localPass value
			function(hash, calllater) {
				req.user.update({
					password: hash,
				}).then(function(user) {
					calllater(null, user);
				}).catch(calllater);
			}
		], function(err, result) {
			if (err) {
				// make error handler
				return next(err);
			}
		});
		// send a server response
		res.sendStatus(202);
	});

module.exports = router;
