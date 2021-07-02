const { match } = require('assert');
const { query } = require('express');
const fs = require('fs');
const Tour = require('../models/tourModel');
//const AppError = require('../utils/appError');

//const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');

const factory = require('./handlerFactory');

exports.aliasTopTours = (req,res,next) => { //a middleware to manipulate the query obj comin in
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};


exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req,res,next) => {  //(AGGREGATION PIPELINE)

    const stats = await Tour.aggregate([  
        {
            $match: { ratingsAverage: {$gte: 3.0} }
        },
        {
            $group: {
                _id: {$toUpper: '$difficulty'},
                numTours: { $sum: 1 },
                numRatings: { $sum:'$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
            }
        },
        {
            $sort: { avgPrice: 1 } 
        },
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    });
});

exports.getMonthlyPlan = catchAsync(async (req,res,next) => {

    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'  // makes a new doc from a single doc for each element of the array
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: {
                _id: 0 
            }
        },
        {
            $sort: { numTourStarts: -1 }
        },
        {
            $limit: 15
        }
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            plan
        }
    });
});
