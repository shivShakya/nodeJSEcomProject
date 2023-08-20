import mongoose from 'mongoose';
import env from 'dotenv';
env.config();

//Connect with Database
export async function connectToDatabase(){

    try{
      await mongoose.connect(process.env.DATABASE_URL,{
           useNewUrlParser : true,
           useUnifiedTopology : true,
      });
      console.log("Successfully connected");
    }catch(err){
          console.error({Err : err.message});
    }
}

