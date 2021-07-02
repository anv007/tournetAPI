const util = require('util');
const jwt  =require('jsonwebtoken');
const  User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
const crypto = require('crypto');


const signToken = id => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN*24*60*60*1000),
        httpOnly: true 
    } 

    if(process.env.NODE_ENV === 'production') cookieOptions.secure=true;

    res.cookie('jwt', token, cookieOptions);

    user.password = undefined; //removing password from o/p of signing up

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user: user
        }
    });
}

exports.signup = catchAsync(async(req,res,next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
    });

    createSendToken(newUser,201,res);
});

exports.login = catchAsync(async (req,res,next) => {
    const email = req.body.email;
    const password = req.body.password;

    if(!email || !password){ //1) checking if email and password have been entered
        return next(new AppError('Please provide an email and password', 400));
    }

    const user = await User.findOne({email: email}).select('+password'); 

    if(!user || !(await user.correctPassword(password, user.password))) { 
        return next(new AppError('Incorrect email or password', 401));
    }

    createSendToken(user,200,res);
});

exports.protect = catchAsync( async(req,res,next) => {
    // checking if token exists
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    }
    if(!token){
        return next(new AppError('Only Logged in users can get access!', 401)); //401 means unauthorized
    }

    // verification of token
    const decoded = await util.promisify(jwt.verify)(token, process.env.JWT_SECRET);
    //console.log(decoded);

    // checking if user still exists
    const user = await User.findById(decoded.id);
    if(!user) {
        return next(new AppError('The user no longer exists'),401);
    }

    // checking if user changed password after token was issued
    if(user.changedPasswordAfter(decoded.iat)){
        return next(new AppError('Password for this user has been recently changed, Please login again',401));
    };

    //access granted to protected route
    req.user=user;
    next();
});

exports.restrictTo = (...roles) => { 
    return (req,res,next) => { 
        if(!roles.includes(req.user.role)){ 
            return next(new AppError('You do not have permission to perform this action', 403)); 
        }
        next();
    }
}

exports.forgotPassword = catchAsync( async (req,res,next) => {
    // get user based on email
    const user = await User.findOne({ email: req.body.email });  
    if(!user){
        return next(new AppError('No existing user found with this email address',404));
    }
    
    // generate random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false }); 
    
    //sending it to user's mail
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message = `If you have forgotten your password, submit a patch request with your new password to: ${resetURL}`;

    try{
        await sendEmail({   // sendEmail is an asynchronous func.
            email: user.email,
            subject: 'Password reset token',
            message
        });

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email'
        })
    } catch(err) {
        user.createPasswordResetToken =undefined;
        user.PasswordResetExpires =undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('There was an error sending the email'),500);
    }
})

exports.resetPassword = catchAsync( async(req,res,next) => {
    // get user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');  
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    // if token has not expired and user is there, set the new password 
    if(!user) {
        return next(new AppError('Token is invalid or expired', 400));
    }
    
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken =undefined;
    user.passwordResetExpires =undefined;
    await user.save();  
    
    // update the changedPasswordAt property for the user

    // log the user in, send JWT
    createSendToken(user,200,res);
})

exports.updatePassword = catchAsync( async(req,res,next) => {
    // get user from the collection
    const user = await User.findById(req.user.id).select('+password'); // we can use user.id as .protect middleware has already finished

    // check if posted password is correct
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your provided password is wrong', 401));
    }

    // update the password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();  // this time, we actually want the validators to run

    // log the user back in, send JWT
    createSendToken(user,200,res);
})
