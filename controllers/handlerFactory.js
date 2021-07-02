const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const { Model } = require('mongoose');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = Model => catchAsync(async (req,res,next) => {

    const doc = await Model.findByIdAndDelete(req.params.id); 

    if(!doc){
        return next(new AppError('No Document found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });

});

exports.updateOne = Model => catchAsync(async (req,res,next) => {

    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true, //this makes the new updated doc to be returned
        runValidators: true
    }); 
    
    if(!doc){
        return next(new AppError('No Document found with that ID', 404)); 
    }

    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    });
});

exports.createOne = Model => catchAsync(async (req,res,next) => { //used middleware above to add body to the req object
    //console.log(req.body);

    const doc = await Model.create(req.body);

    res.status(201).json({  
        status:"success",
        data: {
            data: doc
        }
    });
});

exports.getOne = (Model,popOptions) => catchAsync(async (req,res,next) => { // http request to get certain data 
    let query = Model.findById(req.params.id);
    if(popOptions) query = query.populate(popOptions);
    const doc = await query;//const doc = await Model.findById(req.params.id).populate('reviews'); 

    if(!doc){
        return next(new AppError('No Document found with that ID', 404)); 
    }

    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    });
    
});

exports.getAll = Model => catchAsync(async (req,res,next) => { // http request to get all the data
    
    let filter = {}; //to allow for nested GET reviews on tour
    if(req.params.tourId) filter = {tour: req.params.tourId};

    //EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
    const doc = await features.query;//.explain();
    
    res.status(200).json({
        status: 'success',
        results: doc.length,
        data: {
            data: doc
        }
    });
});