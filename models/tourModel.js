const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator'); // npm lib. for validators and sanitizers
const User = require('./userModel');

const tourSchema = new mongoose.Schema({  // a schema with which we will build our model
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
        trim: true, // removes white spaces in beginning and end
        maxlength: [40, 'Tour name must have less than or equal to 40 characters'],
        minlength: [5, 'Tour name must have more than or equal to 5 characters']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: { // only for strings not numbers
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either easy,medium or difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.0,
        min: [1, 'Rating must be more or equal to 1.0'],
        max: [5, 'Rating must be less or equal to 5.0'],
        set: val => Math.round(val * 10)/ 10
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val) { 
                return val < this.price; 
            },
            message: 'Discount price ({VALUE}) should be less than regular price'
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a description']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a coverimage']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false // to prevent sending this field to the client
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocations: { 
        type: {
            type: String,
            default: 'Point',
            enum: ['Point'] 
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point'] 
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [  //child referencing
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
}, {
    toJSON: {virtuals: true}, 
    toObject: {virtuals: true}
});

//tourSchema.index({price: 1}); 
tourSchema.index({price: 1, ratingsAverage: -1});
tourSchema.index({slug: 1});

tourSchema.virtual('durationWeeks').get(function() {  
    return this.duration / 7;
});

//VIRTUAL POPULATE=>
tourSchema.virtual('reviews', { 
    ref: 'Review',
    foreignField: 'tour', 
    localField: '_id'  
});

// DOCUMENT MIDDLEWARE (runs before the .save() and .create() (not with insertMany etc))
tourSchema.pre('save', function(next) {  
    this.slug = slugify(this.name, {lower: true});
    next();
});

//QUERY MIDDLEWARE

tourSchema.pre(/^find/, function(next) { 
    this.find({ secretTour: {$ne:true} }); 
    this.start = Date.now();
    next();
});
tourSchema.pre(/^find/, function(next) { //to populate the tour docs with guides
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });
    next();
});
tourSchema.post(/^find/, function(docs,next) {
    console.log(`Time taken by the query: ${Date.now() - this.start} ms`);
    //console.log(docs);
    next();
});


//AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function(next) {
    this.pipeline().unshift({ $match: {secretTour: {$ne: true}} });
    console.log(this.pipeline());
    next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;