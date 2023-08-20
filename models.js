import mongoose from "mongoose";

//User Schema
const UserSchema = mongoose.Schema({
    'name' : String,
    'phone' : {type : mongoose.Schema.Types.Number},
    'email' : String,
    'password': String,
});

export const User = mongoose.model('users',UserSchema);

//Category Schema
const CategorySchema = mongoose.Schema({
    'category': String,
    'productID': [{type : mongoose.Schema.Types.ObjectId}]
});

export const Category = mongoose.model('category',CategorySchema);

//Product Schema
const ProductSchema = mongoose.Schema({
     'title' : String,
     'price' : {type : mongoose.Schema.Types.Number},
     'description' : String,
     'avilability' : {type : mongoose.Schema.Types.Number},
     'categoryID': {type : mongoose.Schema.Types.ObjectId}
});

export const Product = mongoose.model('product',ProductSchema);

//Cart Schema
const CartSchema = mongoose.Schema({
 'title' : String,
 'price' : {type : mongoose.Schema.Types.Number},
 'description' : String,
 'avilability' : {type : mongoose.Schema.Types.Number},
 'userID' : String,
 'categoryID': String
});

export const Cart = mongoose.model('cart',CartSchema);


//Order Schema
const OrderSchema = mongoose.Schema({
 'title' : String,
 'price' : {type : mongoose.Schema.Types.Number},
 'description' : String,
 'userID' : String,
 'categoryID': String
});

export const Order = mongoose.model('order',OrderSchema);
