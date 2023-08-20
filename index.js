import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import env from 'dotenv';
import bcrypt from 'bcrypt';
import { connectToDatabase } from './connect.js';
import { User, Category , Product ,Cart , Order} from './models.js';
env.config();

const app = express();

//use middleware
app.use(cors());
app.use(express.json());

//Hash function
async function genHashPassword(text) {
    const saltRounds = 10;
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        const hashPassword = await bcrypt.hash(text, salt);
        return hashPassword;
    } catch (error) {
        throw error;
    }
}

//authetification
async function authetification(req,res,next){
            try{
                const token = req.headers['authorization'];
                
                if(!token){
                    return res.status(401).json({error : "Missing authorized token"});
                }
                const decodedToken = jwt.verify(token,process.env.JWT_KEY);
                req.user = decodedToken;
                next();
                  
            }catch(err){
                console.log(err);
                return res.status(401).json({error : "Invalid token"});
            }
}

//Database Connection
connectToDatabase();


// User Authetification and Authorization


//Register
app.post('/register',async (req,res)=>{
   const {name , phone , email , password , confirmPassword} = req.body; 
   if(!name || !phone || !email || !password || !confirmPassword){
         return res.status(400).json({ error: "All fields are required" });
   }
   if(password != confirmPassword){
            return res.status(400).json({ error: "Passwords do not match" });
   }
   const hashedPassword = await genHashPassword(password);
   const newUser = new User({
       'name' : name,
       'phone' : phone,
       'email' : email,
       'password' : hashedPassword
    }); 

    try{
        const savedUser = await newUser.save();
        if(!savedUser){
            return res.status(500).json({ error: "Data could not be saved" });
        } 
        res.status(200).json({ message: "Saved Successfully" })
    }catch(err){
           res.status(500).json({ error : "An error occured during registration"});
    }
});


//login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
            const token = jwt.sign({ userId: user._id }, process.env.JWT_KEY, { expiresIn: '2h' });
            res.status(200).json({ message: "You have logged in successfully", token });
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    } catch (err) {
        res.status(500).json({ error: "Some error occurred during login" });
    }
});


//Category
app.get('/categories' ,authetification,async (req,res)=>{
     try{
         const categories =  await Category.find();
         res.status(200).json(categories);
     }catch(err){
           res.status(400).json({error : "Some error occured while fetching categories"});
     }
});

app.get('/categories/products/:id', authetification, async (req, res, next) => {
    try {
      const categoryId = req.params.id;
      const category = await Category.findOne({ _id: categoryId });
  
      if (!category) {
        res.status(401).json({ error: "Category not found" });
      } else {
        const data = category.productID;
  
        const handlePromise = data.map(async (prodID) => {
          const response = await Product.findOne({ _id: prodID });
          return response;
        });
  
        const fetchedProduct = await Promise.all(handlePromise);
        res.status(200).json({ responses: fetchedProduct });
      }
    } catch (err) {
      next(err); 
    }
  });
  


//Products

app.get('/products/:id',authetification ,async (req,res)=>{
         try{
             const productId = req.params.id;
             const product = await Product.findOne({ _id : productId});

             if(!product){
                res.status(404).json({error : "product not found"});
             }
             res.status(200).json({product});           
         }catch(err){
            res.status(400).json({error : "Some error occured while fetching products"});
         }
});


// Cart System
app.post('/cart/add',authetification ,async (req,res)=>{
        try{

           const productID = req.query.product_id;
           const userId = req.user.userId;

           const product = await Product.findOne({ _id : productID});

           if(!product){
            res.status(401).json({error : "product not found"});
          }
          if(!product.avilability){
              res.status(400).json({error : "Sorry, no product left. Cannot order."});
          }

           const response = await Cart({
                'title' : product.title,
                'price' : product.price,
                'description' : product.description,
                'avilability' : product.avilability,
                'userID' : userId,
                'categoryID': product.categoryID
           });
           const cartData = await response.save();
           if(!cartData){
                res.status(500).json({error : "Failed to save item in cart "});
           }
           res.status(200).json({message : "Product Successfully saved in cart"});   
        }catch(err){
            res.status(400).json({error : "Some error occured while adding to cart"});
        }
});

app.get('/cart/get',authetification,async (req,res)=>{
       try{  
             const userId = req.user.userId;
             console.log({userId});

             const query = { userId };
             const cart = await Cart.find(query);

             console.log({"Cart" : cart})
             res.status(200).json({cart});      
       }catch(err){
            res.status(500).json({error : "Some error while fetching cart"});
       }

});

app.delete('/cart/delete/:id',authetification,async (req,res)=>{
        try{
             const cartId = req.params.id;
             const response = await Cart.findByIdAndDelete(cartId);

             if(!response){
                res.status(404).json({error : "Item not found in cart"});
             }
             res.status(200).json({message : "deleted successfully"});        
        }catch(err){
            res.status(500).json({error : "Some error occured while deleting from cart"});
        }
});

app.put('/cart/update',authetification,async (req,res)=>{
      
      try{
             const cartId = req.query.cartID;

             const updateCartItem = await Cart.findOneAndUpdate(
                {_id : cartId},
                {$set : req.body},
                {new : true}
             );

             if (!updateCartItem) {
                return res.status(404).json({ error: "Cart item not found" });
            }
            res.status(200).json({ message: "Cart item updated successfully" });    
       }catch(err){
        res.status(500).json({error : "Some error occured while updating the cart"});
       }
});

//Order - 

app.post('/order/add', authetification, async (req, res) => {
    try {
        const productId = req.query.productId;
        const cartItem = await Cart.findOne({ _id: productId });

        if (!cartItem) {
            return res.status(404).json({ error: "Product not found in cart" });
        }
        const orderItem = new Order({
            title: cartItem.title,
            price: cartItem.price,
            description: cartItem.description,
            categoryID: cartItem.categoryID
        });
        const savedOrder = await orderItem.save();
        if (!savedOrder) {
            return res.status(500).json({ error: "Failed to save item in order" });
        }

        const updateProduct = await Product.findOneAndUpdate(
            {_id : productId},
            {$inc : {avilability : -1}},
            {new : true}
        );

        res.status(200).json({ message: "Product successfully saved in order" });
    } catch (err) {
        res.status(500).json({ error: "An error occurred while adding to order" });
    }
});



app.get('/order/history', authetification, async (req, res) => {
    try {
        const userId = req.user.userId;  
        const orders = await Order.find({ userId });
        res.status(200).json({ orders });
    } catch (err) {
        res.status(500).json({ error: "An error occurred while fetching order history" });
    }
});

app.get('/order/details/:id', authetification, async (req, res) => {
    try {
        const orderId = req.params.id;
        const orderDetails = await Order.findOne({ _id: orderId });

        if (!orderDetails) {
            return res.status(404).json({ error: "Order not found" });
        }
        res.status(200).json(orderDetails);
    } catch (err) {
        console.error("Error fetching order details:", err);
        res.status(500).json({ error: "An error occurred while fetching order details" });
    }
});


// Server 
app.listen(process.env.PORT,(err)=>{
      console.log(`Your server is started at http://localhost:${process.env.PORT} `)
});