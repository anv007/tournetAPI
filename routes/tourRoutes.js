const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
//const reviewController = require('./../controllers/reviewController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();  

router.use('/:tourId/reviews', reviewRouter);

router.route('/top-5-rated')
.get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/monthly-plan/:year').get(authController.protect, authController.restrictTo('admin', 'lead-guide', 'guide'), tourController.getMonthlyPlan);

router.route('/tour-stats').get(tourController.getTourStats);

router.route('/')
.get(tourController.getAllTours)
.post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.createTour);

router.route('/:id')
.get(tourController.getTour)
.patch(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.updateTour)
.delete(authController.protect,authController.restrictTo('admin','lead-guide'),tourController.deleteTour);

module.exports = router;