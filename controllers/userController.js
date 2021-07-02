const User = require('../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach( el => {
        if(allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}

exports.getMe = (req,res,next) => {
    req.params.id = req.user.id;
    next();
}

exports.updateMe = catchAsync( async (req,res,next) => {
    // create error if user posts password data
    if(req.body.password || req.body.passwordConfirm) {
        return next(new AppError('Cannot update password using this route.',400));
    }

    // filter out unwanted field names that are not allowed to be updated
    const filterBody = filterObj(req.body, 'name', 'email'); 
    
    // update user doc
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
        new: true,
        runValidators: true
    }); 

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    })
})

exports.deleteMe = catchAsync( async (req,res,next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({ //204 means deleted
        status: 'success',
        data: null
    })
})

exports.createUser = (req,res) => {
    res.status(500).json({
        status: 'error',
        message: 'route not defined yet'
    });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User); //DO not update passwords with this
exports.deleteUser = factory.deleteOne(User);
